import { mkdtemp, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';

const roots: string[] = [];

afterEach(async () => {
  vi.resetModules();
  delete process.env.LARK_CHANNEL_LOG_MAX_MB;
  await Promise.all(roots.splice(0).map((root) => rm(root, { recursive: true, force: true })));
});

async function freshLogger(): Promise<typeof import('../../../src/core/logger.js')> {
  vi.resetModules();
  return import('../../../src/core/logger.js');
}

describe('log file size rotation', () => {
  it('rolls to a suffixed file once the size cap is exceeded', async () => {
    process.env.LARK_CHANNEL_LOG_MAX_MB = '1'; // floor of the cap: 1MB
    const dir = await mkdtemp(join(tmpdir(), 'logger-rotate-'));
    roots.push(dir);
    const { configureLogger, closeLogger, log } = await freshLogger();
    configureLogger({ logsDir: dir, retentionDays: 30, now: () => new Date('2026-07-02T10:00:00Z') });

    const filler = 'x'.repeat(1024);
    for (let i = 0; i < 1200; i++) {
      log.info('test', 'fill', { filler }); // >1KB per line → >1MB total
    }
    await closeLogger();

    const files = (await readdir(dir)).sort();
    expect(files).toContain('bridge-20260702.jsonl');
    expect(files.some((f) => /^bridge-20260702\.\d+\.jsonl$/.test(f))).toBe(true);
  });

  it('appends to the newest suffixed file after a restart', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'logger-resume-'));
    roots.push(dir);
    await writeFile(join(dir, 'bridge-20260702.jsonl'), '{"old":1}\n');
    await writeFile(join(dir, 'bridge-20260702.3.jsonl'), '{"old":3}\n');

    const { configureLogger, closeLogger, flushLogger, log, readRecentLogs } = await freshLogger();
    configureLogger({ logsDir: dir, retentionDays: 30, now: () => new Date('2026-07-02T10:00:00Z') });
    log.info('test', 'after-restart', {});
    await flushLogger();
    const recent = await readRecentLogs({ maxBytes: 64 * 1024 });
    await closeLogger();

    // The new line landed in (and is read back from) the newest suffix.
    expect(recent).toContain('"old":3');
    expect(recent).toContain('after-restart');
    expect(recent).not.toContain('"old":1');
  });

  it('gc removes expired files including suffixed ones', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'logger-gc-'));
    roots.push(dir);
    await writeFile(join(dir, 'bridge-20260101.jsonl'), '{}\n');
    await writeFile(join(dir, 'bridge-20260101.2.jsonl'), '{}\n');
    await writeFile(join(dir, 'bridge-20260702.jsonl'), '{}\n');

    const { configureLogger, closeLogger, gcOldLogs } = await freshLogger();
    configureLogger({ logsDir: dir, retentionDays: 30, now: () => new Date('2026-07-02T10:00:00Z') });
    const removed = await gcOldLogs();
    await closeLogger();

    expect(removed).toBe(2);
    const files = (await readdir(dir)).sort();
    expect(files).toEqual(['bridge-20260702.jsonl']);
  });
});
