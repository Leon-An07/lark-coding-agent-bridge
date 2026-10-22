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
import { commandsZh, commandsEn, commandsJa } from './catalog/commands';
import { cardsZh, cardsEn, cardsJa } from './catalog/cards';
import { botZh, botEn, botJa } from './catalog/bot';
import { cliZh, cliEn, cliJa } from './catalog/cli';
import { policyZh, policyEn, policyJa } from './catalog/policy';
import { helpZh, helpEn, helpJa } from './catalog/help';
import { setupZh, setupEn, setupJa } from './catalog/setup';
import { webZh, webEn, webJa } from './catalog/web';

export type Locale = 'zh-CN' | 'en-US' | 'ja-JP';

export const DEFAULT_LOCALE: Locale = 'zh-CN';
export const SUPPORTED_LOCALES: readonly Locale[] = ['zh-CN', 'en-US', 'ja-JP'];

/** Loose input (config value, LANG env, BCP-47-ish) → supported locale. */
export function normalizeLocale(raw: string | undefined | null): Locale | undefined {
  if (!raw) return undefined;
  const v = raw.trim().toLowerCase().replace(/_/g, '-');
  if (v === 'zh' || v.startsWith('zh-')) return 'zh-CN';
  if (v === 'en' || v.startsWith('en-')) return 'en-US';
  if (v === 'ja' || v.startsWith('ja-')) return 'ja-JP';
  return undefined;
}

/**
 * The OS user's locale, for when no config preference exists yet (first run,
 * `--help`). POSIX env vars first (LC_ALL > LC_MESSAGES > LANG, skipping
 * C/POSIX), then the ICU default, which is how Windows reports it: Windows
 * sets no LANG, so a Japanese Windows user gets `ja-JP` from Intl.
 */
export function detectOsLocale(
  env: NodeJS.ProcessEnv = process.env,
  intlLocale: string | undefined = safeIntlLocale(),
): Locale | undefined {
  for (const raw of [env.LC_ALL, env.LC_MESSAGES, env.LANG]) {
    if (!raw || /^(c|posix)([._@]|$)/i.test(raw)) continue;
    // The first set variable decides, even when it is unsupported (fr_FR):
    // an unsupported POSIX locale should not fall through to Intl.
    return normalizeLocale(raw);
  }
  return normalizeLocale(intlLocale);
}

function safeIntlLocale(): string | undefined {
  try {
    return Intl.DateTimeFormat().resolvedOptions().locale;
  } catch {
    return undefined;
  }
}

export const zhCN = {
  commands: commandsZh,
  cards: cardsZh,
  bot: botZh,
  cli: cliZh,
  policy: policyZh,
  help: helpZh,
  setup: setupZh,
  web: webZh,
};

export type Messages = typeof zhCN;

export const enUS: Messages = {
  commands: commandsEn,
  cards: cardsEn,
  bot: botEn,
  cli: cliEn,
  policy: policyEn,
  help: helpEn,
  setup: setupEn,
  web: webEn,
};

export const jaJP: Messages = {
  commands: commandsJa,
  cards: cardsJa,
  bot: botJa,
  cli: cliJa,
  policy: policyJa,
  help: helpJa,
  setup: setupJa,
  web: webJa,
};

const catalogs: Record<Locale, Messages> = {
  'zh-CN': zhCN,
  'en-US': enUS,
  'ja-JP': jaJP,
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
  return catalogs[active];
}
