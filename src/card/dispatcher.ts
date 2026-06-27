import type { CardActionEvent, LarkChannel, NormalizedMessage } from '@larksuite/channel';
import type { AgentAdapter } from '../agent/types';
import type { ActiveRuns } from '../bot/active-runs';
import type { ChatModeCache } from '../bot/chat-mode-cache';
import type { PendingQueue } from '../bot/pending-queue';
import type { ProcessPool } from '../bot/process-pool';
import type { CallbackAuth } from './callback-auth';
import { resolveAskAnswers, type AskMapEntry } from './agent-card';
import { lockedCard } from './templates';
import { CARDKIT_SETTLE_MS, forgetManagedCard, isManaged, updateManagedCard } from './managed';
import { runCommandHandler, type CommandContext, type Controls } from '../commands';
import { log } from '../core/logger';
import { canUseDm, canUseGroup } from '../policy/access';
import type { RunExecutor } from '../runtime/run-executor';
import type { SessionCatalog } from '../session/catalog';
import type { SessionStore } from '../session/store';
import type { WorkspaceStore } from '../workspace/store';
import { commandSessionCatalogIdentity } from '../bot/session-catalog-identity';

/** Marker key on a button's value object that flags the cardAction as
 * a callback that should be forwarded back to the agent instead
 * of dispatched to a built-in command handler. The double-underscore
 * sigils make it virtually impossible to collide with normal payload
 * fields the agent might set.
 */
const BRIDGE_CALLBACK_MARKER = '__bridge_cb';
const LEGACY_CLAUDE_CALLBACK_MARKER = '__claude_cb';
/** Map of form fields → questions, baked into a questions-form submit value. */
const ASK_MAP_MARKER = '__ask';

export interface CardDispatchDeps {
  channel: LarkChannel;
  evt: CardActionEvent;
  sessions: SessionStore;
  sessionCatalog?: SessionCatalog;
  workspaces: WorkspaceStore;
  activeRuns: ActiveRuns;
  agent: AgentAdapter;
  processPool?: ProcessPool;
  runExecutor?: RunExecutor;
  controls: Controls;
  pending: PendingQueue;
  chatModeCache: ChatModeCache;
  callbackAuth?: CallbackAuth;
  callbackPolicyFingerprint?: string;
  callbackPolicyFingerprintForScope?: (scope: string) => string | undefined;
}

