import { CallbackAuth } from './callback-auth';

export const BRIDGE_CALLBACK_MARKER = '__bridge_cb';

export interface InjectBridgeTokensOptions {
  auth: CallbackAuth;
  chatId: string;
  /** Session scope. For p2p and ordinary group chats this is the chatId. */
  scope?: string;
  /** Use "*" to allow the first valid clicker. */
  operatorOpenId: string;
  ttlMs: number;
}

export interface BridgeTokenInjectionResult {
  card: object;
  signedCallbacks: number;
  alreadySignedCallbacks: number;
}

/**
 * Inject a bridge_token into every callback payload explicitly marked with
 * `__bridge_cb: true`. One token is shared by the whole card so the first valid
 * click consumes the nonce and later clicks on sibling buttons are rejected.
 */
export function injectBridgeTokens(
  card: unknown,
  options: InjectBridgeTokensOptions,
): BridgeTokenInjectionResult {
  if (!isRecord(card)) {
    throw new Error('card JSON must be an object');
  }

  const token = options.auth.sign({
    runId: '',
    scope: options.scope ?? options.chatId,
    chatId: options.chatId,
    operatorOpenId: options.operatorOpenId,
    action: 'agent_callback',
    policyFingerprint: '',
    ttlMs: options.ttlMs,
  });

  const cloned = deepClone(card);
  let signedCallbacks = 0;
  let alreadySignedCallbacks = 0;

  walkJson(cloned, (node) => {
    if (node[BRIDGE_CALLBACK_MARKER] !== true) return;
    if (typeof node.bridge_token === 'string' && node.bridge_token.length > 0) {
      alreadySignedCallbacks += 1;
      return;
    }
    node.bridge_token = token;
    signedCallbacks += 1;
  });

  return {
    card: cloned,
    signedCallbacks,
    alreadySignedCallbacks,
  };
}

function deepClone(value: unknown): object {
  return JSON.parse(JSON.stringify(value)) as object;
}

function walkJson(value: unknown, visit: (node: Record<string, unknown>) => void): void {
  if (Array.isArray(value)) {
    for (const item of value) walkJson(item, visit);
    return;
  }
  if (!isRecord(value)) return;
  visit(value);
  for (const child of Object.values(value)) walkJson(child, visit);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
