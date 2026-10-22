import { spawnSync } from 'node:child_process';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { ensureSecretsGetterWrapper } from '../../../src/config/store.js';
import { buildLauncherCmd } from '../../../src/daemon/schtasks.js';
import { batchValue, isAscii, renderBatchFile } from '../../../src/platform/windows-batch.js';

const JP_HOME = 'C:\\Users\\田中';
const JP_ENV = {
  USERPROFILE: JP_HOME,
  APPDATA: `${JP_HOME}\\AppData\\Roaming`,
  LOCALAPPDATA: `${JP_HOME}\\AppData\\Local`,
  ProgramFiles: 'C:\\Program Files',
};

describe('batch values for a Japanese user profile', () => {
  it('rewrites paths under the profile as env references so the body is ASCII', () => {
    expect(batchValue(`${JP_HOME}\\.lark-channel`, JP_ENV)).toBe('%USERPROFILE%\\.lark-channel');
    expect(batchValue(`${JP_HOME}\\AppData\\Roaming\\npm\\node_modules\\x.mjs`, JP_ENV)).toBe(
      '%APPDATA%\\npm\\node_modules\\x.mjs',
    );
  });

  it('matches the root case-insensitively and only on a path boundary', () => {
    expect(batchValue('c:\\users\\田中\\bin', JP_ENV)).toBe('%USERPROFILE%\\bin');
    expect(batchValue('C:\\Users\\田中太郎\\bin', JP_ENV)).toBe('C:\\Users\\田中太郎\\bin');
  });

  it('rewrites each PATH entry and escapes literal percent signs', () => {
    const path = `C:\\Windows;${JP_HOME}\\AppData\\Roaming\\npm;C:\\100%\\bin`;
    expect(batchValue(path, JP_ENV)).toBe('C:\\Windows;%APPDATA%\\npm;C:\\100%%\\bin');
  });

  it('adds chcp 65001 only when allowed and non-ASCII remains', () => {
    expect(renderBatchFile(['@echo off', 'echo D:\\データ'], { allowChcp: true })).toBe(
      '@echo off\r\nchcp 65001>nul\r\necho D:\\データ\r\n',
    );
    expect(renderBatchFile(['@echo off', 'echo ok'], { allowChcp: true })).toBe('@echo off\r\necho ok\r\n');
  });
});

describe('generated .cmd files for C:\\Users\\田中', () => {
  const cleanups: Array<() => Promise<void>> = [];
  afterEach(async () => {
    await Promise.all(cleanups.splice(0).map((c) => c()));
  });

  it('writes an ASCII-only secrets getter with no chcp', async () => {
    const root = await tempDir();
    const script = join(root, 'secrets-getter');
    const out = await ensureSecretsGetterWrapper(
      { rootDir: `${JP_HOME}\\.lark-channel`, secretsGetterScript: script },
      {
        platform: 'win32',
        nodePath: 'C:\\Program Files\\nodejs\\node.exe',
        bridgeEntry: `${JP_HOME}\\AppData\\Roaming\\npm\\node_modules\\lark-channel-bridge\\bin\\lark-channel-bridge.mjs`,
        batchEnv: JP_ENV,
      },
    );
    const content = await readFile(out, 'utf8');
    expect(isAscii(content)).toBe(true);
    expect(content).not.toContain('chcp');
    expect(content).toContain('set "LARK_CHANNEL_HOME=%USERPROFILE%\\.lark-channel"');
    expect(content).toContain(
      '"%ProgramFiles%\\nodejs\\node.exe" "%APPDATA%\\npm\\node_modules\\lark-channel-bridge\\bin\\lark-channel-bridge.mjs" secrets get %*',
    );
  });

  it('writes an ASCII-only launcher that hands over a PID file path', () => {
    const content = buildLauncherCmd({
      nodePath: `${JP_HOME}\\AppData\\Local\\nvm\\node.exe`,
      bridgeEntryPath: `${JP_HOME}\\AppData\\Roaming\\npm\\bridge.mjs`,
      envPath: `C:\\Windows;${JP_HOME}\\AppData\\Roaming\\npm`,
      profile: 'claude',
      runArgs: ['run', '--profile', 'claude'],
      channelHome: `${JP_HOME}\\.lark-channel`,
      batchEnv: JP_ENV,
    });
    expect(content).toContain('set "LARK_CHANNEL_HOME=%USERPROFILE%\\.lark-channel"');
    expect(content).toContain('set "PATH=C:\\Windows;%APPDATA%\\npm"');
    expect(content).toContain('"%LOCALAPPDATA%\\nvm\\node.exe" "%APPDATA%\\npm\\bridge.mjs" run --profile claude');
    expect(content).toMatch(/set "LARK_CHANNEL_SERVICE_PID_FILE=.*service\.pid"/);
  });

  // Real cmd.exe check. The runner's OEM codepage is 437, so a raw UTF-8
  // non-ASCII path in the batch body breaks there just as it does on CP932.
  it.skipIf(process.platform !== 'win32')('runs under cmd.exe from a Japanese-named directory', async () => {
    const base = await tempDir();
    const jpHome = join(base, '田中');
    const outside = join(base, 'データ');
    await mkdir(jpHome, { recursive: true });
    await mkdir(outside, { recursive: true });
    const echo = join(jpHome, 'echo.mjs');
    await writeFile(
      echo,
      "process.stdout.write(JSON.stringify({ home: process.env.LARK_CHANNEL_HOME, args: process.argv.slice(2) }));\n",
    );

    const script = join(jpHome, 'secrets-getter');
    const wrapper = await ensureSecretsGetterWrapper(
      { rootDir: join(jpHome, '.lark-channel'), secretsGetterScript: script },
      { platform: 'win32', nodePath: process.execPath, bridgeEntry: echo, batchEnv: { USERPROFILE: jpHome } },
    );
    const r = spawnSync('cmd.exe', ['/d', '/c', wrapper, 'app_x'], {
      env: { ...process.env, USERPROFILE: jpHome },
    });
    expect(r.status).toBe(0);
    expect(JSON.parse(r.stdout.toString('utf8'))).toEqual({
      home: join(jpHome, '.lark-channel'),
      args: ['secrets', 'get', 'app_x'],
    });

    // A path outside the known roots relies on the chcp fallback.
    const echoOutside = join(outside, 'echo.mjs');
    await writeFile(echoOutside, 'process.stdout.write(process.argv[1]);\n');
    const launcher = join(outside, 'launcher.cmd');
    await writeFile(
      launcher,
      renderBatchFile(['@echo off', `"${process.execPath}" "${echoOutside}"`], { allowChcp: true }),
      'utf8',
    );
    const r2 = spawnSync('cmd.exe', ['/d', '/c', launcher]);
    expect(r2.status).toBe(0);
    expect(r2.stdout.toString('utf8')).toBe(echoOutside);
  });

  async function tempDir(): Promise<string> {
    const dir = await mkdtemp(join(tmpdir(), 'win-batch-'));
    cleanups.push(() => rm(dir, { recursive: true, force: true, maxRetries: 5, retryDelay: 25 }));
    return dir;
  }
});
