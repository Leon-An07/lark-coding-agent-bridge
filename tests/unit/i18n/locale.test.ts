import { afterEach, describe, expect, it } from 'vitest';
import {
  DEFAULT_LOCALE,
  SUPPORTED_LOCALES,
  enUS,
  jaJP,
  msgs,
  normalizeLocale,
  setActiveLocale,
  zhCN,
} from '../../../src/i18n/index.js';

afterEach(() => setActiveLocale(DEFAULT_LOCALE));

describe('locale selection', () => {
  it('msgs() returns the catalog matching every supported locale', () => {
    // This is the guard that was missing when ja-JP shipped translated but
    // unwired — msgs() silently fell back to zh for it.
    const expected = { 'zh-CN': zhCN, 'en-US': enUS, 'ja-JP': jaJP } as const;
    for (const locale of SUPPORTED_LOCALES) {
      setActiveLocale(locale);
      expect(msgs(), locale).toBe(expected[locale]);
    }
  });

  it('normalizeLocale maps loose inputs onto supported locales', () => {
    expect(normalizeLocale('zh')).toBe('zh-CN');
    expect(normalizeLocale('zh_CN')).toBe('zh-CN');
    expect(normalizeLocale('en')).toBe('en-US');
    expect(normalizeLocale('en_GB')).toBe('en-US');
    expect(normalizeLocale('ja')).toBe('ja-JP');
    expect(normalizeLocale('ja_JP.UTF-8')).toBe('ja-JP');
    expect(normalizeLocale('fr')).toBeUndefined();
    expect(normalizeLocale(undefined)).toBeUndefined();
  });

  it('catalogs are distinct objects per locale', () => {
    const flat = (o: object): string => JSON.stringify(o, (_k, v) => (typeof v === 'function' ? String(v) : v));
    expect(flat(enUS)).not.toEqual(flat(zhCN));
    expect(flat(jaJP)).not.toEqual(flat(zhCN));
    expect(flat(jaJP)).not.toEqual(flat(enUS));
  });
});
