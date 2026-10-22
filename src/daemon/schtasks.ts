import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import {
  daemonLogDir,
  daemonStderrPath,
  daemonStdoutPath,
  windowsTaskName,
  windowsLauncherCmdPath,
  windowsServicePidPath,
} from './paths';
import { paths } from '../config/paths';
import { decodeChildOutput } from '../platform/console-decode';
import { isProcessAlive, killWindowsProcessTree } from '../platform/spawn';
import { batchEnvFrom, batchValue, renderBatchFile, type BatchEnv } from '../platform/windows-batch';

export interface LauncherInputs {
  /** Absolute path to node.exe. */
  nodePath: string;
  /** Absolute path to the bridge CLI entry. */
  bridgeEntryPath: string;
  /** PATH for the child process; baked into the .cmd via `set PATH=`. */
  envPath: string;
  /** Service id (profile name, or the reserved supervisor id) — drives the
   * task name and log paths. */
  profile: string;
  /** CLI args after the entry path, e.g. `['run', '--profile', 'claude']` or
   * `['run', '--web-ui']`. */
  runArgs: string[];
  /** Root directory for config/profile state. */
  channelHome: string;
  /** Per-user root dirs rewritten as `%VAR%` so the body stays ASCII. */
  batchEnv?: BatchEnv;
}

/**
 * Generate the .cmd wrapper script that the scheduled task actually invokes.
 *
 * schtasks `/TR` can accept a direct command, but we need stdout/stderr
 * redirection + a PATH override so child tools (lark-cli, claude) resolve
 * correctly when the daemon runs under Task Scheduler. A `.cmd` script
 * is the natural place for both.
 *
 * `@echo off` keeps the script's own commands out of the daemon log.
 * `>>` / `2>>` append (not truncate) so log history is preserved across
 * daemon restarts.
 */
export function buildLauncherCmd(inputs: LauncherInputs): string {
  // Profile names / flags are validated safe tokens (no spaces).
  const runArgs = inputs.runArgs.join(' ');
  const env = inputs.batchEnv ?? batchEnvFrom();
  const v = (s: string): string => batchValue(s, env);
  // Paths under the user's profile become `%USERPROFILE%\...` so cmd.exe,
  // which reads this file in the OEM codepage (CP932 on Japanese Windows),
  // never sees raw non-ASCII. The launcher owns its console, so `chcp 65001`
  // is a safe last resort for a non-ASCII path outside those roots.
  return renderBatchFile(
    [
      '@echo off',
      `set "LARK_CHANNEL_HOME=${v(inputs.channelHome)}"`,
      `set "LARK_CHANNEL_SERVICE_PID_FILE=${v(windowsServicePidPath(inputs.profile))}"`,
      `set "PATH=${v(inputs.envPath)}"`,
      `"${v(inputs.nodePath)}" "${v(inputs.bridgeEntryPath)}" ${runArgs} >> "${v(daemonStdoutPath(inputs.profile))}" 2>> "${v(daemonStderrPath(inputs.profile))}"`,
    ],
    { allowChcp: true },
  );
}

async function writeLauncherCmd(profile: string, runArgs: string[] = ['run']): Promise<void> {
  const bridgeEntryPath = process.argv[1];
  if (!bridgeEntryPath) {
    throw new Error('cannot determine bridge entry path (process.argv[1] is empty)');
  }
  const content = buildLauncherCmd({
    nodePath: process.execPath,
    bridgeEntryPath,
    envPath: process.env.PATH ?? '',
    profile,
    runArgs,
    channelHome: paths.rootDir,
  });
  const cmdPath = windowsLauncherCmdPath(profile);
  await mkdir(dirname(cmdPath), { recursive: true });
  await mkdir(daemonLogDir(profile), { recursive: true });
  await writeFile(cmdPath, content, 'utf8'); // no BOM: cmd.exe misreads one
}

interface SchtasksResult {
  ok: boolean;
  stderr: string;
  stdout: string;
}

function runSchtasks(args: string[]): SchtasksResult {
  const r = spawnSync('schtasks', args, { windowsHide: true });
  return {
    ok: r.status === 0,
    stderr: decodeChildOutput(r.stderr),
    stdout: decodeChildOutput(r.stdout),
  };
}

/**
 * Create (or overwrite) the scheduled task. Trigger: ONLOGON.
 * `/RL LIMITED` runs as the current user without admin elevation.
 * `/F` overwrites if the task already exists.
 *
 * The /TR value is the .cmd wrapper path. Schtasks treats /TR as a command
 * line, so wrapping in quotes keeps spaces in the path intact.
 */
