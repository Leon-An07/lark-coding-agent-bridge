import { describe, expect, it } from 'vitest';
import { ContextNoticeTracker, contextWindowFor } from '../../../src/bot/context-notice.js';
import { translateEvent } from '../../../src/agent/claude/stream-json.js';

describe('contextWindowFor', () => {
  it('defaults to 200k and detects 1M variants', () => {
    expect(contextWindowFor(undefined)).toBe(200_000);
    expect(contextWindowFor('claude-opus-4-8')).toBe(200_000);
    expect(contextWindowFor('claude-sonnet-4-5[1m]')).toBe(1_000_000);
    expect(contextWindowFor('claude-sonnet-4-5-1m')).toBe(1_000_000);
  });
});

describe('ContextNoticeTracker', () => {
  it('stays silent below 50% and fires once per tier per session', () => {
    const t = new ContextNoticeTracker();
    expect(t.take('oc_a', 's1', 80_000, 'claude-opus-4-8')).toBeUndefined(); // 40%

    const yellow = t.take('oc_a', 's1', 120_000, 'claude-opus-4-8'); // 60%
    expect(yellow).toContain('🟡');
    expect(yellow).toContain('120k / 200k');
    expect(yellow).toContain('60%');

    // Same tier again → silent.
    expect(t.take('oc_a', 's1', 130_000, 'claude-opus-4-8')).toBeUndefined();

    // Escalation fires the next tier.
    expect(t.take('oc_a', 's1', 160_000, 'claude-opus-4-8')).toContain('🟠'); // 80%
    expect(t.take('oc_a', 's1', 185_000, 'claude-opus-4-8')).toContain('🔴'); // 92%
    expect(t.take('oc_a', 's1', 190_000, 'claude-opus-4-8')).toBeUndefined();
  });

  it('re-arms when the session changes (/new)', () => {
    const t = new ContextNoticeTracker();
    expect(t.take('oc_a', 's1', 120_000, undefined)).toContain('🟡');
    expect(t.take('oc_a', 's2', 120_000, undefined)).toContain('🟡');
  });

  it('scales tiers to a 1M window', () => {
    const t = new ContextNoticeTracker();
    // 300k on a 1M model is only 30% — no notice.
    expect(t.take('oc_a', 's1', 300_000, 'claude-sonnet-4-5[1m]')).toBeUndefined();
    const notice = t.take('oc_a', 's1', 600_000, 'claude-sonnet-4-5[1m]');
    expect(notice).toContain('🟡');
    expect(notice).toContain('1M');
  });
});

describe('stream-json per-turn context usage', () => {
  it('emits contextTokens from assistant message usage', () => {
    const events = [
      ...translateEvent({
        type: 'assistant',
        message: {
          content: [{ type: 'text', text: 'hi' }],
          usage: {
            input_tokens: 10,
            cache_read_input_tokens: 90_000,
            cache_creation_input_tokens: 5_000,
            output_tokens: 50,
          },
        },
      }),
    ];
    expect(events).toContainEqual({ type: 'usage', contextTokens: 95_010 });
    expect(events).toContainEqual({ type: 'text', delta: 'hi' });
  });

  it('emits no usage event when assistant message has no usage', () => {
    const events = [
      ...translateEvent({
        type: 'assistant',
        message: { content: [{ type: 'text', text: 'hi' }] },
      }),
    ];
    expect(events.filter((e) => e.type === 'usage')).toHaveLength(0);
  });
});
