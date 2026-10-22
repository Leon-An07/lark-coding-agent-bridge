import type {
  ChildProcess,
  ChildProcessByStdio,
  SpawnOptions,
  SpawnSyncOptions,
} from 'node:child_process';
import type { Readable, Writable } from 'node:stream';
import { spawnSync } from 'node:child_process';
import crossSpawn from 'cross-spawn';

/** Windows: no console window per child (claude, codex, lark-cli...), which
 * otherwise flashes a black window for every message (#51). Callers can
 * still pass `windowsHide: false`. Ignored on other platforms. */
const HIDE_WINDOW = { windowsHide: true } as const;

export function spawnProcess(
  command: string,
  args: readonly string[] = [],
  options: SpawnOptions = {},
): ChildProcess {
  return crossSpawn(command, [...args], { ...HIDE_WINDOW, ...options });
}

/**
 * Kill a spawned child and its descendants. Requires the child to have been
 * spawned with `detached: true` on POSIX so it leads its own process group —
 * signalling -pid then reaches grandchildren (Bash tools, MCP servers,
 * lark-cli waiting on OAuth) that a plain child.kill() would orphan. Falls
 * back to a direct kill when the group signal fails.
 *
 * Windows has no process groups and no graceful SIGTERM: child.kill() only
 * ends the direct child, which for a `.cmd` shim is cmd.exe, leaving the
 * real agent running (#274). taskkill /T ends the whole tree.
 */
export function killProcessTree(child: ChildProcess, signal: NodeJS.Signals): boolean {
  if (child.pid !== undefined && process.platform === 'win32') {
    if (killWindowsProcessTree(child.pid)) return true;
  } else if (child.pid !== undefined) {
    try {
      process.kill(-child.pid, signal);
      return true;
    } catch {
      // fall through to direct kill
    }
  }
  return child.kill(signal);
}

/** Whether a process with this PID exists (EPERM = exists, not ours). */
export function isProcessAlive(pid: number): boolean {
  try {
    process.kill(pid, 0);
    return true;
  } catch (err) {
    return (err as NodeJS.ErrnoException).code === 'EPERM';
  }
}

/**
 * Windows: force-kill `pid` and every descendant. Only the exit code is
 * read, because taskkill's text output is localized.
 */
export function killWindowsProcessTree(pid: number): boolean {
  const r = spawnSync('taskkill', ['/PID', String(pid), '/T', '/F'], {
    stdio: 'ignore',
    windowsHide: true,
  });
  return r.status === 0;
}

export function spawnProcessSync(
  command: string,
  args: readonly string[] = [],
  options: SpawnSyncOptions = {},
) {
  return crossSpawn.sync(command, [...args], { ...HIDE_WINDOW, ...options });
}

export function mergeProcessEnv(
  base: NodeJS.ProcessEnv = process.env,
  overrides: NodeJS.ProcessEnv = {},
): NodeJS.ProcessEnv {
  const out: NodeJS.ProcessEnv = { ...base };
  for (const [key, value] of Object.entries(overrides)) {
    for (const existing of Object.keys(out)) {
      if (existing.toLowerCase() === key.toLowerCase()) {
        delete out[existing];
      }
    }
    if (value !== undefined) out[key] = value;
  }
  return out;
}

export type SpawnedProcessByStdio<
  Stdin extends Writable | null,
  Stdout extends Readable | null,
  Stderr extends Readable | null,
> = ChildProcessByStdio<Stdin, Stdout, Stderr>;
