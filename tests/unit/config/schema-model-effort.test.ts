import { describe, expect, it } from 'vitest';
import { getEffort, getModel, type AppConfig } from '../../../src/config/schema.js';

function cfg(preferences?: AppConfig['preferences']): AppConfig {
  return {
    accounts: { app: { id: 'app', secret: 'secret', tenant: 'feishu' } },
    ...(preferences ? { preferences } : {}),
  };
}

describe('getModel', () => {
  it('returns undefined when unset (→ CLI default)', () => {
    expect(getModel(cfg())).toBeUndefined();
    expect(getModel(cfg({}))).toBeUndefined();
  });

  it('passes through any non-empty string (alias or full id)', () => {
    expect(getModel(cfg({ model: 'opus' }))).toBe('opus');
    expect(getModel(cfg({ model: 'claude-opus-4-8' }))).toBe('claude-opus-4-8');
  });

  it('trims and treats blank / non-string as unset', () => {
    expect(getModel(cfg({ model: '  sonnet  ' }))).toBe('sonnet');
    expect(getModel(cfg({ model: '   ' }))).toBeUndefined();
    expect(getModel(cfg({ model: 123 as unknown as string }))).toBeUndefined();
  });
});

describe('getEffort', () => {
  it('returns undefined when unset (→ CLI default)', () => {
    expect(getEffort(cfg())).toBeUndefined();
    expect(getEffort(cfg({}))).toBeUndefined();
  });

  it('accepts the known effort levels', () => {
    for (const level of ['low', 'medium', 'high', 'xhigh', 'max'] as const) {
      expect(getEffort(cfg({ effort: level }))).toBe(level);
    }
    expect(getEffort(cfg({ effort: '  high  ' }))).toBe('high');
  });

  it('rejects unknown values as undefined', () => {
    expect(getEffort(cfg({ effort: 'bogus' }))).toBeUndefined();
    expect(getEffort(cfg({ effort: 'ultra' }))).toBeUndefined();
    expect(getEffort(cfg({ effort: '' }))).toBeUndefined();
  });
});
