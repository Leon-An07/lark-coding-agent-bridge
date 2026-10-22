import { describe, expect, it } from 'vitest';
import { isProcessAlive, killProcessTree, spawnProcess } from '../../../src/platform/spawn.js';

// Windows: a `.cmd` shim or `cmd /c` makes cmd.exe the direct child, so the
// real agent is a grandchild. killProcessTree must end it too (#274).
describe.skipIf(process.platform !== 'win32')('killProcessTree on Windows', () => {
  it('ends the grandchild behind cmd.exe', async () => {
    const child = spawnProcess('cmd.exe', ['/d', '/c', `"${process.execPath}" -e "console.log(process.pid); setTimeout(() => {}, 60000)"`], {
      stdio: ['ignore', 'pipe', 'ignore'],
    });
    const grandchild = await new Promise<number>((resolve) => {
      child.stdout!.once('data', (b: Buffer) => resolve(Number(b.toString().trim())));
    });
    expect(isProcessAlive(grandchild)).toBe(true);
    killProcessTree(child, 'SIGTERM');
    await new Promise((r) => setTimeout(r, 1000));
    expect(isProcessAlive(grandchild)).toBe(false);
  });
});