export async function handleCardAction(deps: CardDispatchDeps): Promise<void> {
  const value = deps.evt.action.value;
  if (!value || typeof value !== 'object') return;
  const payload = value as Record<string, unknown>;

  const operatorId = deps.evt.operator.openId;
  const chatId = deps.evt.chatId;

  // CardKit 2.0 form submits drop user-input values from action.value; they
  // arrive on raw.action.form_value. The SDK forwards the raw event when
  // includeRawEvent: true is set on the channel options.
  const raw = (deps.evt as CardActionEvent & { raw?: unknown }).raw as
    | { action?: { form_value?: Record<string, unknown> } }
    | undefined;
  const formValue = raw?.action?.form_value;

  // Resolve the click's session scope. For topic groups we need to know
  // the message's thread_id so the action targets the right topic's
  // session — look up the carrier message (the card lives on it) once.
  // Done before the access check so we know the chat mode (p2p vs group)
  // and can skip the chat allowlist for DMs.
  const { scope, threadId, mode } = await resolveScope(deps);

  const accessDecision =
    mode === 'p2p'
      ? canUseDm(deps.controls.profileConfig, deps.controls, operatorId)
      : canUseGroup(deps.controls.profileConfig, deps.controls, chatId, operatorId);
  if (!accessDecision.ok) {
    log.info('cardAction', 'skip-not-allowed-user', {
      operator: operatorId.slice(-6),
      reason: accessDecision.reason,
    });
    return;
  }

  if (LEGACY_CLAUDE_CALLBACK_MARKER in payload) {
    log.info('cardAction', 'skip-legacy-callback-marker', { scope });
    return;
  }

  const cmd = typeof payload.cmd === 'string' ? payload.cmd : '';
  if (cmd) {
    if (isSignedBridgeCallback(payload) && verifyBridgeToken(deps, payload, scope, cmd) !== null) {
      return;
    }
    log.info('cardAction', 'cmd', { cmd, scope });
    const msg = makeFakeMsg(deps.evt, threadId);

    const ctx: CommandContext = {
      channel: deps.channel,
      msg,
      scope,
      chatMode: mode,
      sessions: deps.sessions,
      sessionCatalog: deps.sessionCatalog,
      sessionCatalogIdentity: await commandSessionCatalogIdentity({
        msg,
        scope,
        mode,
        workspaces: deps.workspaces,
        controls: deps.controls,
        access: accessDecision,
      }),
      workspaces: deps.workspaces,
      activeRuns: deps.activeRuns,
      agent: deps.agent,
      processPool: deps.processPool,
      runExecutor: deps.runExecutor,
      controls: deps.controls,
      formValue,
      fromCardAction: true,
    };

    const [name, ...rest] = cmd.split('.');
    const sub = rest.join(' ');
    const args = composeArgs(sub, payload);

    try {
      const ok = await runCommandHandler(name ?? '', args, ctx);
      if (!ok) log.warn('cardAction', 'unknown', { cmd });
    } catch (err) {
      log.fail('cardAction', err, { cmd });
    }
    return;
  }

  // Agent-driven callback: the button was rendered by the bridge from a card
  // the agent authored, with `__bridge_cb` on the value. Forward the click back
  // into the scope's pending queue so the agent resumes its session and sees
  // the click as a follow-up message, with full context of what it sent.
  //
  // Agent card callback. The bridge SIGNS these when it renders them (operator
  // binding from `restrict`, single-use nonce, and a 24h expiry all live in the
  // signed token — see askCard). So if a token is present it must verify. The
  // tokenless path remains only for the degraded case where the bridge has no
  // signing key (no app secret resolved) — then the bot-authored, unforgeable
  // value is the trust anchor, same as the unsigned /status buttons.
  if (BRIDGE_CALLBACK_MARKER in payload) {
    if (typeof payload.bridge_token === 'string') {
      const reason = verifyBridgeToken(deps, payload, scope, 'agent_callback');
      if (reason !== null) {
        if (reason === 'expired') {
          try {
            await deps.channel.send(deps.evt.chatId, {
              text: '⏰ 这张卡片已过期，请重新发送你的需求，我会发一张新的。',
            });
          } catch {
            // best-effort notice
          }
        }
        return;
      }
    }
    // First valid click wins: lock the card into a "done" state (green header,
    // showing the choice, no buttons). Scheduled DETACHED + delayed (not awaited)
    // — Lark keeps the form locked while this handler is pending and snaps the
    // card back to its cached form on return, so an inline update flashes then
    // reverts. Returning immediately lets the snap-back happen first; the delayed
    // update then sticks. The nonce already blocks a real second submit.
    scheduleAgentCardLock(deps, payload, formValue);
    forwardToAgent(deps, payload, formValue, scope, threadId, mode);
    return;
  }

  return;
}

/**
 * Replace the just-clicked agent card with a locked "done" card. Managed cards
 * (the morphed markdown reply) update by card_id via the cardkit API; plain
 * inline cards (the fallback send / card-mode bubble) patch by message_id.
 * Best-effort — a failure here never blocks forwarding the click.
 */
