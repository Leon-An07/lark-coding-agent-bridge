import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { isProcessAlive, killProcessTree, spawnProcess } from '../../../src/platform/spawn.js';

// Windows: a `.cmd` shim (how npm installs claude/codex) makes cmd.exe the
// direct child, so the real agent is a grandchild. killProcessTree must end
// it too (#274).
describe.skipIf(process.platform !== 'win32')('killProcessTree on Windows', () => {
  it('ends the node grandchild behind a .cmd shim', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'kill-tree-'));
    try {
      const script = join(dir, 'agent.mjs');
      await writeFile(script, 'console.log(process.pid);\nsetTimeout(() => {}, 60000);\n');
      const shim = join(dir, 'agent.cmd');
      await writeFile(shim, `@echo off\r\n"${process.execPath}" "${script}"\r\n`);
      const child = spawnProcess(shim, [], { stdio: ['ignore', 'pipe', 'ignore'] });
      const grandchild = await new Promise<number>((resolve) => {
        child.stdout!.once('data', (b: Buffer) => resolve(Number(b.toString().trim())));
      });
      expect(isProcessAlive(grandchild)).toBe(true);
      killProcessTree(child, 'SIGTERM');
      await new Promise((r) => setTimeout(r, 1000));
      expect(isProcessAlive(grandchild)).toBe(false);
    } finally {
      await rm(dir, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
    }
  });
});
