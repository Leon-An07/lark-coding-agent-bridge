import { describe, expect, it } from 'vitest';
import { disabledCard } from '../../../src/card/templates.js';

interface ButtonNode {
  tag: string;
  disabled?: boolean;
  behaviors?: unknown;
  value?: unknown;
}

const collectButtons = (
  node: unknown,
  out: Array<Record<string, unknown>> = [],
): Array<Record<string, unknown>> => {
  if (Array.isArray(node)) {
    for (const n of node) collectButtons(n, out);
  } else if (node && typeof node === 'object') {
    const obj = node as Record<string, unknown>;
    if (obj.tag === 'button') out.push(obj);
    for (const v of Object.values(obj)) collectButtons(v, out);
  }
  return out;
};

const sampleCard = (): object => ({
  schema: '2.0',
  header: { title: { tag: 'plain_text', content: '选一个' }, template: 'blue' },
  body: {
    elements: [
      { tag: 'markdown', content: '请选择:' },
      {
        tag: 'button',
        text: { tag: 'plain_text', content: 'A' },
        value: { __bridge_cb: true, choice: 'a', bridge_token: 'tok' },
        behaviors: [{ type: 'callback' }],
      } satisfies ButtonNode & Record<string, unknown>,
      {
        tag: 'button',
        text: { tag: 'plain_text', content: 'B' },
        value: { __bridge_cb: true, choice: 'b', bridge_token: 'tok' },
      } satisfies ButtonNode & Record<string, unknown>,
    ],
  },
});

describe('disabledCard (auto-close on text reply)', () => {
  it('greys out every button, strips its callback, and prepends a note', () => {
    const original = sampleCard();
    const closed = disabledCard(original) as {
      header: { template: string };
      body: { elements: Array<{ tag: string; content?: string }> };
    };

    const buttons = collectButtons(closed);
    expect(buttons).toHaveLength(2);
    expect(buttons.every((b) => b.disabled === true)).toBe(true);
    expect(buttons.every((b) => !('behaviors' in b) && !('value' in b))).toBe(true);

    expect(closed.header.template).toBe('grey'); // greyed header signals closed
    expect(closed.body.elements[0]?.tag).toBe('markdown');
    expect(closed.body.elements[0]?.content).toContain('已改用文字回复');

    // Deep clone — the original card is untouched (still clickable).
    expect(collectButtons(original).some((b) => b.disabled === true)).toBe(false);
  });

  it('tolerates a card without header or body', () => {
    const closed = disabledCard({}) as { body: { elements: unknown[] } };
    expect(closed.body.elements).toHaveLength(1);
  });
});