function scheduleAgentCardLock(
  deps: CardDispatchDeps,
  payload: Record<string, unknown>,
  formValue: Record<string, unknown> | undefined,
): void {
  const messageId = deps.evt.messageId;
  if (!messageId) return;
  const managed = isManaged(messageId);
  const card = lockedCard(clickResultSummary(payload, formValue));
  void (async () => {
    await new Promise((resolve) => setTimeout(resolve, CARDKIT_SETTLE_MS));
    try {
      if (managed) {
        // Managed (cardkit) entity update — the reliable, /config-proven path.
        await updateManagedCard(deps.channel, messageId, card);
      } else {
        // Fallback for a plain inline card (no entity registered).
        await deps.channel.updateCard(messageId, card);
      }
    } catch (err) {
      log.warn('cardAction', 'lock-failed', {
        messageId,
        err: err instanceof Error ? err.message : String(err),
      });
    } finally {
      if (managed) forgetManagedCard(messageId); // release even if the update failed
    }
  })();
}

/** A human-readable summary of what the user picked, shown inside the locked
 * card so the result lives ON the card (not as a separate reply). */
function clickResultSummary(
  payload: Record<string, unknown>,
  formValue: Record<string, unknown> | undefined,
): string {
  const ask = payload[ASK_MAP_MARKER];
  if (Array.isArray(ask)) {
    const answers = resolveAskAnswers(ask as AskMapEntry[], formValue);
    return Object.entries(answers)
      .map(([q, a]) => `**${q}** ${Array.isArray(a) ? a.join('、') || '（空）' : a || '（空）'}`)
      .join('\n');
  }
  const { [BRIDGE_CALLBACK_MARKER]: _m, bridge_token: _t, ...rest } = payload;
  const vals = Object.values(rest)
    .filter((v) => typeof v === 'string' || typeof v === 'number')
    .map(String);
  return vals.length ? `你的选择:${vals.join('、')}` : '';
}

async function resolveScope(
  deps: CardDispatchDeps,
): Promise<{ scope: string; threadId: string | undefined; mode: 'p2p' | 'group' | 'topic' }> {
  const chatId = deps.evt.chatId;
  const mode = await deps.chatModeCache.resolve(deps.channel, chatId);
  if (mode !== 'topic') {
    return { scope: chatId, threadId: undefined, mode };
  }
  // Topic group — need the carrier message's thread_id to compose scope.
  // One API call per click; could cache by messageId if it ever becomes hot.
  const threadId = await lookupMessageThreadId(deps.channel, deps.evt.messageId);
  if (!threadId) {
    // Fall back to plain chatId. Better to land in the chat's "default"
    // scope than fail the click silently.
    return { scope: chatId, threadId: undefined, mode };
  }
  return { scope: `${chatId}:${threadId}`, threadId, mode };
}

async function lookupMessageThreadId(
  channel: LarkChannel,
  messageId: string,
): Promise<string | undefined> {
  try {
    // fetchRawMessage returns the raw `im.v1.message.get` items, which carry
    // `thread_id`. We intentionally avoid channel.fetchMessage() here: its
    // NormalizedMessage path rebuilds a synthetic raw event without
    // `thread_id`, so threadId always comes back undefined and topic-group
    // card clicks would fall back to the plain chatId scope (wrong session).
    const [parent] = await channel.fetchRawMessage(messageId);
    return (parent as { thread_id?: string } | undefined)?.thread_id;
  } catch (err) {
    log.warn('cardAction', 'thread-id-lookup-failed', {
      messageId,
      err: err instanceof Error ? err.message : String(err),
    });
    return undefined;
  }
}

