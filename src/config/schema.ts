import { DEFAULT_LOCALE, normalizeLocale, type Locale } from '../i18n';

export type TenantBrand = 'feishu' | 'lark';

/**
 * SecretRef points at a secret stored outside this file — keeps secrets out
 * of `config.json` so backups / accidental git commits / log dumps don't
 * leak the bot's App Secret. Matches lark-cli's `SecretRef` shape so
 * `--source lark-channel` reads it through the same generic
 * `ResolveSecretInput` pipeline.
 *
 *   - `env`:  value is in process env at `id` (optionally allowlisted via provider)
 *   - `file`: value is at the path `id` (or `provider.path` if provider config)
 *   - `exec`: spawn `provider.command`, send JSON over stdin, read JSON from stdout
 */
export interface SecretRef {
  source: 'env' | 'file' | 'exec';
  provider?: string;
  id: string;
}

/** A secret field can be either a plain string (potentially a `${VAR}`
 * template) or a SecretRef. JSON deserializer accepts both forms. */
export type SecretInput = string | SecretRef;

export interface AppCredentials {
  id: string;
  secret: SecretInput;
  tenant: TenantBrand;
}

/**
 * `secrets.providers` declares how SecretRefs resolve to plaintext (env
 * allowlist, file path, exec command). Only the fields actually consumed by
 * bridge's resolver are typed here; lark-cli reads the same JSON via its
 * richer Go types.
 */
export interface ProviderConfig {
  source: 'env' | 'file' | 'exec';
  /** env: allowlist of env var names that ref.id is allowed to be in. */
  allowlist?: string[];
  /** file: optional base path; ref.id is joined onto it. */
  path?: string;
  /** exec: command to spawn + args. */
  command?: string;
  args?: string[];
  /** exec: explicit env to inject (key=value pairs). */
  env?: Record<string, string>;
  /** exec: env var names to pass through from parent env. */
  passEnv?: string[];
  /** exec: max ms to wait for the child. */
  noOutputTimeoutMs?: number;
  /** exec: max stdout bytes accepted before treating as runaway. */
  maxOutputBytes?: number;
}

export interface SecretsConfig {
  providers?: Record<string, ProviderConfig>;
  defaults?: { env?: string; file?: string; exec?: string };
}

/**
 * How replies are rendered in IM chats:
 *   - `card`: full interactive card (tool panels, ⏹ button, footer status)
 *   - `markdown`: lightweight streaming markdown card (typewriter, no buttons)
 *   - `text`: plain markdown post sent once at run completion (no streaming)
 *
 * Pre-0.1.27 only had `card` and `text`, where `text` meant what's now called
 * `markdown`. See `messageReplyMigrated` for the auto-coercion logic.
 */
export type MessageReplyMode = 'card' | 'markdown' | 'text';
export type CotMessagesMode = 'off' | 'brief' | 'detailed';

/**
 * Access control settings. Empty lists are fail-closed in the v2 policy:
 * no DM senders, no group chats, and only the runtime owner can administer
 * the bot. Runtime owner/admin bypass is applied by the policy layer because
 * owner identity is refreshed from Lark rather than stored in config.json.
 */
export interface AppAccess {
  /** open_id allowlist for DM senders. Group senders are gated by chat. */
  allowedUsers?: string[];
  /** chat_id allowlist for groups the bot responds in. Does not apply to p2p. */
  allowedChats?: string[];
  /** open_id list with admin privileges. Gates sensitive commands
   * (/account, /config, /exit, /reconnect, /doctor, /cd, /ws, /doc,
   * /invite, /remove). */
  admins?: string[];
  /** Legacy/flat-config default for whether group messages require @bot. */
  requireMentionInGroup?: boolean;
  /** chat_id-specific overrides for requireMentionInGroup. */
  requireMentionInGroupOverrides?: Record<string, boolean>;
}

