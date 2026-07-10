import type { LarkChannel, NormalizedMessage } from '@larksuite/channel';
import type { ChatModeCache } from './chat-mode-cache';

/**
 * Compute the **session scope** for a message.
 *
 * The rule is uniform across chat kinds: **any message that carries a
 * `threadId` gets its own scope** `${chatId}:${threadId}`, so each thread is
 * an independent conversation with its own session / cwd / pending queue.
 * Everything else (p2p, group top-level, plain group messages) is `chatId`.
 *
 *  - **topic group**: every message is in a topic → always thread-scoped.
 *  - **regular group**: only messages posted as a thread reply carry a
 *    `thread_id` (Feishu sends it even for `chat_mode: group`); plain messages
 *    and quote-only (引用) replies have none → they stay on the shared
 *    `chatId` scope. So the group's main line stays one conversation while
 *    each thread splits off and can run in parallel.
 *  - **p2p**: never threaded → always `chatId`.
 *
 * Async because chat mode requires an API lookup elsewhere; kept async for a
 * stable signature even though the scope no longer depends on the mode.
 * Callers typically await this once at intake/cardAction entry and pass
 * the resolved scope through.
 */
export async function scopeFor(
  channel: LarkChannel,
  chatId: string,
  threadId: string | undefined,
  _cache: ChatModeCache,
): Promise<string> {
  return threadId ? `${chatId}:${threadId}` : chatId;
}

/** Convenience overload from a NormalizedMessage. */
export async function scopeForMessage(
  channel: LarkChannel,
  msg: NormalizedMessage,
  cache: ChatModeCache,
): Promise<string> {
  return scopeFor(channel, msg.chatId, msg.threadId, cache);
}
