import { afterEach, describe, expect, it } from 'vitest';
import {
  BRIDGE_SYSTEM_PROMPT,
  BRIDGE_SYSTEM_PROMPT_EN,
  BRIDGE_SYSTEM_PROMPT_JA,
  buildBridgeSystemPrompt,
  prefixBridgeSystemPrompt,
} from '../../../src/agent/bridge-system-prompt';
import { DEFAULT_LOCALE, setActiveLocale } from '../../../src/i18n';

describe('bridge system prompt bot collaboration rules', () => {
  it('states that bots only receive messages via a real structured mention', () => {
    expect(BRIDGE_SYSTEM_PROMPT).toContain('只有被真实 @');
    expect(BRIDGE_SYSTEM_PROMPT).toContain('收不到');
  });

  it('scopes the mention requirement to bots, not human users', () => {
    expect(BRIDGE_SYSTEM_PROMPT).toContain('人类用户');
  });

  it('tells the agent not to mention other bots by default to avoid loops', () => {
    expect(BRIDGE_SYSTEM_PROMPT).toContain('默认不要 @ 其他 bot');
    expect(BRIDGE_SYSTEM_PROMPT).toContain('死循环');
  });

  it('allows mentioning a bot when the user explicitly asks for a handoff', () => {
    expect(BRIDGE_SYSTEM_PROMPT).toContain('用户明确要求');
  });

  it('points self-identification at the bridge_context botOpenId field', () => {
    expect(BRIDGE_SYSTEM_PROMPT).toContain('botOpenId');
  });

  it('documents the senderType and mentions context fields', () => {
    expect(BRIDGE_SYSTEM_PROMPT).toContain('senderType');
    expect(BRIDGE_SYSTEM_PROMPT).toContain('mentions');
  });

  it('tells the agent not to mimic the batch sender annotation format', () => {
    expect(BRIDGE_SYSTEM_PROMPT).toContain('[名字 (user|bot)]');
    expect(BRIDGE_SYSTEM_PROMPT).toContain('不要模仿');
  });
});

describe('buildBridgeSystemPrompt', () => {
  it('returns the base prompt unchanged when no identity is available', () => {
    expect(buildBridgeSystemPrompt(undefined)).toBe(BRIDGE_SYSTEM_PROMPT);
  });

  it('appends a concrete identity line with open_id and name', () => {
    const prompt = buildBridgeSystemPrompt({ openId: 'ou_bot_self', name: '尼莫' });
    expect(prompt.startsWith(BRIDGE_SYSTEM_PROMPT)).toBe(true);
    expect(prompt).toContain('ou_bot_self');
    expect(prompt).toContain('尼莫');
  });

  it('appends the identity line even when the bot name is missing', () => {
    const prompt = buildBridgeSystemPrompt({ openId: 'ou_bot_self' });
    expect(prompt).toContain('ou_bot_self');
  });
});

describe('prefixBridgeSystemPrompt', () => {
  it('prefixes the identity-aware system prompt before the user message', () => {
    const prompt = prefixBridgeSystemPrompt('hello world', { openId: 'ou_bot_self' });
    expect(prompt).toContain('ou_bot_self');
    expect(prompt.indexOf('ou_bot_self')).toBeLessThan(prompt.indexOf('## user_message'));
    expect(prompt.endsWith('hello world')).toBe(true);
  });

  it('keeps working without an identity', () => {
    const prompt = prefixBridgeSystemPrompt('hello world', undefined);
    expect(prompt.startsWith(BRIDGE_SYSTEM_PROMPT)).toBe(true);
    expect(prompt.endsWith('hello world')).toBe(true);
  });
});

/** Collect full fenced code blocks (opening fence line through closing fence line). */
function extractFences(text: string): string[] {
  const fences: string[] = [];
  let current: string[] | null = null;
  for (const line of text.split('\n')) {
    if (line.startsWith('```')) {
      if (current) {
        current.push(line);
        fences.push(current.join('\n'));
        current = null;
      } else {
        current = [line];
      }
    } else if (current) {
      current.push(line);
    }
  }
  return fences;
}

