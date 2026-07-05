import type { LarkChannel } from '@larksuite/channel';
import { appendFileSync, readFileSync } from 'node:fs';
import * as lockfile from 'proper-lockfile';
import { log } from '../core/logger';
import { writeFileAtomic } from '../platform/atomic-write';

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
//
// File-backed when configured: agent cards are sent by the `send-card` CLI (a
// separate short-lived process), so the daemon can only learn about them
// through a shared file — an in-memory map here would simply never be set.
// Same profile-dir JSON pattern as callback-nonces.json. The in-memory map
// remains as the no-store fallback (tests, unconfigured runs).
interface OpenCardEntry {
  messageId: string;
  card: object;
  /** When the card was registered. Entries older than the agent-card token
   * TTL can never be answered anyway, so they're pruned on the next write —
   * quiet scopes used to leave entries in the file forever. */
  at?: number;
}

/** Agent-card callback tokens live 24h; keep a little slack past that. */
const OPEN_CARD_TTL_MS = 25 * 60 * 60 * 1000;

const openCardByScope = new Map<string, OpenCardEntry>();
let openCardStorePath: string | undefined;
// Serialize writes so a set/take burst can't interleave partial states.
let openCardPersistChain: Promise<void> = Promise.resolve();

export function configureOpenCardStore(path: string | undefined): void {
  openCardStorePath = path;
}

/** Await pending open-card writes — short-lived processes (send-card CLI)
 * must call this before exiting or the write may be lost. */
export function flushOpenCardStore(): Promise<void> {
  return openCardPersistChain;
}

function readOpenCardFile(): Record<string, OpenCardEntry> {
  if (!openCardStorePath) return {};
  try {
    const parsed = JSON.parse(readFileSync(openCardStorePath, 'utf8')) as unknown;
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
      ? (parsed as Record<string, OpenCardEntry>)
      : {};
  } catch {
    return {};
  }
}

function pruneOpenCards(all: Record<string, OpenCardEntry>): void {
  const now = Date.now();
  for (const [scope, entry] of Object.entries(all)) {
    if (typeof entry.at !== 'number') {
      // Legacy entry without a timestamp: start its TTL clock now.
      entry.at = now;
    } else if (now - entry.at > OPEN_CARD_TTL_MS) {
      delete all[scope];
    }
  }
}

/** Read-modify-write the open-card file atomically. The read happens inside
 * the persist chain (so queued in-process writes are visible) and under a
 * cross-process file lock (the send-card CLI and the daemon both mutate this
 * file; unlocked RMW let one side's write erase the other's entry). */
function mutateOpenCardStore(mutate: (all: Record<string, OpenCardEntry>) => void): void {
  const path = openCardStorePath;
  if (!path) return;
  openCardPersistChain = openCardPersistChain
    .then(async () => {
      appendFileSync(path, '');
      const release = await lockfile.lock(path, {
        realpath: false,
        stale: 10_000,
        retries: { retries: 5, minTimeout: 50, maxTimeout: 500 },
      });
      try {
        const all = readOpenCardFile();
        pruneOpenCards(all);
        mutate(all);
        await writeFileAtomic(path, `${JSON.stringify(all)}\n`);
      } finally {
        await release();
      }
    })
    .catch((err) => {
      log.warn('agent-card', 'open-card-persist-failed', {
        err: err instanceof Error ? err.message : String(err),
      });
    });
}

/** Remember the open agent card for a scope (overwrites any prior). */
export function setScopeOpenCard(scope: string, messageId: string, card: object): void {
  const entry: OpenCardEntry = { messageId, card, at: Date.now() };
  openCardByScope.set(scope, entry);
  mutateOpenCardStore((all) => {
    all[scope] = entry;
  });
}

/** Get + clear the scope's open card (whether it's being closed or answered). */
export function takeScopeOpenCard(scope: string): OpenCardEntry | undefined {
  const mem = openCardByScope.get(scope);
  openCardByScope.delete(scope);
  if (!openCardStorePath) return mem;
  const fromFile = readOpenCardFile()[scope];
  if (fromFile) {
    mutateOpenCardStore((all) => {
      delete all[scope];
    });
  }
  // The file entry wins: it's the cross-process source of truth.
  return fromFile ?? mem;
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
