import type { LarkChannel } from '@larksuite/channel';
import { log } from '../core/logger';

/**
 * Add a "Typing" reaction (敲键盘) to a message to give text-mode users an
 * instant "I got your message and I'm responding" cue while Claude is still
 * thinking. Matches the conventional Feishu UX for "the other side is
 * replying". Card mode doesn't need this — the streaming card already
 * shows a "正在思考…" footer the moment it's posted.
 *
 * Returns the reaction id on success, undefined on any failure. Failures
 * are logged but never thrown — losing a decoration must not break the
 * actual reply flow.
 */
export async function addWorkingReaction(
  channel: LarkChannel,
  messageId: string,
): Promise<string | undefined> {
  try {
    const id = await channel.addReaction(messageId, 'Typing');
    if (id) log.info('reaction', 'added', { messageId, reactionId: id });
    return id;
  } catch (err) {
    log.warn('reaction', 'add-failed', {
      messageId,
      err: err instanceof Error ? err.message : String(err),
    });
    return undefined;
  }
}

/**
 * Add a "DONE" reaction to mark that the reply is fully delivered. The bridge
 * adds this on real run completion — replacing a per-turn Claude Stop hook,
 * which fired when the agent subprocess stopped (before the bridge had finished
 * delivering the card) and so landed too early. Best-effort; never thrown.
 */
export async function addDoneReaction(
  channel: LarkChannel,
  messageId: string,
): Promise<void> {
  try {
    await channel.addReaction(messageId, 'DONE');
    log.info('reaction', 'done-added', { messageId });
  } catch (err) {
    log.warn('reaction', 'done-add-failed', {
      messageId,
      err: err instanceof Error ? err.message : String(err),
    });
  }
}

/** Remove a previously-added reaction. Tolerates errors silently — best
 * effort cleanup; a leftover reaction is harmless. */
export async function removeReaction(
  channel: LarkChannel,
  messageId: string,
  reactionId: string,
): Promise<void> {
  try {
    await channel.removeReaction(messageId, reactionId);
    log.info('reaction', 'removed', { messageId, reactionId });
  } catch (err) {
    log.warn('reaction', 'remove-failed', {
      messageId,
      reactionId,
      err: err instanceof Error ? err.message : String(err),
    });
  }
}
