import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * Regression cover for the patched `MarkdownStreamControllerImpl` in
 * @larksuite/channel (see patches/@larksuite__channel@0.3.0.patch).
 *
 * Feishu force-closes a streaming card ~10min after creation and then silently
 * drops every further update — no error, the SDK resolves the stream cleanly.
 * The patch rolls onto a fresh card at maxAge to stay ahead of that wall.
 *
 * The bug this file exists to prevent: driving the rollover only from the
 * content path. A long tool call goes silent for longer than maxAge, so no
 * setContent arrives, so the age check never runs, so the card sails past the
 * force-close with nobody watching. The fix must therefore be verified with a
 * *silent* gap — a test that keeps streaming content passes against the broken
 * version and proves nothing.
 *
 * The controller is internal to the SDK bundle, so we lift the streaming
 * regions out of dist and evaluate them against a fake sender.
 */

const require_ = createRequire(import.meta.url);

interface Card {
  id: string;
  content: string;
  finished: boolean;
  /** Feishu's force-close: writes still "succeed" but change nothing. */
  dead: boolean;
}

interface FakeSender {
  config: Record<string, unknown>;
  logger: { warn: ReturnType<typeof vi.fn> };
  cards: Card[];
  createCardInstance(spec: unknown): Promise<string>;
  sendCardByReference(to: string, idType: string, cardId: string, opts: unknown): Promise<string>;
  updateCardElementContent(cardId: string, elementId: string, content: string, seq: number): Promise<void>;
  finishStreamingCard(cardId: string, seq: number, summary: string): Promise<void>;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Ctor = new (sender: FakeSender, to: string, idType: string, opts: unknown) => any;

/**
 * The patch only touches `dist/index.mjs`; `dist/index.cjs` ships unpatched.
 * That matches how the bridge loads the SDK (pure ESM → exports.import → mjs),
 * but it means `require.resolve` — which lands on the CJS build — would hand us
 * the *unpatched* source and test nothing.
 */
function resolveEsmDist(): string {
  const cjs = require_.resolve('@larksuite/channel');
  const mjs = cjs.replace(/index\.cjs$/, 'index.mjs');
  if (mjs === cjs) throw new Error(`expected the CJS entry to resolve, got: ${cjs}`);
  return mjs;
}

function loadController(): { MarkdownStreamControllerImpl: Ctor; DEFAULT_CARD_MAX_AGE_MS: number } {
  const src = readFileSync(resolveEsmDist(), 'utf8');

  // Locate by region marker, not line number — the patch shifts lines.
  const start = src.indexOf('//#region src/outbound/streaming/throttle.ts');
  const mdStart = src.indexOf('//#region src/outbound/streaming/markdown-stream.ts');
  if (start < 0 || mdStart < 0) throw new Error('streaming regions not found in @larksuite/channel dist');
  const end = src.indexOf('//#endregion', mdStart);
  if (end < 0) throw new Error('markdown-stream region has no terminator');

  const region = src.slice(start, end);
  // `splitWithCodeFences` lives outside the extracted regions and only serves
  // the size-based rollover, which this file does not exercise.
  const factory = new Function(`
    function splitWithCodeFences() { throw new Error('splitWithCodeFences stub: size rollover not under test'); }
    ${region}
    return { MarkdownStreamControllerImpl, DEFAULT_CARD_MAX_AGE_MS };
  `);
  return factory() as { MarkdownStreamControllerImpl: Ctor; DEFAULT_CARD_MAX_AGE_MS: number };
}

const { MarkdownStreamControllerImpl, DEFAULT_CARD_MAX_AGE_MS } = loadController();

const MAX_AGE = 1_000;

function createFakeSender(config: Record<string, unknown> = {}): FakeSender {
  const cards: Card[] = [];
  let n = 0;
  return {
    config: { streamThrottleMs: 10, streamThrottleChars: 1_000_000, streamCardMaxAgeMs: MAX_AGE, ...config },
    logger: { warn: vi.fn() },
    cards,
    async createCardInstance() {
      const card: Card = { id: `card_${++n}`, content: '', finished: false, dead: false };
      cards.push(card);
      return card.id;
    },
    async sendCardByReference(_to, _idType, cardId) {
      return `om_${cardId}`;
    },
    async updateCardElementContent(cardId, _elementId, content) {
      const card = cards.find((c) => c.id === cardId);
      if (!card) throw new Error(`unknown card ${cardId}`);
      // A dead card accepts the write and silently discards it — exactly what
      // Feishu does after the force-close.
      if (card.dead) return;
      card.content = content;
    },
    async finishStreamingCard(cardId) {
      const card = cards.find((c) => c.id === cardId);
      if (!card) throw new Error(`unknown card ${cardId}`);
      if (card.dead) return;
      card.finished = true;
    },
  };
}

/** Let throttle timers + queued updates settle without aging the card out. */
async function settle(): Promise<void> {
  await vi.advanceTimersByTimeAsync(50);
}

function cardAt(sender: FakeSender, index: number): Card {
  const card = sender.cards[index];
  if (!card) throw new Error(`expected a card at index ${index}, got ${sender.cards.length} card(s)`);
  return card;
}

describe('markdown stream age-based rollover', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('rolls over on wall-clock time while the run is silent, so the answer still lands', async () => {
    const sender = createFakeSender();
    const ctrl = new MarkdownStreamControllerImpl(sender, 'oc_chat', 'chat_id', {});

    await ctrl.setContent('before the long tool call');
    await settle();
    expect(sender.cards).toHaveLength(1);
    expect(cardAt(sender, 0).content).toBe('before the long tool call');

    // The failure mode: a long tool call produces no events at all. Nothing
    // calls setContent, so the content-driven age check never runs.
    await vi.advanceTimersByTimeAsync(MAX_AGE * 3);

    // The timer must have finalized the head card *while it was still alive*.
    expect(cardAt(sender, 0).finished).toBe(true);
    expect(cardAt(sender, 0).content).toBe('before the long tool call');
    // Idle alone must not spawn a continuation card.
    expect(sender.cards).toHaveLength(1);

    // Feishu would have force-closed the head card by now. Anything still
    // writing to it is writing into a black hole.
    cardAt(sender, 0).dead = true;

    // The agent finally emits its answer (cumulative, as the bridge drives it).
    await ctrl.setContent('before the long tool call' + ' — and here is the answer');
    await settle();

    expect(sender.cards).toHaveLength(2);
    expect(cardAt(sender, 1).content).toContain('here is the answer');
    // The head card's content must not be re-rendered onto the continuation.
    expect(cardAt(sender, 1).content).not.toContain('before the long tool call');

    await ctrl.completeTerminal();
    expect(sender.logger.warn).not.toHaveBeenCalled();
  });

  it('does not spawn a card per maxAge while idle', async () => {
    const sender = createFakeSender();
    const ctrl = new MarkdownStreamControllerImpl(sender, 'oc_chat', 'chat_id', {});

    await ctrl.setContent('hello');
    await settle();
    await vi.advanceTimersByTimeAsync(MAX_AGE * 10);

    expect(sender.cards).toHaveLength(1);
    expect(cardAt(sender, 0).finished).toBe(true);
  });

  it('keeps a normal short run on a single card', async () => {
    const sender = createFakeSender();
    const ctrl = new MarkdownStreamControllerImpl(sender, 'oc_chat', 'chat_id', {});

    await ctrl.setContent('quick');
    await settle();
    await ctrl.setContent('quick answer');
    await settle();
    await ctrl.completeTerminal();

    expect(sender.cards).toHaveLength(1);
    expect(cardAt(sender, 0).content).toBe('quick answer');
    expect(cardAt(sender, 0).finished).toBe(true);
  });

  it('disables the timer when streamCardMaxAgeMs is 0', async () => {
    const sender = createFakeSender({ streamCardMaxAgeMs: 0 });
    const ctrl = new MarkdownStreamControllerImpl(sender, 'oc_chat', 'chat_id', {});

    await ctrl.setContent('content');
    await settle();
    await vi.advanceTimersByTimeAsync(MAX_AGE * 10);

    expect(sender.cards).toHaveLength(1);
    expect(cardAt(sender, 0).finished).toBe(false);
  });

  it('defaults to rolling over a minute before Feishu force-closes at 10min', () => {
    expect(DEFAULT_CARD_MAX_AGE_MS).toBe(9 * 60 * 1000);
    expect(DEFAULT_CARD_MAX_AGE_MS).toBeLessThan(10 * 60 * 1000);
  });
});