describe('locale variants of the bridge system prompt', () => {
  afterEach(() => {
    setActiveLocale(DEFAULT_LOCALE);
  });

  it('instructs replying in the language the user writes in, in all variants', () => {
    expect(BRIDGE_SYSTEM_PROMPT).toContain('回复语言跟随用户');
    expect(BRIDGE_SYSTEM_PROMPT).toContain('始终使用用户消息所用的语言回复');
    expect(BRIDGE_SYSTEM_PROMPT_EN).toContain('Reply language follows the user');
    expect(BRIDGE_SYSTEM_PROMPT_EN).toContain(
      'always reply in the language the user writes in',
    );
    expect(BRIDGE_SYSTEM_PROMPT_JA).toContain('返信言語はユーザーに合わせる');
    expect(BRIDGE_SYSTEM_PROMPT_JA).toContain(
      '常にユーザーのメッセージで使われている言語で返信してください',
    );
  });

  it('keeps machine-readable fenced blocks byte-identical across variants', () => {
    const zhFences = extractFences(BRIDGE_SYSTEM_PROMPT);
    const enFences = extractFences(BRIDGE_SYSTEM_PROMPT_EN);
    const jaFences = extractFences(BRIDGE_SYSTEM_PROMPT_JA);
    expect(zhFences.length).toBeGreaterThan(0);
    expect(enFences).toEqual(zhFences);
    expect(jaFences).toEqual(zhFences);
  });

  it('keeps the send-card contract markers in the en variant', () => {
    expect(BRIDGE_SYSTEM_PROMPT_EN).toContain('__bridge_cb');
    expect(BRIDGE_SYSTEM_PROMPT_EN).toContain('```lark-card```');
    expect(BRIDGE_SYSTEM_PROMPT_EN).toContain('[card-click]');
    expect(BRIDGE_SYSTEM_PROMPT_EN).toContain(
      'lark-channel-bridge send-card --chat-id <oc_xxx> --operator <ou_xxx|*> --file card.json',
    );
  });

  it('keeps the send-card contract markers in the ja variant', () => {
    expect(BRIDGE_SYSTEM_PROMPT_JA).toContain('__bridge_cb');
    expect(BRIDGE_SYSTEM_PROMPT_JA).toContain('```lark-card```');
    expect(BRIDGE_SYSTEM_PROMPT_JA).toContain('[card-click]');
    expect(BRIDGE_SYSTEM_PROMPT_JA).toContain(
      'lark-channel-bridge send-card --chat-id <oc_xxx> --operator <ou_xxx|*> --file card.json',
    );
  });

  it('keeps the env-var and OAuth contract markers in the ja variant', () => {
    expect(BRIDGE_SYSTEM_PROMPT_JA).toContain('LARK_CHANNEL_HOME');
    expect(BRIDGE_SYSTEM_PROMPT_JA).toContain('LARKSUITE_CLI_CONFIG_DIR');
    expect(BRIDGE_SYSTEM_PROMPT_JA).toContain(
      'lark-cli auth login --no-wait --json [--recommend | --domain ... | --scope ...]',
    );
    expect(BRIDGE_SYSTEM_PROMPT_JA).toContain('lark-cli auth login --device-code <code>');
    expect(BRIDGE_SYSTEM_PROMPT_JA).toContain('/stop');
  });

  it('selects the en variant at call time when the active locale is en-US', () => {
    setActiveLocale('en-US');
    expect(buildBridgeSystemPrompt(undefined)).toBe(BRIDGE_SYSTEM_PROMPT_EN);

    const withIdentity = buildBridgeSystemPrompt({ openId: 'ou_bot_self', name: 'Nemo' });
    expect(withIdentity.startsWith(BRIDGE_SYSTEM_PROMPT_EN)).toBe(true);
    expect(withIdentity).toContain('## Your identity');
    expect(withIdentity).toContain('ou_bot_self');
    expect(withIdentity).toContain('Nemo');

    const wrapped = prefixBridgeSystemPrompt('hello world', undefined);
    expect(wrapped.startsWith(BRIDGE_SYSTEM_PROMPT_EN)).toBe(true);
    expect(wrapped).toContain('## user_message');
    expect(wrapped.endsWith('hello world')).toBe(true);
  });

  it('selects the ja variant at call time when the active locale is ja-JP', () => {
    setActiveLocale('ja-JP');
    expect(buildBridgeSystemPrompt(undefined)).toBe(BRIDGE_SYSTEM_PROMPT_JA);

    const withIdentity = buildBridgeSystemPrompt({ openId: 'ou_bot_self', name: 'ニモ' });
    expect(withIdentity.startsWith(BRIDGE_SYSTEM_PROMPT_JA)).toBe(true);
    expect(withIdentity).toContain('## あなたのアイデンティティ');
    expect(withIdentity).toContain('ou_bot_self');
    expect(withIdentity).toContain('ニモ');

    const withoutName = buildBridgeSystemPrompt({ openId: 'ou_bot_self' });
    expect(withoutName).toContain('ou_bot_self');

    const wrapped = prefixBridgeSystemPrompt('hello world', undefined);
    expect(wrapped.startsWith(BRIDGE_SYSTEM_PROMPT_JA)).toBe(true);
    expect(wrapped).toContain('## user_message');
    expect(wrapped.endsWith('hello world')).toBe(true);
  });

  it('returns to the zh variant after the locale is reset', () => {
    setActiveLocale('en-US');
    setActiveLocale(DEFAULT_LOCALE);
    expect(buildBridgeSystemPrompt(undefined)).toBe(BRIDGE_SYSTEM_PROMPT);

    setActiveLocale('ja-JP');
    setActiveLocale(DEFAULT_LOCALE);
    expect(buildBridgeSystemPrompt(undefined)).toBe(BRIDGE_SYSTEM_PROMPT);
  });
});
