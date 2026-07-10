import { describe, expect, it } from 'vitest';
import { getEffort, type AppConfig } from '../../../src/config/schema.js';

// Model resolution moved to agent/models.ts (resolveModelArg) after the
// upstream merge — the model picker is agent-kind aware there. This file now
// only covers the effort preference resolver, which is bridge-local.
function cfg(preferences?: AppConfig['preferences']): AppConfig {
  return {
    accounts: { app: { id: 'app', secret: 'secret', tenant: 'feishu' } },
    ...(preferences ? { preferences } : {}),
  };
}

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
