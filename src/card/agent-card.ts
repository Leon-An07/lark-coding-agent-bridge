/**
 * Agent-authored interactive cards.
 *
 * To ask the user something (pick an option, confirm, fill a field) the agent
 * just emits a fenced block in its reply text:
 *
 *   ```lark-card
 *   { "header": "选择方案", "text": "用哪个?",
 *     "buttons": [ { "text": "方案 A", "value": { "choice": "a" } },
 *                  { "text": "方案 B", "value": { "choice": "b" } } ] }
 *   ```
 *
 * The bridge (see `runAgentBatch`) intercepts the block, builds a real Lark
 * card, and SIGNS each callback with a bridge token (the agent never holds the
 * secret). One token is shared per card, so its single-use nonce makes the card
 * answered-once; the token also carries operator binding (`restrict`) and an
 * expiry. When the user clicks, the dispatcher verifies the token and forwards
 * the click back into the session as a `[card-click] {...}` message. (If the
 * bridge has no signing key, it falls back to a tokenless, bot-authored value.)
 */

export interface AskButtonSpec {
  text: string;
  /** Fields echoed back to the agent on click. Object preferred; a scalar is
   * wrapped as `{ value: <scalar> }`. */
  value?: unknown;
  style?: 'primary' | 'danger' | 'default';
}

/** One question in the AskUserQuestion-style form model (mirrors Claude's
 * AskUserQuestion). All render inside one Lark schema-2.0 form, answered in a
 * single submit. */
export interface QuestionSpec {
  question: string;
  header?: string;
  options?: Array<{ label: string; description?: string }>;
  /** Multiple choice allowed. Default false (single). */
  multiSelect?: boolean;
  /** Component to render. Inferred when omitted: with `options` → `select`,
   * without → `input`.
   *  - `select`  : dropdown (single) / dropdown or checkbox (multi)
   *  - `input`   : free-text field
   *  - `date`    : date picker
   *  - `person`  : member picker (single, or multi when `multiSelect`) */
  type?: 'select' | 'input' | 'date' | 'person';
  /** For a multi-select `select` question: `dropdown` (default) or `checkbox`
   * (each option a checkbox row, all visible). */
  selectStyle?: 'dropdown' | 'checkbox';
}

export interface AskCardSpec {
  header?: string;
  text?: string;
  buttons?: AskButtonSpec[];
  /** AskUserQuestion-style form: one or more questions rendered as
   * select / multi-select / text-input inside a Lark schema-2.0 form, all
   * answered at once via a single submit (form_value). */
  questions?: QuestionSpec[];
  /** Who may click. `"me"` (default) = only the user who triggered this turn;
   * `"anyone"` = no restriction (e.g. a group poll, first click wins); an
   * `ou_...` open_id = only that person. Every card is single-use regardless —
   * the signed token's nonce is consumed on the first valid click. */
  restrict?: 'me' | 'anyone' | string;
}

const CARD_FENCE = /```lark-card[ \t]*\r?\n([\s\S]*?)```/g;
// A block the agent has begun but not closed yet (mid-stream) — stripped from
// the rendered text so the raw JSON never flashes to the user.
const CARD_FENCE_UNCLOSED = /```lark-card[ \t]*\r?\n[\s\S]*$/;

/** Parse every complete ```lark-card``` block into a spec object. Invalid JSON
 * is skipped — a malformed block never aborts the agent's reply. */
export function extractAgentCardSpecs(text: string): AskCardSpec[] {
  const specs: AskCardSpec[] = [];
  CARD_FENCE.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = CARD_FENCE.exec(text)) !== null) {
    const body = (m[1] ?? '').trim();
    if (!body) continue;
    try {
      const parsed: unknown = JSON.parse(body);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        specs.push(parsed as AskCardSpec);
      }
    } catch {
      // skip invalid card JSON
    }
  }
  return specs;
}

/** A spec is worth sending only if it has interactive content. */
export function isInteractiveSpec(spec: AskCardSpec): boolean {
  return (
    (Array.isArray(spec.questions) && spec.questions.length > 0) ||
    (Array.isArray(spec.buttons) && spec.buttons.length > 0)
  );
}

/** Field name for question `i` inside the form (one field per question). */
export function askFieldName(i: number): string {
  return `q${i}`;
}

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

/** Remove ```lark-card``` blocks (complete + a trailing unclosed one) so the
 * raw card JSON is never rendered — the real card is sent separately. */
export function stripAgentCardBlocks(text: string): string {
  if (!text.includes('```lark-card')) return text;
  return text.replace(CARD_FENCE, '').replace(CARD_FENCE_UNCLOSED, '').trimEnd();
}