export async function installTask(
  profile: string,
  runArgs: string[] = ['run'],
): Promise<SchtasksResult> {
  await writeLauncherCmd(profile, runArgs);
  return runSchtasks([
    '/Create',
    '/F',
    '/SC',
    'ONLOGON',
    '/RL',
    'LIMITED',
    '/TN',
    windowsTaskName(profile),
    '/TR',
    `"${windowsLauncherCmdPath(profile)}"`,
  ]);
}

/** Start the task now (regardless of trigger). */
export function runTask(profile: string): SchtasksResult {
  return runSchtasks(['/Run', '/TN', windowsTaskName(profile)]);
}

/**
 * End the running instance. Task stays registered for next logon.
 *
 * `schtasks /End` only terminates the process the task started directly
 * (cmd.exe running launcher.cmd); the bridge node process it spawned keeps
 * running. So read the service PID first and kill that whole tree too.
 */
export function endTask(profile: string): SchtasksResult {
  const pid = servicePid(profile);
  const ended = runSchtasks(['/End', '/TN', windowsTaskName(profile)]);
  const killed = pid !== undefined && killWindowsProcessTree(pid);
  return killed && !ended.ok ? { ...ended, ok: true } : ended;
}

/**
 * PID of the bridge process the task launched, from the PID file it writes
 * at startup. Undefined when the file is missing or that process is gone.
 */
export function servicePid(profile: string): number | undefined {
  try {
    const pid = Number.parseInt(readFileSync(windowsServicePidPath(profile), 'utf8').trim(), 10);
    return Number.isInteger(pid) && pid > 0 && isProcessAlive(pid) ? pid : undefined;
  } catch {
    return undefined;
  }
}

/** Disable autostart (task stays registered but ONLOGON trigger won't fire). */
export function disableTask(profile: string): SchtasksResult {
  return runSchtasks(['/Change', '/TN', windowsTaskName(profile), '/Disable']);
}

/** Re-enable autostart. Called from installTask is unnecessary — /Create /F
 * resets the enabled flag. Only needed if you Disabled and want it back. */
export function enableTask(profile: string): SchtasksResult {
  return runSchtasks(['/Change', '/TN', windowsTaskName(profile), '/Enable']);
}

/** End + disable. The cross-platform "stop = stay stopped" semantic. */
export function endAndDisable(profile: string): SchtasksResult {
  const ended = endTask(profile);
  // If the task wasn't running, /End fails; we still want to disable.
  const disabled = disableTask(profile);
  // Surface whichever signal is more informative — disable result wins
  // because the autostart prevention is the user-visible effect.
  return disabled.ok ? disabled : ended.ok ? disabled : ended;
}

/** Schtasks has no native restart — end, wait, run. */
export async function restartTask(profile: string): Promise<SchtasksResult> {
  endTask(profile); // best-effort; ignore if not running
  await waitUntilStopped(profile);
  return runTask(profile);
}

/**
 * `schtasks /Query` returns 0 iff the task is registered. We toss the
 * output (it's verbose); use describeTask for full state.
 */
export function isTaskRegistered(profile: string): boolean {
  const r = spawnSync('schtasks', ['/Query', '/TN', windowsTaskName(profile)], {
    stdio: ['ignore', 'ignore', 'ignore'],
    windowsHide: true,
  });
  return r.status === 0;
}

/**
 * Whether `/Query /V /FO LIST` output says the task is running. Field labels
 * and values are localized (`ステータス: 実行中` on Japanese Windows), so the
 * check keys on `267009` (0x41301, SCHED_S_TASK_RUNNING), which the
 * "Last Result" field shows while the task runs in every language. The
 * English `Status: Running` stays as a fallback.
 */
export function queryOutputSaysRunning(text: string): boolean {
  return /(^|\D)267009(\D|$)/m.test(text) || /Status:\s+Running/i.test(text);
}

export function isTaskRunning(profile: string): boolean {
  const r = runSchtasks(['/Query', '/V', '/FO', 'LIST', '/TN', windowsTaskName(profile)]);
  if (!r.ok) return false;
  return queryOutputSaysRunning(r.stdout);
}

export function describeTask(profile: string): string {
  const r = runSchtasks(['/Query', '/V', '/FO', 'LIST', '/TN', windowsTaskName(profile)]);
  return r.stdout || r.stderr || '';
}

export async function waitUntilStopped(profile: string, timeoutMs = 5000): Promise<boolean> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (!isTaskRunning(profile)) return true;
    await new Promise((r) => setTimeout(r, 200));
  }
  return false;
}

export async function deleteTask(profile: string): Promise<SchtasksResult> {
  const r = runSchtasks(['/Delete', '/F', '/TN', windowsTaskName(profile)]);
  // Remove the launcher script too; best-effort.
  if (existsSync(windowsLauncherCmdPath(profile))) {
    await rm(windowsLauncherCmdPath(profile), { force: true });
  }
  return r;
}