export interface AppPreferences {
  /** Reply rendering mode for IM (group/p2p) messages. Default 'card'. */
  messageReply?: MessageReplyMode;
  /**
   * Internal marker: pre-0.1.27 the value `'text'` meant "lightweight
   * streaming markdown card" (what's now called `'markdown'`). On upgrade
   * we'd silently switch those users to true plain-text behavior unless we
   * coerce; this flag is set the first time the user submits `/config`
   * after the rename, indicating their `messageReply` value is in the
   * new semantic.
   */
  messageReplyMigrated?: boolean;
  /**
   * Whether to render tool-call blocks (Bash / Read / Edit / ...) in the
   * output. Default true. Turn off if you only care about Claude's final
   * text answer and want to hide the "工具调用过程".
   */
  showToolCalls?: boolean;
  /**
   * Send a separate Lark COT (思考过程) message before the final answer via the
   * native message_cot OpenAPI. `off` (default) = no COT; `brief` = key steps +
   * tool titles; `detailed` = also reasoning text + tool args/output. The
   * publisher degrades to a no-op if the app lacks the message_cot permission.
   */
  cotMessages?: CotMessagesMode | 'on' | 'simple';
  /**
   * Cap on concurrent claude runs across all chats / topics. Excess runs
   * queue FIFO. Default 10. Mostly relevant for topic groups where each
   * topic can spawn its own run; capping protects RAM / token spend.
   */
  maxConcurrentRuns?: number;
  /**
   * Global default model for agent runs. Passed to the claude CLI as
   * `--model` (alias like 'opus' / 'sonnet' / 'fable', or a full model id like
   * 'claude-opus-4-8'). Undefined / empty = don't pass `--model`, let the CLI
   * use its own default (the pre-0.3 behavior). Only the claude adapter reads
   * this; the codex adapter ignores it.
   */
  model?: string;
  /**
   * Global default reasoning-effort for agent runs. Passed to the claude CLI
   * as `--effort` (one of low / medium / high / xhigh / max). Undefined /
   * invalid = don't pass `--effort`, let the CLI decide. Only the claude
   * adapter reads this; the codex adapter ignores it.
   */
  effort?: string;
  /**
   * Global default idle-timeout for claude runs, in minutes. When set,
   * if claude emits no stream event for this long the bridge kills the
   * run as presumed-hung. Undefined / 0 = no timeout (the default — runs
   * can hang indefinitely). Per-scope `/timeout` overrides this.
   */
  runIdleTimeoutMinutes?: number;
  /**
   * Whether the bot only responds to messages that @-mention it in groups
   * (regular and topic groups). p2p is always unrestricted. Default true:
   * groups are quiet unless the user @bot. Set false to let any group
   * message reach Claude (the 0.1.21-and-earlier behavior).
   *
   * @全员 is never responded to regardless (SDK `respondToMentionAll: false`).
   * Cloud-doc comments still require @-mention unconditionally.
   */
  requireMentionInGroup?: boolean;
  /** Access control — user/chat allowlists + admin gating. See AppAccess. */
  access?: AppAccess;
  /**
   * Grace period (ms) between SIGTERM and SIGKILL when killing the claude
   * subprocess. Bumped from a hardcoded 500ms because claude often has its
   * own subprocesses (e.g. lark-cli mid-OAuth) that need a moment to clean
   * up — too short a window and the SIGKILL cascade kills the descendants
   * before they can finish what the user is waiting on. Default 5000ms.
   * Range 100-30000; out-of-range values fall back to default.
   */
  agentStopGraceMs?: number;
  /**
   * UI language for all user-facing output (IM replies, cards, CLI).
   * 'zh-CN' | 'en-US' (loose values like 'en' / 'zh_CN' are normalized).
   * Default zh-CN. Does not affect the agent's own answers — those follow
   * the language the user writes in.
   */
  language?: string;
}

/**
 * Top-level config shape on disk.
 *
 * `accounts` is a namespace for credential-flavored fields (currently just
 * the bot app, room for OAuth / alternate apps later). `preferences`
 * holds user-tunable behavior knobs. Other future sections (mcp, etc.)
 * belong at this top level alongside them.
 */
export interface AppConfig {
  accounts: {
    app: AppCredentials;
  };
  secrets?: SecretsConfig;
  preferences?: AppPreferences;
}

export function isComplete(cfg: Partial<AppConfig>): cfg is AppConfig {
  const app = cfg.accounts?.app;
  return Boolean(app?.id && hasSecret(app?.secret) && app?.tenant);
}

function hasSecret(s: SecretInput | undefined): boolean {
  if (!s) return false;
  if (typeof s === 'string') return s.length > 0;
  return Boolean(s.source && s.id);
}

/** True iff this credential's secret is stored externally (env/file/exec). */
export function isSecretRef(s: SecretInput): s is SecretRef {
  return typeof s === 'object' && s !== null;
}

/** Account/keystore key for the bot's App Secret. lark-cli also uses a
 * similar `appsecret:` convention so audit/grep is consistent. */
export function secretKeyForApp(appId: string): string {
  return `app-${appId}`;
}

/**
 * Resolve the message-reply preference with default fallback + legacy coerce.
 *
 * Pre-0.1.27 users with `messageReply: 'text'` actually wanted the streaming
 * markdown card (the new `'markdown'`). Until they re-submit `/config`
 * (which sets `messageReplyMigrated: true`), we map their `text` →
 * `markdown` so the behavior stays the same after upgrade.
 *
 * Default for fresh configs (no `messageReply` set) is `'markdown'`.
 */
export function getMessageReplyMode(cfg: AppConfig): MessageReplyMode {
  const raw = cfg.preferences?.messageReply;
  if (raw === 'text' && cfg.preferences?.messageReplyMigrated !== true) {
    return 'markdown';
  }
  if (raw === 'card' || raw === 'markdown' || raw === 'text') return raw;
  return 'markdown';
}

/** Resolve the show-tool-calls preference with default fallback. */
export function getShowToolCalls(cfg: AppConfig): boolean {
  return cfg.preferences?.showToolCalls !== false;
}

/** Resolve the COT-messages preference. Default `off`. Legacy `on`/`simple`
 * map to detailed/brief for forward-compat. */
