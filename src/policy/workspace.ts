import { realpath, stat } from 'node:fs/promises';
import { homedir, tmpdir } from 'node:os';
import { basename, dirname, resolve } from 'node:path';
import { msgs } from '../i18n';

export type WorkingDirectoryRejectReason =
  | 'empty-requested-cwd'
  | 'path-inaccessible'
  | 'not-directory'
  | 'filesystem-root'
  | 'home-root'
  | 'user-root'
  | 'system-root'
  | 'temp-root'
  | 'broad-user-folder'
  | 'volume-root';

export type WorkingDirectoryResolveResult =
  | { ok: true; requestedCwd: string; cwdRealpath: string }
  | {
      ok: false;
      reason: WorkingDirectoryRejectReason;
      requestedCwd: string;
      userVisible: string;
    };

export async function resolveWorkingDirectory(
  requestedCwd: string,
): Promise<WorkingDirectoryResolveResult> {
  const trimmed = requestedCwd.trim();
  if (!trimmed) {
    return reject('empty-requested-cwd', requestedCwd, msgs().policy.emptyRequestedCwd);
  }

  let resolved: string;
  try {
    resolved = await realpath(trimmed);
  } catch {
    return reject('path-inaccessible', requestedCwd, msgs().policy.pathInaccessible(requestedCwd));
  }

  const info = await stat(resolved).catch(() => undefined);
  if (!info?.isDirectory()) {
    return reject('not-directory', requestedCwd, msgs().policy.notDirectory(resolved));
  }

  const tempRealpath = await realpath(tmpdir()).catch(() => resolve(tmpdir()));
  const homeRealpath = await realpath(homedir()).catch(() => resolve(homedir()));
  const broad = classifyHighRiskWorkingDirectory(resolved, requestedCwd, tempRealpath, homeRealpath);
  if (broad) return broad;

  return {
    ok: true,
    requestedCwd,
    cwdRealpath: resolved,
  };
}

function reject(
  reason: WorkingDirectoryRejectReason,
  requestedCwd: string,
  userVisible: string,
): WorkingDirectoryResolveResult {
  return { ok: false, reason, requestedCwd, userVisible };
}

function classifyHighRiskWorkingDirectory(
  real: string,
  requestedCwd: string,
  tempRealpath: string,
  homeRealpath: string,
): WorkingDirectoryResolveResult | undefined {
  const m = msgs().policy;
  if (real === dirname(real)) {
    return reject('filesystem-root', requestedCwd, m.filesystemRoot);
  }

  const home = homeRealpath;
  if (real === home) {
    return reject('home-root', requestedCwd, m.homeRoot);
  }
  if (real === dirname(home)) {
    return reject('user-root', requestedCwd, m.userRoot);
  }

  if (dirname(real) === home && new Set(['Desktop', 'Downloads']).has(basename(real))) {
    return reject('broad-user-folder', requestedCwd, m.broadUserFolder);
  }

  const temp = resolve(tmpdir());
  if (real === temp || real === tempRealpath || real === '/tmp' || real === '/private/tmp') {
    return reject('temp-root', requestedCwd, m.tempRoot);
  }

  const systemRoots = new Set([
    '/Applications',
    '/bin',
    '/etc',
    '/Library',
    '/private',
    '/sbin',
    '/System',
    '/usr',
    '/var',
  ]);
  if (systemRoots.has(real)) {
    return reject('system-root', requestedCwd, m.systemRoot);
  }

  if (real === '/Volumes' || dirname(real) === '/Volumes') {
    return reject('volume-root', requestedCwd, m.volumeRoot);
  }

  return undefined;
}
