import { spawnSync } from 'node:child_process';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { buildTaskXml } from '../../../src/daemon/schtasks.js';

describe('buildTaskXml', () => {
  const xml = buildTaskXml({ userId: 'DESKTOP-1\\田中', command: 'C:\\Users\\田中\\.lark-channel\\daemon\\claude\\launcher.cmd' });

  it('triggers only at this user\'s logon and runs unelevated as that user', () => {
    expect(xml).toContain('<LogonTrigger><Enabled>true</Enabled><UserId>DESKTOP-1\\田中</UserId></LogonTrigger>');
    expect(xml).toContain('<LogonType>InteractiveToken</LogonType><RunLevel>LeastPrivilege</RunLevel>');
  });

  it('keeps a daemon running: no time limit, runs on battery', () => {
    expect(xml).toContain('<ExecutionTimeLimit>PT0S</ExecutionTimeLimit>');
    expect(xml).toContain('<DisallowStartIfOnBatteries>false</DisallowStartIfOnBatteries>');
    expect(xml).toContain('<StopIfGoingOnBatteries>false</StopIfGoingOnBatteries>');
  });

  it('escapes XML metacharacters in paths', () => {
    expect(buildTaskXml({ userId: 'u', command: 'C:\\A&B\\x.cmd' })).toContain('<Command>C:\\A&amp;B\\x.cmd</Command>');
  });

  it.skipIf(process.platform !== 'win32')('is accepted by schtasks /Create /XML', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'schtasks-xml-'));
    const name = `LarkChannelBridge.Test.${process.pid}`;
    try {
      const cmd = join(dir, 'noop.cmd');
      await writeFile(cmd, '@echo off\r\n');
      const user = process.env.USERDOMAIN ? `${process.env.USERDOMAIN}\\${process.env.USERNAME}` : process.env.USERNAME!;
      const file = join(dir, 'task.xml');
      const body = buildTaskXml({ userId: user, command: cmd });
      await writeFile(file, Buffer.concat([Buffer.from([0xff, 0xfe]), Buffer.from(body, 'utf16le')]));
      const created = spawnSync('schtasks', ['/Create', '/F', '/TN', name, '/XML', file]);
      expect(created.status, created.stderr.toString('latin1')).toBe(0);
      expect(spawnSync('schtasks', ['/Query', '/TN', name]).status).toBe(0);
    } finally {
      spawnSync('schtasks', ['/Delete', '/F', '/TN', name]);
      await rm(dir, { recursive: true, force: true });
    }
  });
});
