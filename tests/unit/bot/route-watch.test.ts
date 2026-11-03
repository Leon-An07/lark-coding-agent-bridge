import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { RouteBurstDetector } from '../../../src/bot/route-watch.js';

describe('RouteBurstDetector', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('fires once after a large burst goes quiet', () => {
    const onFlush = vi.fn();
    const d = new RouteBurstDetector(onFlush);
    for (let i = 0; i < 300; i++) d.feed('RTM_DELETE: Delete Route: len 144');
    vi.advanceTimersByTime(1_000);
    expect(onFlush).not.toHaveBeenCalled();
    vi.advanceTimersByTime(600);
    expect(onFlush.mock.calls).toEqual([[300]]);
  });

  it('ignores small bursts and non-RTM lines', () => {
    const onFlush = vi.fn();
    const d = new RouteBurstDetector(onFlush);
    for (let i = 0; i < 10; i++) d.feed('RTM_MISS: Lookup failed on this address');
    for (let i = 0; i < 100; i++) d.feed('locks:  inits:');
    vi.advanceTimersByTime(2_000);
    expect(onFlush).not.toHaveBeenCalled();
  });

  it('counts each burst separately', () => {
    const onFlush = vi.fn();
    const d = new RouteBurstDetector(onFlush);
    for (let i = 0; i < 60; i++) d.feed('RTM_ADD: Add Route');
    vi.advanceTimersByTime(2_000);
    for (let i = 0; i < 30; i++) d.feed('RTM_ADD: Add Route');
    vi.advanceTimersByTime(2_000);
    expect(onFlush.mock.calls).toEqual([[60]]);
  });
});
