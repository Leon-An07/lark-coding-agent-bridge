/**
 * Render Windows batch (.cmd) files that survive non-ASCII paths.
 *
 * cmd.exe decodes a batch file with the console codepage (CP932 on Japanese
 * Windows, GBK on Chinese, 437 on US), not UTF-8. A UTF-8 `C:\Users\田中`
 * inside the file turns into mojibake and the path no longer exists.
 *
 * The fix keeps the file body ASCII: any path under a well-known per-user
 * directory is rewritten as `%USERPROFILE%\...` (etc.). cmd.exe expands
 * variables from the wide-char environment block, so the expanded path keeps
 * its real characters. Only a path outside those roots can stay non-ASCII;
 * for those the caller may opt into a leading `chcp 65001` (safe only in a
 * console the script owns, such as the Task Scheduler launcher).
 */

/** Env vars tried in this order; longest (most specific) roots first. */
const PATH_ROOT_VARS = ['LOCALAPPDATA', 'APPDATA', 'USERPROFILE', 'ProgramFiles', 'ProgramFiles(x86)'] as const;

export type BatchEnv = Partial<Record<(typeof PATH_ROOT_VARS)[number], string>>;

export function batchEnvFrom(env: NodeJS.ProcessEnv = process.env): BatchEnv {
  const out: BatchEnv = {};
  for (const name of PATH_ROOT_VARS) {
    const value = env[name];
    if (value) out[name] = value;
  }
  return out;
}

/**
 * Turn a value into text that is safe inside a batch `set "X=..."` line or a
 * double-quoted argument: escape `%` and replace known per-user roots with
 * `%VAR%` references. A PATH-like value is handled entry by entry.
 */
export function batchValue(value: string, env: BatchEnv): string {
  return value
    .split(';')
    .map((entry) => batchPath(entry, env))
    .join(';');
}

function batchPath(entry: string, env: BatchEnv): string {
  const roots = PATH_ROOT_VARS.flatMap((name) => {
    const root = env[name]?.replace(/[\\/]+$/, '');
    return root ? [{ name, root }] : [];
  }).sort((a, b) => b.root.length - a.root.length);
  for (const { name, root } of roots) {
    const head = entry.slice(0, root.length);
    const rest = entry.slice(root.length);
    if (head.toLowerCase() === root.toLowerCase() && (rest === '' || /^[\\/]/.test(rest))) {
      return `%${name}%${escapePercent(rest)}`;
    }
  }
  return escapePercent(entry);
}

function escapePercent(s: string): string {
  return s.replace(/%/g, '%%');
}

export function isAscii(s: string): boolean {
  return /^[\x00-\x7f]*$/.test(s);
}

/**
 * Join batch lines with CRLF. When `allowChcp` is set and a line still holds
 * non-ASCII, prepend `chcp 65001>nul` so cmd.exe reads the rest as UTF-8.
 * The file must be written as UTF-8 without a BOM.
 */
export function renderBatchFile(lines: string[], opts: { allowChcp?: boolean } = {}): string {
  const [first, ...rest] = lines;
  const needsUtf8 = opts.allowChcp && !lines.every(isAscii);
  const body = needsUtf8 && first !== undefined ? [first, 'chcp 65001>nul', ...rest] : lines;
  return `${body.join('\r\n')}\r\n`;
}
