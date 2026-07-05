import { readAndPrune, resolveTarget, isAlive } from '../../runtime/registry';
import type { ProcessEntry } from '../../runtime/registry';
import { msgs } from '../../i18n';

/**
 * Pretty-print the list of running lark-channel-bridge processes.
 *
 * `readAndPrune` is a legacy name; read-only views never rewrite registry
 * state. Persistence happens on the next `register` / `unregister` /
 * `updateEntry` call.
 */
export function runPs(): void {
  const m = msgs();
  const live = readAndPrune();
  if (live.length === 0) {
    console.log(m.cli.psNoneRunning);
    return;
  }
  console.log(m.cli.psRunningCount(live.length));
  const rows = live.map((e, idx) => {
    const ago = formatAgo(Date.now() - new Date(e.startedAt).getTime());
    const app = e.botName ? `${e.botName} (${e.appId})` : e.appId;
    return {
      idx: String(idx + 1),
      id: e.id,
      pid: String(e.pid),
      app,
      started: ago,
      version: e.version,
    };
  });
  const headers = {
    idx: '#',
    id: 'ID',
    pid: 'PID',
    app: 'Bot',
    started: m.cli.psHeaderStarted,
    version: m.cli.psHeaderVersion,
  };
  printTable([headers, ...rows]);
}

export async function runKillCli(target: string | undefined): Promise<void> {
  const m = msgs();
  if (!target) {
    console.error(m.cli.killUsage);
    process.exit(1);
  }
  const entry = resolveTarget(target);
  if (!entry) {
    console.error(m.cli.killNotFound(target));
    console.error(m.cli.killSeeTargets);
    process.exit(1);
  }
  console.log(m.cli.killClosing(entry.id));
  let result: StopProcessEntryResult;
  try {
    result = await stopProcessEntry(entry);
  } catch (err) {
    console.error(m.cli.killFailed((err as Error).message));
    process.exit(1);
  }

  if (result === 'killed') {
    console.log(m.cli.killForceClosed(entry.id));
    return;
  }
  console.log(m.cli.killClosed(entry.id));
}

export type StopProcessEntryResult = 'terminated' | 'killed';

export async function stopProcessEntry(
  entry: Pick<ProcessEntry, 'pid'> & { id?: string },
  timeoutMs = 2000,
): Promise<StopProcessEntryResult> {
  process.kill(entry.pid, 'SIGTERM');

  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (!isAlive(entry.pid)) {
      return 'terminated';
    }
    await new Promise((r) => setTimeout(r, 100));
  }

  process.kill(entry.pid, 'SIGKILL');
  const forceDeadline = Date.now() + timeoutMs;
  while (Date.now() < forceDeadline) {
    if (!isAlive(entry.pid)) {
      return 'killed';
    }
    await new Promise((r) => setTimeout(r, 100));
  }
  throw new Error(`process ${entry.pid} did not exit after SIGKILL`);
}

function formatAgo(ms: number): string {
  const m = msgs();
  if (ms < 60_000) return m.cli.psAgoSeconds(Math.floor(ms / 1000));
  if (ms < 3_600_000) return m.cli.psAgoMinutes(Math.floor(ms / 60_000));
  if (ms < 86_400_000) return m.cli.psAgoHours(Math.floor(ms / 3_600_000));
  return m.cli.psAgoDays(Math.floor(ms / 86_400_000));
}

/** Minimal fixed-width table. Header row is index 0. */
function printTable(rows: Record<string, string>[]): void {
  if (rows.length === 0) return;
  const headerRow = rows[0];
  if (!headerRow) return;
  const cols = Object.keys(headerRow);
  const widths: Record<string, number> = {};
  for (const col of cols) {
    widths[col] = Math.max(...rows.map((r) => displayWidth(r[col] ?? '')));
  }
  for (const r of rows) {
    const line = cols
      .map((c) => padEndDisplay(r[c] ?? '', widths[c] ?? 0))
      .join('  ');
    console.log(line);
  }
}

function displayWidth(s: string): number {
  // Approximate — CJK chars take 2 cells. Avoids pulling in wcwidth.
  let w = 0;
  for (const ch of s) {
    const code = ch.codePointAt(0) ?? 0;
    w += code > 0x2e80 ? 2 : 1;
  }
  return w;
}

function padEndDisplay(s: string, target: number): string {
  const pad = target - displayWidth(s);
  return pad > 0 ? s + ' '.repeat(pad) : s;
}
