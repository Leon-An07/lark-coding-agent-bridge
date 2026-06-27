import type { LarkChannel } from '@larksuite/channel';
import { log } from '../core/logger';

interface ManagedEntry {
  cardId: string;
  sequence: number;
}

// Module-local because state is per-process. Lost on restart, which is fine —
// a new run of /account (or a fresh agent card) mints a new card.
const byMessageId = new Map<string, ManagedEntry>();
// Bound the map: most agent cards get clicked (→ forgotten) or replaced, but
// cards nobody clicks would otherwise accumulate forever. Evict oldest first.
const MAX_TRACKED = 500;

// The latest still-open agent card per scope, so a plain text reply (instead of
// a click) can auto-close it. Stores the rendered card to disable its buttons.
const openCardByScope = new Map<string, { messageId: string; card: object }>();

/** Remember the open agent card for a scope (overwrites any prior). */
export function setScopeOpenCard(scope: string, messageId: string, card: object): void {
  openCardByScope.set(scope, { messageId, card });
}

/** Get + clear the scope's open card (whether it's being closed or answered). */
export function takeScopeOpenCard(
  scope: string,
): { messageId: string; card: object } | undefined {
  const entry = openCardByScope.get(scope);
  openCardByScope.delete(scope);
  return entry;
}

/** Lark client-side keeps a form/card locked while the cardAction handler is
 * pending, then snaps the card back to its cached state on return. So an update
 * must run AFTER this settle window (and detached from the handler) to stick.
 * Shared by the /config form, the agent-card morph, and the click-lock. */
export const CARDKIT_SETTLE_MS = 1000;

function remember(messageId: string, entry: ManagedEntry): void {
  byMessageId.set(messageId, entry);
  while (byMessageId.size > MAX_TRACKED) {
    const oldest = byMessageId.keys().next().value;
    if (oldest === undefined) break;
    byMessageId.delete(oldest);
  }
}

export interface ManagedCardSendResult {
  messageId: string;
  cardId: string;
}

/**
 * Create a CardKit 2.0 card entity and send a message that references it.
 * Returns both ids; we keep them in a module-local map so future cardAction
 * events can update the card by its messageId.
 *
 * `recipientId` is routed by its id prefix (channel.send infers
 * `receive_id_type`): `oc_*` → chat, `ou_*` → direct message to that user
 * (Lark auto-resolves the p2p chat). If `replyTo` is provided, the card
 * threads under that message — only meaningful for chat sends.
 */
export async function sendManagedCard(
  channel: LarkChannel,
  recipientId: string,
  card: object,
  opts: { replyTo?: string } = {},
): Promise<ManagedCardSendResult> {
  const { cardId } = await channel.createCard(card);
  const { messageId } = await channel.send(
    recipientId,
    { cardId },
    opts.replyTo ? { replyTo: opts.replyTo } : undefined,
  );
  remember(messageId, { cardId, sequence: 0 });
  return { messageId, cardId };
}

/**
 * Update a managed card identified by the messageId of the message that
 * carries it. Auto-increments and tracks the per-card sequence so updates
 * can't be reordered or rejected by the cardkit server.
 */
export async function updateManagedCard(
  channel: LarkChannel,
  messageId: string,
  card: object,
): Promise<void> {
  const entry = byMessageId.get(messageId);
  if (!entry) {
    throw new Error(`no managed card registered for message ${messageId}`);
  }
  entry.sequence += 1;
  try {
    await channel.updateCardById(entry.cardId, card, entry.sequence);
  } catch (err) {
    log.fail('card', err, { step: 'managed-update', cardId: entry.cardId, seq: entry.sequence });
    throw err;
  }
}

/**
 * Register an already-created card entity (e.g. the streaming reply card we
 * morph into an agent card) so a later cardAction can update it by messageId.
 * `sequence` must be the last value already used on that card so subsequent
 * updates strictly increase.
 */
export function registerManagedCard(messageId: string, cardId: string, sequence: number): void {
  remember(messageId, { cardId, sequence });
}

/** True iff we have the card_id mapping for this messageId. */
export function isManaged(messageId: string): boolean {
  return byMessageId.has(messageId);
}

/** Drop the mapping; call after the card is recalled or the flow ends. */
export function forgetManagedCard(messageId: string): void {
  byMessageId.delete(messageId);
}
