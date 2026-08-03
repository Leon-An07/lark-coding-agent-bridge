import type { AgentKind } from '../config/profile-schema';
import { msgs } from '../i18n';

/**
 * Sentinel selection meaning "don't pass `--model`; let the agent CLI /
 * account decide". Kept as a real option value (rather than empty string)
 * because Feishu's `select_static` requires `initial_option` to match one of
 * the option `value`s exactly and rejects an empty string.
 */
export const DEFAULT_MODEL = 'default';

export interface ModelOption {
  /**
   * Stored in `preferences.model` and forwarded to the agent's `--model`
   * flag. `DEFAULT_MODEL` is special-cased to omit the flag entirely.
   */
  value: string;
  /** Human-facing label shown in the `/config` picker. */
  label: string;
}

/**
 * Claude Code models. Pinned to concrete version ids (Claude Code's `--model`
 * accepts the full model-id string, not just the `opus`/`sonnet` aliases) so
 * the picker names an exact model. Add new ids here when a generation ships;
 * `opusplan` is kept as the one alias with no versioned equivalent (it runs
 * Opus for planning and Sonnet for execution).
 *
 * Built per call rather than module-level: labels come from the active i18n
 * catalog, which a `/config` language change can flip at runtime.
 */
function claudeModels(): ModelOption[] {
  const m = msgs().cards;
  return [
    { value: DEFAULT_MODEL, label: m.modelOptDefault },
    { value: 'claude-fable-5', label: 'Fable 5' },
    { value: 'claude-opus-5', label: m.modelOptLatest('Opus 5') },
    { value: 'claude-opus-4-8', label: 'Opus 4.8' },
    { value: 'claude-opus-4-7', label: 'Opus 4.7' },
    { value: 'claude-sonnet-5', label: m.modelOptLatest('Sonnet 5') },
    { value: 'claude-sonnet-4-6', label: 'Sonnet 4.6' },
    { value: 'claude-haiku-4-5', label: m.modelOptLatest('Haiku 4.5') },
    { value: 'opusplan', label: m.modelOptOpusPlan },
  ];
}

/**
 * Codex CLI models. Forwarded to `codex exec --model`.
 *
 * The three GPT-5.6 tiers are codex's own presets — each ships a `slug` +
 * `display_name` in the binary: Sol is the flagship, Terra the mini-like
 * middle tier, Luna the nano-like fast one. The bare `gpt-5.6` alias routes to
 * Sol, so it isn't listed separately. Unlike the Claude list — where every past
 * generation is still served and stays selectable — codex retires generations
 * outright ("GPT-5.4 is no longer available"), so superseded ids are removed
 * here rather than kept alongside.
 */
function codexModels(): ModelOption[] {
  const m = msgs().cards;
  return [
    { value: DEFAULT_MODEL, label: m.modelOptDefault },
    { value: 'gpt-5.6-sol', label: m.modelOptLatest('GPT-5.6 Sol') },
    { value: 'gpt-5.6-terra', label: 'GPT-5.6 Terra' },
    { value: 'gpt-5.6-luna', label: 'GPT-5.6 Luna' },
  ];
}

/** The model picker options for a profile's agent kind. */
export function supportedModels(agentKind: AgentKind): ModelOption[] {
  return agentKind === 'codex' ? codexModels() : claudeModels();
}

/** True when the selection means "use the agent default" (no `--model`). */
export function isDefaultModel(value: string | undefined): boolean {
  return !value || value === DEFAULT_MODEL;
}

/**
 * Coerce a stored model preference into a value guaranteed to be one of the
 * current agent's picker options — Feishu's `select_static` requires
 * `initial_option` to match an option value exactly. Unknown / cross-agent
 * values (e.g. a Claude alias left over after switching a profile to Codex)
 * fall back to {@link DEFAULT_MODEL}.
 */
export function normalizeModelSelection(
  agentKind: AgentKind,
  value: string | undefined,
): string {
  if (isDefaultModel(value)) return DEFAULT_MODEL;
  return supportedModels(agentKind).some((m) => m.value === value)
    ? (value as string)
    : DEFAULT_MODEL;
}

/**
 * Resolve the concrete model string to hand the agent, or `undefined` to omit
 * the `--model` flag. Cross-agent / unknown values are treated as "default".
 */
export function resolveModelArg(
  agentKind: AgentKind,
  value: string | undefined,
): string | undefined {
  const normalized = normalizeModelSelection(agentKind, value);
  return normalized === DEFAULT_MODEL ? undefined : normalized;
}

/** Picker label for a stored value, for display in the saved-config card. */
export function modelLabel(agentKind: AgentKind, value: string | undefined): string {
  const normalized = normalizeModelSelection(agentKind, value);
  return supportedModels(agentKind).find((m) => m.value === normalized)?.label ?? normalized;
}