export function getCotMessages(cfg: AppConfig): CotMessagesMode {
  const raw = cfg.preferences?.cotMessages;
  if (raw === 'brief' || raw === 'simple') return 'brief';
  if (raw === 'detailed' || raw === 'on') return 'detailed';
  return 'off';
}

/** Resolve the max-concurrent-runs preference with default + sanity clamp. */
export function getMaxConcurrentRuns(cfg: AppConfig): number {
  const raw = cfg.preferences?.maxConcurrentRuns;
  if (typeof raw !== 'number' || !Number.isFinite(raw) || raw < 1) return 10;
  // Reasonable upper bound — at 50+ concurrent claudes the bot box is
  // probably already RAM-starved. Clamp to keep typos from killing the box.
  return Math.min(Math.floor(raw), 50);
}

/** Valid `--effort` levels accepted by the claude CLI. Source of truth for
 * both the parser (`getEffort`) and the `/config` dropdown. */
export const AGENT_EFFORT_LEVELS = ['low', 'medium', 'high', 'xhigh', 'max'] as const;
export type AgentEffort = (typeof AGENT_EFFORT_LEVELS)[number];

/**
 * Resolve the global default model. Returns `undefined` when unset so the
 * caller omits `--model` and the claude CLI falls back to its own default
 * (the pre-0.3 behavior). Any non-empty string is passed through verbatim —
 * the CLI accepts aliases ('opus' / 'sonnet' / 'fable') and full model ids,
 * so we don't restrict the set here.
 */
export function getModel(cfg: AppConfig): string | undefined {
  const raw = cfg.preferences?.model;
  if (typeof raw !== 'string') return undefined;
  const trimmed = raw.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

/**
 * Resolve the global default reasoning-effort. Returns `undefined` when unset
 * or invalid so the caller omits `--effort`. Validated against the CLI's known
 * levels — an unknown value would just be ignored by the CLI, but rejecting it
 * here keeps config.json / the `/config` card honest.
 */
export function getEffort(cfg: AppConfig): AgentEffort | undefined {
  const raw = cfg.preferences?.effort;
  if (typeof raw !== 'string') return undefined;
  const trimmed = raw.trim() as AgentEffort;
  return AGENT_EFFORT_LEVELS.includes(trimmed) ? trimmed : undefined;
}

/**
 * Resolve the require-mention-in-group preference. Default `true` — the
 * `!== false` check makes "undefined" (older configs that don't have the
 * field) inherit the new safer default automatically.
 */
export function getRequireMentionInGroup(cfg: AppConfig, chatId?: string): boolean {
  const profileAccess = (cfg as AppConfig & {
    access?: {
      requireMentionInGroup?: boolean;
      requireMentionInGroupOverrides?: Record<string, boolean>;
    };
  }).access;
  const legacyAccess = cfg.preferences?.access;
  if (chatId) {
    const override =
      profileAccess?.requireMentionInGroupOverrides?.[chatId] ??
      legacyAccess?.requireMentionInGroupOverrides?.[chatId];
    if (typeof override === 'boolean') return override;
  }
  if (cfg.preferences?.requireMentionInGroup !== undefined) {
    return cfg.preferences.requireMentionInGroup !== false;
  }
  if (profileAccess?.requireMentionInGroup !== undefined) {
    return profileAccess.requireMentionInGroup;
  }
  if (legacyAccess?.requireMentionInGroup !== undefined) {
    return legacyAccess.requireMentionInGroup;
  }
  return true;
}

/**
 * Resolve the global default idle-timeout in ms. Returns `undefined` when
 * disabled (the default). Clamps to [1, 120] minutes when set so a typo
 * can't lock the bot into a 1-second kill loop or wait forever to a number
 * the user didn't really mean.
 */
/**
 * Grace period before SIGKILL fallback when stopping a claude subprocess.
 * Returns ms. Defaults to 5000 (5 seconds). Clamps to [100, 30000] so a
 * typo can't either make stop() effectively SIGKILL-immediate or hang for
 * minutes.
 */
export function getAgentStopGraceMs(cfg: AppConfig): number {
  const raw = cfg.preferences?.agentStopGraceMs;
  if (typeof raw !== 'number' || !Number.isFinite(raw)) return 5000;
  return Math.min(30_000, Math.max(100, Math.floor(raw)));
}

/** UI language: preferences.language → normalized locale, default zh-CN. */
export function getLanguage(cfg: AppConfig): Locale {
  return normalizeLocale(cfg.preferences?.language) ?? DEFAULT_LOCALE;
}

/**
 * Idle watchdog for agent runs. Defaults to 30 minutes when unset — a wedged
 * agent process that emits nothing and never exits would otherwise hold its
 * pool slot and block the chat's queue until a manual /stop. Explicit 0 (or
 * any non-positive value) disables the watchdog.
 */
export function getRunIdleTimeoutMs(cfg: AppConfig): number | undefined {
  const raw = cfg.preferences?.runIdleTimeoutMinutes;
  if (typeof raw !== 'number' || !Number.isFinite(raw)) return 30 * 60_000;
  if (raw <= 0) return undefined;
  const clamped = Math.min(Math.max(Math.floor(raw), 1), 120);
  return clamped * 60_000;
}
