import { describe, expect, it } from 'vitest';
import {
  type AskMapEntry,
  extractAgentCardSpecs,
  isInteractiveSpec,
  resolveAskAnswers,
  stripAgentCardBlocks,
} from '../../../src/card/agent-card.js';
import { askCard } from '../../../src/card/templates.js';

interface FormCard {
  schema: string;
  body: { elements: Array<{ tag: string; name?: string; elements?: FormEl[] }> };
}
interface FormEl {
  tag: string;
  name?: string;
  options?: Array<{ value: string }>;
  form_action_type?: string;
  value?: Record<string, unknown>;
}
const formOf = (card: unknown): FormEl[] =>
  (card as FormCard).body.elements.find((e) => e.tag === 'form')!.elements!;

const block = (json: string): string => '```lark-card\n' + json + '\n```';

describe('agent-card', () => {
  describe('extractAgentCardSpecs', () => {
    it('parses a card spec from a fenced block', () => {
      const text = `请选择：\n${block('{"header":"H","buttons":[{"text":"A","value":{"choice":"a"}}]}')}`;
      const specs = extractAgentCardSpecs(text);
      expect(specs).toHaveLength(1);
      expect(specs[0]).toMatchObject({ header: 'H' });
      expect(specs[0]?.buttons?.[0]).toMatchObject({ text: 'A' });
    });

    it('parses multiple blocks', () => {
      const specs = extractAgentCardSpecs(`${block('{"buttons":[]}')}\nx\n${block('{"text":"t"}')}`);
      expect(specs).toHaveLength(2);
    });

    it('skips invalid JSON and non-lark fences', () => {
      expect(extractAgentCardSpecs(block('{ broken'))).toEqual([]);
      expect(extractAgentCardSpecs('```json\n{"a":1}\n```')).toEqual([]);
      expect(extractAgentCardSpecs('no card here')).toEqual([]);
    });
  });

  describe('isInteractiveSpec', () => {
    it('is true with buttons or questions, false otherwise', () => {
      expect(isInteractiveSpec({ buttons: [{ text: 'A' }] })).toBe(true);
      expect(isInteractiveSpec({ questions: [{ question: 'q?' }] })).toBe(true);
      expect(isInteractiveSpec({ text: 'just text' })).toBe(false);
      expect(isInteractiveSpec({ buttons: [] })).toBe(false);
    });
  });

  describe('stripAgentCardBlocks', () => {
    it('removes a complete block but keeps prose', () => {
      const out = stripAgentCardBlocks(`选一个：\n${block('{"buttons":[]}')}\n谢谢`);
      expect(out).not.toContain('lark-card');
      expect(out).not.toContain('buttons');
      expect(out).toContain('选一个');
      expect(out).toContain('谢谢');
    });

    it('removes an unclosed block mid-stream', () => {
      expect(stripAgentCardBlocks('稍候\n```lark-card\n{"header":"x"')).toBe('稍候');
    });

    it('leaves plain text untouched', () => {
      expect(stripAgentCardBlocks('hello')).toBe('hello');
    });
  });

  describe('askCard', () => {
    it('builds a card whose buttons carry __bridge_cb and the agent fields', () => {
      const card = askCard({
        header: '选择',
        text: '哪个?',
        buttons: [
          { text: '方案 A', value: { choice: 'a' }, style: 'primary' },
          { text: '方案 B', value: { choice: 'b' } },
        ],
      }) as {
        header: { title: { content: string } };
        elements: Array<{ tag: string; actions?: Array<{ value: Record<string, unknown>; type: string }> }>;
      };

      expect(card.header.title.content).toBe('选择');
      const action = card.elements.find((e) => e.tag === 'action');
      expect(action?.actions).toHaveLength(2);
      // toMatchObject: the value also carries the signed bridge_token (or none).
      expect(action?.actions?.[0]?.value).toMatchObject({ __bridge_cb: true, choice: 'a' });
      expect(action?.actions?.[0]?.type).toBe('primary');
      expect(action?.actions?.[1]?.value).toMatchObject({ __bridge_cb: true, choice: 'b' });
    });

    it('wraps a scalar button value under {value}', () => {
      const card = askCard({ buttons: [{ text: 'OK', value: 'yes' }] }) as {
        elements: Array<{ tag: string; actions?: Array<{ value: Record<string, unknown> }> }>;
      };
      const action = card.elements.find((e) => e.tag === 'action');
      expect(action?.actions?.[0]?.value).toMatchObject({ __bridge_cb: true, value: 'yes' });
    });

    it('defaults the header when none is given', () => {
      const card = askCard({ buttons: [{ text: 'A' }] }) as {
        header: { title: { content: string } };
      };
      expect(card.header.title.content).toBe('请选择');
    });
  });

  describe('askCard signing + restrict', () => {
    const firstButtonValue = (card: unknown): Record<string, unknown> => {
      const c = card as { elements: Array<{ tag: string; actions?: Array<{ value: Record<string, unknown> }> }> };
      return c.elements.find((e) => e.tag === 'action')!.actions![0]!.value;
    };
    // Fake signer: records the operator it was asked to bind to, returns a token.
    const makeSign = (): { sign: (op: string) => string; ops: string[] } => {
      const ops: string[] = [];
      return { sign: (op) => (ops.push(op), `tok(${op})`), ops };
    };

    it('signs each button via the bridge signer; restrict "me" binds the asker', () => {
      const { sign } = makeSign();
      const v = firstButtonValue(
        askCard({ buttons: [{ text: 'A', value: { choice: 'a' } }] }, 'ou_asker', sign),
      );
      expect(v.bridge_token).toBe('tok(ou_asker)');
      expect(v).toMatchObject({ __bridge_cb: true, choice: 'a' });
    });

    it('restrict "anyone" signs with the wildcard operator', () => {
      const { sign } = makeSign();
      const v = firstButtonValue(askCard({ restrict: 'anyone', buttons: [{ text: 'A' }] }, 'ou_asker', sign));
      expect(v.bridge_token).toBe('tok(*)');
    });

    it('restrict to a specific open_id signs with that operator', () => {
      const { sign } = makeSign();
      const v = firstButtonValue(askCard({ restrict: 'ou_target', buttons: [{ text: 'A' }] }, 'ou_asker', sign));
      expect(v.bridge_token).toBe('tok(ou_target)');
    });

    it('without a signer the button is tokenless (degraded path)', () => {
      const v = firstButtonValue(askCard({ buttons: [{ text: 'A', value: { choice: 'a' } }] }, 'ou_asker'));
      expect(v.bridge_token).toBeUndefined();
      expect(v).toMatchObject({ __bridge_cb: true, choice: 'a' });
    });

    it('the agent cannot forge the signature via its own value', () => {
      const { sign } = makeSign();
      const v = firstButtonValue(
        askCard({ buttons: [{ text: 'A', value: { bridge_token: 'forged' } }] }, 'ou_asker', sign),
      );
      expect(v.bridge_token).toBe('tok(ou_asker)'); // bridge token added last, wins
    });

    it('signs ONCE per card; all buttons share the token (answered-once)', () => {
      const { sign, ops } = makeSign();
      const card = askCard(
        { buttons: [{ text: 'A', value: { choice: 'a' } }, { text: 'B', value: { choice: 'b' } }] },
        'ou_asker',
        sign,
      ) as { elements: Array<{ tag: string; actions?: Array<{ value: Record<string, unknown> }> }> };
      const acts = card.elements.find((e) => e.tag === 'action')!.actions!;
      expect(ops).toHaveLength(1); // one signature for the whole card
      expect(acts[0]!.value.bridge_token).toBe(acts[1]!.value.bridge_token); // shared → single-use across both
    });
  });

  describe('askCard questions form (ask-user-question model)', () => {
    it('builds a schema-2.0 form with the right component per question', () => {
      const card = askCard(
        {
          questions: [
            { question: 'db?', options: [{ label: 'PG' }, { label: 'Mongo' }] },
            { question: 'cache?', multiSelect: true, options: [{ label: 'Redis' }] },
            { question: 'notes?' },
          ],
        },
        'ou_asker',
      );
      expect((card as { schema: string }).schema).toBe('2.0');
      const els = formOf(card);
      expect(els.some((e) => e.tag === 'select_static' && e.name === 'q0')).toBe(true);
      expect(els.some((e) => e.tag === 'multi_select_static' && e.name === 'q1')).toBe(true);
      expect(els.some((e) => e.tag === 'input' && e.name === 'q2')).toBe(true);
    });

    it('emits a bridge-signed submit button carrying the __ask map', () => {
      const sign = (op: string): string => `tok(${op})`;
      const card = askCard(
        { questions: [{ question: 'db?', options: [{ label: 'PG' }] }] },
        'ou_asker',
        sign,
      );
      const submit = formOf(card).find((e) => e.form_action_type === 'submit');
      expect(submit?.value?.__bridge_cb).toBe(true);
      expect(submit?.value?.bridge_token).toBe('tok(ou_asker)'); // default restrict "me"
      expect(submit?.value?.__ask).toEqual([{ f: 'q0', q: 'db?', k: 'select' }]);
    });

    it('select/input components carry no value (only the submit button does)', () => {
      const card = askCard({ questions: [{ question: 'db?', options: [{ label: 'PG' }] }] });
      const select = formOf(card).find((e) => e.tag === 'select_static');
      expect(select?.value).toBeUndefined();
    });

    it('renders date / person / checkbox components by type', () => {
      const card = askCard(
        {
          questions: [
            { question: '何时?', type: 'date' },
            { question: '谁?', type: 'person', multiSelect: true },
            { question: '标签?', multiSelect: true, selectStyle: 'checkbox', options: [{ label: 'a' }, { label: 'b' }] },
          ],
        },
        'ou_asker',
      );
      const els = formOf(card);
      expect(els.some((e) => e.tag === 'date_picker' && e.name === 'q0')).toBe(true);
      expect(els.some((e) => e.tag === 'multi_select_person' && e.name === 'q1')).toBe(true);
      // checkbox → one checker per option, named q2_o0 / q2_o1
      expect(els.filter((e) => e.tag === 'checker').map((e) => e.name)).toEqual(['q2_o0', 'q2_o1']);
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
        '标签?': ['a'], // only the checked option
      });
    });
  });
});
