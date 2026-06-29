import { describe, expect, it } from 'vitest';
import { type AskMapEntry, resolveAskAnswers } from '../../../src/card/agent-card.js';
import { expiredCard, lockedCard } from '../../../src/card/templates.js';

describe('agent-card', () => {
  describe('lockedCard', () => {
    it('is a green, button-less "✅ 已完成" card', () => {
      const c = lockedCard() as {
        header: { template: string; title: { content: string } };
        body: { elements: Array<{ tag: string }> };
      };
      expect(c.header.template).toBe('green');
      expect(c.header.title.content).toBe('✅ 已完成');
      expect(c.body.elements.every((e) => !['button', 'action', 'form'].includes(e.tag))).toBe(true);
    });

    it('tucks the submitted result into a collapsible panel', () => {
      const c = lockedCard('**db** PG') as {
        body: { elements: Array<{ tag: string; expanded?: boolean; elements?: Array<{ content: string }> }> };
      };
      const panel = c.body.elements.find((e) => e.tag === 'collapsible_panel');
      expect(panel?.expanded).toBe(false);
      expect(panel?.elements?.[0]?.content).toBe('**db** PG');
    });
  });

  describe('expiredCard', () => {
    it('is a grey, button-less "已过期" card', () => {
      const c = expiredCard() as {
        header: { template: string; title: { content: string } };
        body: { elements: Array<{ tag: string }> };
      };
      expect(c.header.template).toBe('grey');
      expect(c.header.title.content).toContain('已过期');
      expect(c.body.elements.every((e) => !['button', 'action', 'form'].includes(e.tag))).toBe(true);
    });
  });

  describe('resolveAskAnswers', () => {
    const map: AskMapEntry[] = [
      { f: 'q0', q: 'db?', k: 'select' },
      { f: 'q1', q: 'cache?', k: 'multi' },
      { f: 'q2', q: 'notes?', k: 'input' },
    ];

    it('maps form_value to clean {question: answer}', () => {
      const answers = resolveAskAnswers(map, { q0: 'PG', q1: ['Redis', '本地内存'], q2: '要快' });
      expect(answers).toEqual({ 'db?': 'PG', 'cache?': ['Redis', '本地内存'], 'notes?': '要快' });
    });

    it('multi defaults to [] and missing fields to ""', () => {
      const answers = resolveAskAnswers(map, { q0: 'PG' });
      expect(answers).toEqual({ 'db?': 'PG', 'cache?': [], 'notes?': '' });
    });

    it('resolves date / person / persons / checkbox kinds', () => {
      const m: AskMapEntry[] = [
        { f: 'q0', q: '何时?', k: 'date' },
        { f: 'q1', q: '谁?', k: 'persons' },
        { f: 'q2', q: '负责人?', k: 'person' },
        { f: 'q3', q: '标签?', k: 'checker', opts: [{ f: 'q3_o0', label: 'a' }, { f: 'q3_o1', label: 'b' }] },
      ];
      const answers = resolveAskAnswers(m, {
        q0: '2026-07-01',
        q1: ['ou_1', 'ou_2'],
        q2: 'ou_lead',
        q3_o0: true,
        q3_o1: false,
      });
      expect(answers).toEqual({
        '何时?': '2026-07-01',
        '谁?': ['ou_1', 'ou_2'],
        '负责人?': 'ou_lead',
        '标签?': ['a'],
      });
    });
  });
});
