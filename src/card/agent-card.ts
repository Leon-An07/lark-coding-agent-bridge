/** One entry in the submit button's `__ask` map: enough to turn the raw
 * `form_value` back into readable `{question: answer}` for the agent. */
export interface AskMapEntry {
  /** form field name (for single-field components) */
  f: string;
  /** the question text (becomes the answer key) */
  q: string;
  /** component kind, decides how form_value is read */
  k: 'input' | 'select' | 'multi' | 'date' | 'person' | 'persons' | 'checker';
  /** for `checker` (checkbox multi): the per-option fields + labels */
  opts?: Array<{ f: string; label: string }>;
}

/**
 * Turn a submitted `form_value` back into clean `{question: answer}` using the
 * `__ask` map baked into the submit button. Single value → string; multi-select
 * / multi-person → string[]; checkbox group → the checked labels.
 */
export function resolveAskAnswers(
  askMap: AskMapEntry[],
  formValue: Record<string, unknown> | undefined,
): Record<string, string | string[]> {
  const answers: Record<string, string | string[]> = {};
  for (const item of askMap) {
    if (!item || typeof item.q !== 'string') continue;
    if (item.k === 'checker') {
      answers[item.q] = (item.opts ?? [])
        .filter((o) => {
          const v = formValue?.[o.f];
          return v === true || v === 'true';
        })
        .map((o) => o.label);
      continue;
    }
    const raw = formValue?.[item.f];
    if (item.k === 'multi' || item.k === 'persons') {
      answers[item.q] = Array.isArray(raw)
        ? raw.filter((v): v is string => typeof v === 'string')
        : typeof raw === 'string' && raw.trim()
          ? [raw.trim()]
          : [];
    } else {
      answers[item.q] = typeof raw === 'string' ? raw : raw == null ? '' : String(raw);
    }
  }
  return answers;
}
