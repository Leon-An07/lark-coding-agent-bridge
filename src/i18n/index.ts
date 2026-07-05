/**
 * Lightweight i18n for all user-facing strings (IM replies, cards, CLI
 * output). No third-party runtime: catalogs are plain typed objects, and
 * `enUS: Messages` makes a missing translation a compile error.
 *
 * The locale is AMBIENT (module-level), not threaded through signatures:
 * the bridge daemon serves one profile with one language preference, so a
 * process-wide setting is correct and keeps renderers' signatures stable.
 * Call `setActiveLocale` once after config load (and again when /config
 * changes the preference); everything rendering after that picks it up.
 *
 * Catalog layout: one namespace per module cluster under src/i18n/catalog/.
 * zh-CN is the source of truth — the en catalog must satisfy `typeof <zh>`.
 */
import { commandsZh, commandsEn } from './catalog/commands';
import { cardsZh, cardsEn } from './catalog/cards';
import { botZh, botEn } from './catalog/bot';
import { cliZh, cliEn } from './catalog/cli';
import { policyZh, policyEn } from './catalog/policy';

export type Locale = 'zh-CN' | 'en-US';

export const DEFAULT_LOCALE: Locale = 'zh-CN';
export const SUPPORTED_LOCALES: readonly Locale[] = ['zh-CN', 'en-US'];

/** Loose input (config value, LANG env, BCP-47-ish) → supported locale. */
export function normalizeLocale(raw: string | undefined | null): Locale | undefined {
  if (!raw) return undefined;
  const v = raw.trim().toLowerCase().replace(/_/g, '-');
  if (v === 'zh' || v.startsWith('zh-')) return 'zh-CN';
  if (v === 'en' || v.startsWith('en-')) return 'en-US';
  return undefined;
}

export const zhCN = {
  commands: commandsZh,
  cards: cardsZh,
  bot: botZh,
  cli: cliZh,
  policy: policyZh,
};

export type Messages = typeof zhCN;

export const enUS: Messages = {
  commands: commandsEn,
  cards: cardsEn,
  bot: botEn,
  cli: cliEn,
  policy: policyEn,
};

let active: Locale = DEFAULT_LOCALE;

export function setActiveLocale(locale: Locale): void {
  active = locale;
}

export function activeLocale(): Locale {
  return active;
}

/** The active catalog. Grab fresh per render — don't cache across awaits
 * that may span a /config language change. */
export function msgs(): Messages {
  return active === 'en-US' ? enUS : zhCN;
}