function forwardToAgent(
  deps: CardDispatchDeps,
  payload: Record<string, unknown>,
  formValue: Record<string, unknown> | undefined,
  scope: string,
  threadId: string | undefined,
  mode: 'p2p' | 'group' | 'topic',
): void {
  // Strip markers + internal control fields so the agent only sees the
  // meaningful fields it set on the button.
  const {
    [BRIDGE_CALLBACK_MARKER]: _marker,
    bridge_token: _token,
    __ask,
    ...agentPayload
  } = payload;
  // A `questions` form submit carries an `__ask` map — resolve the raw
  // form_value into clean `{question: answer}` so the agent gets readable
  // answers instead of cryptic field names. Otherwise forward the button's
  // own fields (+ any form_value) as before.
  const merged = Array.isArray(__ask)
    ? { answers: resolveAskAnswers(__ask as AskMapEntry[], formValue) }
    : formValue
      ? { ...agentPayload, form_value: formValue }
      : agentPayload;
  log.info('cardAction', 'forward-agent', {
    scope,
    payload: JSON.stringify(merged).slice(0, 200),
  });
  const synthetic: NormalizedMessage = {
    messageId: deps.evt.messageId,
    chatId: deps.evt.chatId,
    chatType: mode === 'p2p' ? 'p2p' : 'group',
    threadId,
    senderId: deps.evt.operator.openId,
    senderName: deps.evt.operator.name,
    content: `[card-click] ${JSON.stringify(merged)}`,
    rawContentType: 'card_action',
    resources: [],
    mentions: [],
    mentionAll: false,
    mentionedBot: false,
    createTime: Date.now(),
  };
  deps.pending.push(scope, synthetic);
}

/**
 * Verify a signed bridge callback. Returns `null` when authorized, else a short
 * deny reason (e.g. 'expired', 'nonce-replay', 'context-mismatch') so the caller
 * can react — notably to tell the user a card expired.
 *
 * Agent callbacks (`action === 'agent_callback'`) are answered AFTER the turn
 * that sent the card has ended, so there is no active run and no per-scope
 * policy fingerprint: the bridge signs them run-independently (runId:'' /
 * policyFingerprint:''), and we verify the same way. Operator binding, single-
 * use nonce and expiry all still come from the token. Built-in command
 * callbacks (stop, etc.) keep their strict active-run binding.
 */
function verifyBridgeToken(
  deps: CardDispatchDeps,
  payload: Record<string, unknown>,
  scope: string,
  action: string,
): string | null {
  const isAgentCallback = action === 'agent_callback';
  const token = typeof payload.bridge_token === 'string' ? payload.bridge_token : '';
  const active = deps.activeRuns.get(scope);
  if (!deps.callbackAuth || !token || (!active && !isAgentCallback)) {
    log.warn('callback', 'denied', { scope, action, reason: 'missing-token-or-run' });
    return 'missing';
  }
  const result = deps.callbackAuth.verify(token, {
    runId: isAgentCallback ? '' : (active?.run.runId ?? ''),
    scope,
    chatId: deps.evt.chatId,
    operatorOpenId: deps.evt.operator.openId,
    action,
    policyFingerprint: isAgentCallback
      ? ''
      : (deps.callbackPolicyFingerprintForScope?.(scope) ??
        deps.callbackPolicyFingerprint ??
        ''),
  });
  if (!result.ok) {
    log.warn('callback', 'denied', { scope, action, reason: result.reason });
    return result.reason;
  }
  return null;
}

function isSignedBridgeCallback(payload: Record<string, unknown>): boolean {
  return BRIDGE_CALLBACK_MARKER in payload || typeof payload.bridge_token === 'string';
}

/** Turn a button payload like {cmd:'ws.use', name:'proj-a'} into the arg
 * string the text-command handler expects: 'use proj-a'. Accepts `arg`
 * (preferred, generic) or `name` (legacy ws cards). */
function composeArgs(sub: string, payload: Record<string, unknown>): string {
  if (!sub) return '';
  const arg =
    (typeof payload.arg === 'string' && payload.arg) ||
    (typeof payload.name === 'string' && payload.name) ||
    '';
  return arg ? `${sub} ${arg}` : sub;
}

function makeFakeMsg(
  evt: CardActionEvent,
  threadId: string | undefined,
): NormalizedMessage {
  return {
    messageId: evt.messageId,
    chatId: evt.chatId,
    chatType: 'p2p',
    threadId,
    senderId: evt.operator.openId,
    senderName: evt.operator.name,
    content: '',
    rawContentType: 'interactive',
    resources: [],
    mentions: [],
    mentionAll: false,
    mentionedBot: false,
    createTime: Date.now(),
  };
}
