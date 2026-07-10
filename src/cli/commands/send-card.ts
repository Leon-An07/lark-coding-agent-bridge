import { createLarkChannel } from '@larksuite/channel';
import { readFile } from 'node:fs/promises';
import { CallbackAuth } from '../../card/callback-auth';
import { CallbackNonceStore } from '../../card/callback-store';
import { injectBridgeTokens } from '../../card/bridge-token-card';
import {
  configureOpenCardStore,
  flushOpenCardStore,
  setScopeOpenCard,
} from '../../card/managed';
import { resolveAppSecret } from '../../config/secret-resolver';
import { resolveProfileRuntime } from '../../runtime/profile-runtime';

const DEFAULT_TTL_MINUTES = 60;

export interface CardCommandOptions {
  config?: string;
  profile?: string;
  chatId: string;
  operator?: string;
  ttlMinutes?: string;
  file: string;
  replyTo?: string;
  /**
   * Topic/thread ID (`omt_xxx`) the card lives in. In topic-mode chats the
   * dispatcher computes the callback scope as `chatId:threadId`, so the token
   * must be signed with the same scope or every click is denied with
   * `context-mismatch`. NOTE: this is NOT the same as `replyTo` — that is a
   * message ID (`om_xxx`) used to place the message in the thread.
   */
  threadId?: string;
}

export interface SendCardCommandOptions extends CardCommandOptions {
  dryRun?: boolean;
}

interface PreparedCard {
  card: object;
  signedCallbacks: number;
  alreadySignedCallbacks: number;
}

export async function runSendCard(opts: SendCardCommandOptions): Promise<void> {
  const runtime = await resolveProfileRuntime({
    config: opts.config,
    profile: opts.profile,
    allowBootstrap: false,
  });
  const prepared = await prepareSignedCardWithRuntime(opts, runtime);
  if (opts.dryRun) {
    process.stdout.write(`${JSON.stringify(prepared.card, null, 2)}\n`);
    printSignSummary(prepared, 'dry-run only');
    return;
  }

  const appSecret = await resolveAppSecret(runtime.cfg, runtime.appPaths);
  const channel = createLarkChannel({
    appId: runtime.cfg.accounts.app.id,
    appSecret,
    domain:
      runtime.cfg.accounts.app.tenant === 'lark'
        ? 'https://open.larksuite.com'
        : 'https://open.feishu.cn',
    source: 'lark-channel-bridge-send-card',
    transport: 'webhook',
    respectProxyEnv: true,
    httpTimeoutMs: 30_000,
  });

  const sendOpts = opts.replyTo ? { replyTo: opts.replyTo } : undefined;
  const result = await channel.send(opts.chatId, { card: prepared.card }, sendOpts);

  // Record the card in the shared open-card store so the daemon can grey it
  // out if the user answers with a text reply instead of clicking. Only cards
  // with a signed callback are answerable — plain navigation cards need no
  // auto-close. Best-effort: a failure here must not fail the send.
  if (prepared.signedCallbacks > 0 || prepared.alreadySignedCallbacks > 0) {
    try {
      configureOpenCardStore(`${runtime.appPaths.profileDir}/open-cards.json`);
      // Must match the daemon's scope (chatId:threadId in topic chats), not the
      // replyTo message id — otherwise the open-card store never greys the card.
      setScopeOpenCard(callbackScope(opts), result.messageId, prepared.card);
      await flushOpenCardStore();
    } catch (err) {
      console.error(
        `[send-card] warning: open-card tracking failed (${err instanceof Error ? err.message : String(err)})`,
      );
    }
  }
  printSignSummary(prepared, `sent message ${result.messageId}`);
}

async function prepareSignedCardWithRuntime(
  opts: CardCommandOptions,
  runtime: Awaited<ReturnType<typeof resolveProfileRuntime>>,
): Promise<PreparedCard> {
  if (!opts.chatId) throw new Error('--chat-id is required');
  if (!opts.file) throw new Error('--file is required');
  const ttlMs = parseTtlMs(opts.ttlMinutes);
  const card = JSON.parse(await readFile(opts.file, 'utf8')) as unknown;
  const appSecret = await resolveAppSecret(runtime.cfg, runtime.appPaths);
  const nonceStore = new CallbackNonceStore(`${runtime.appPaths.profileDir}/callback-nonces.json`);
  await nonceStore.load();
  const auth = new CallbackAuth({
    keys: [{ version: 1, secret: appSecret }],
    nonceStore,
  });
  const signed = injectBridgeTokens(card, {
    auth,
    chatId: opts.chatId,
    scope: callbackScope(opts),
    operatorOpenId: opts.operator ?? '*',
    ttlMs,
  });
  return signed;
}

/**
 * Scope the callback token is bound to. It MUST equal the scope the dispatcher
 * derives from the click event (`resolveScope`): `chatId:threadId` for
 * topic-mode chats, bare `chatId` for p2p / ordinary groups. Signing with the
 * bare chatId inside a topic chat makes every click fail `context-mismatch`.
 */
function callbackScope(opts: CardCommandOptions): string {
  return opts.threadId ? `${opts.chatId}:${opts.threadId}` : opts.chatId;
}

function parseTtlMs(raw: string | undefined): number {
  if (raw === undefined || raw.trim() === '') return DEFAULT_TTL_MINUTES * 60_000;
  const n = Number(raw);
  if (!Number.isFinite(n) || n <= 0) {
    throw new Error('--ttl-minutes must be a positive number');
  }
  return Math.round(n * 60_000);
}

function printSignSummary(card: PreparedCard, action: string): void {
  console.error(
    [
      `[send-card] ${action}`,
      `signed=${card.signedCallbacks}`,
      `alreadySigned=${card.alreadySignedCallbacks}`,
    ].join(' '),
  );
  if (card.signedCallbacks === 0 && card.alreadySignedCallbacks === 0) {
    console.error('[send-card] warning: no callback payload with "__bridge_cb": true was found');
  }
}
