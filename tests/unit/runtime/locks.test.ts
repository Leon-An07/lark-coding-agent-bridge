import { mkdir, readFile, rm, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { resolveAppPaths } from '../../../src/config/app-paths';
import { withProfileAndAppLocks } from '../../../src/runtime/locks';

const roots: string[] = [];

async function makeRoot(): Promise<string> {
  const root = await import('node:fs/promises').then((fs) =>
    fs.mkdtemp(join(tmpdir(), 'bridge-locks-')),
  );
  roots.push(root);
  return root;
}

afterEach(async () => {
  await Promise.all(roots.splice(0).map((root) => rm(root, { recursive: true, force: true })));
});

describe('runtime locks', () => {
  it('acquires profile lock before app lock and writes 0600 targets with metadata sidecars', async () => {
    const root = await makeRoot();
    const paths = resolveAppPaths({ rootDir: root, profile: 'claude' });
    await mkdir(paths.userLockDir, { recursive: true });

    const metaFiles: string[] = [];
    const order = await withProfileAndAppLocks(paths, 'cli_test', 'codex', async (acquired) => {
      expect(acquired.map((lock) => lock.kind)).toEqual(['profile', 'app']);
      for (const lock of acquired) {
        const mode = (await stat(lock.target)).mode & 0o777;
        if (process.platform !== 'win32') {
          expect(mode).toBe(0o600);
        }
        const metaFile = `${lock.target}.meta.json`;
        metaFiles.push(metaFile);
        const meta = JSON.parse(await readFile(metaFile, 'utf8')) as {
          kind: string;
          pid: number;
          profile: string;
          agentKind: string;
          appId?: string;
          startedAt: string;
        };
        expect(meta.kind).toBe(lock.kind);
        expect(meta.pid).toBe(process.pid);
        expect(meta.profile).toBe('claude');
        expect(meta.agentKind).toBe('codex');
        expect(meta.startedAt).toEqual(expect.any(String));
        if (lock.kind === 'app') expect(meta.appId).toBe('cli_test');
      }
      return acquired.map((lock) => lock.kind);
    });

    expect(order).toEqual(['profile', 'app']);
    for (const metaFile of metaFiles) {
      await expect(stat(metaFile)).rejects.toMatchObject({ code: 'ENOENT' });
    }
  });

  it('keeps lock implementation realpath-safe and out of slow business code', async () => {
    const source = await readFile(join(process.cwd(), 'src/runtime/locks.ts'), 'utf8');

    expect(source).toMatch(/realpath:\s*false/);
    expect(source).not.toMatch(/RunPolicy|AgentAdapter|startChannel|createLarkChannel/);
  });

  it('surfaces holder metadata when profile or app locks conflict', async () => {
    const root = await makeRoot();
    const first = resolveAppPaths({ rootDir: root, profile: 'claude' });
    const second = resolveAppPaths({ rootDir: root, profile: 'codex-dev' });

    await withProfileAndAppLocks(first, 'cli_test', 'claude', async () => {
      await expect(
        withProfileAndAppLocks(first, 'cli_other', 'claude', async () => {}),
      ).rejects.toMatchObject({
        kind: 'profile',
        meta: {
          profile: 'claude',
          agentKind: 'claude',
          pid: process.pid,
        },
      });

      await expect(
        withProfileAndAppLocks(second, 'cli_test', 'codex', async () => {}),
      ).rejects.toMatchObject({
        kind: 'app',
        meta: {
          profile: 'claude',
          agentKind: 'claude',
          appId: 'cli_test',
          pid: process.pid,
        },
      });
    });

    await withProfileAndAppLocks(second, 'cli_new', 'codex', async () => {
      expect(true).toBe(true);
    });
  });
});

describe('runtime locks left behind by a killed process', () => {
  async function leaveLockBehind(target: string, pid: number): Promise<void> {
    // On-disk state of a holder killed with taskkill /F or kill -9: a fresh
    // proper-lockfile dir plus our meta sidecar, never released.
    await mkdir(`${target}.lock`, { recursive: true });
    const { writeFile } = await import('node:fs/promises');
    await writeFile(target, '');
    await writeFile(
      `${target}.meta.json`,
      JSON.stringify({ kind: 'profile', target, profile: 'claude', agentKind: 'claude', pid, startedAt: new Date().toISOString() }),
    );
  }

  it('reclaims a fresh lock whose holder process is gone', async () => {
    const { spawnSync } = await import('node:child_process');
    const { acquireProfileRuntimeLock, checkRuntimeLock } = await import('../../../src/runtime/locks');
    const root = await makeRoot();
    const paths = resolveAppPaths({ rootDir: root, profile: 'claude' });
    const dead = spawnSync(process.execPath, ['-e', '']).pid as number;
    await leaveLockBehind(paths.profileLockFile, dead);

    expect((await checkRuntimeLock(paths.profileLockFile)).locked).toBe(false);
    const lock = await acquireProfileRuntimeLock(paths, 'claude');
    expect((await checkRuntimeLock(paths.profileLockFile)).meta?.pid).toBe(process.pid);
    await lock.release();
  });

  it('still refuses a lock whose holder process is alive', async () => {
    const { spawn } = await import('node:child_process');
    const { acquireProfileRuntimeLock, checkRuntimeLock, RuntimeLockConflictError } = await import(
      '../../../src/runtime/locks'
    );
    const root = await makeRoot();
    const paths = resolveAppPaths({ rootDir: root, profile: 'claude' });
    const holder = spawn(process.execPath, ['-e', 'setTimeout(() => {}, 30000)'], { stdio: 'ignore' });
    try {
      await leaveLockBehind(paths.profileLockFile, holder.pid as number);
      expect((await checkRuntimeLock(paths.profileLockFile)).locked).toBe(true);
      await expect(acquireProfileRuntimeLock(paths, 'claude')).rejects.toBeInstanceOf(RuntimeLockConflictError);
    } finally {
      holder.kill('SIGKILL');
    }
  });
});
