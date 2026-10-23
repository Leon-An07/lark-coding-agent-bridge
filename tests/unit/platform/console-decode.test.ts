import { describe, expect, it } from 'vitest';
import {
  ChildLineDecoder,
  decodeConsoleBytes,
  isWindowsCommandNotFoundLine,
} from '../../../src/platform/console-decode.js';
import { compactQrIsSafe } from '../../../src/bot/wizard.js';

// Byte fixtures produced outside the code under test:
//   python3 -c "print('実行中'.encode('cp932').hex())"
const CP932_RUNNING = Buffer.from('8ec08d739286', 'hex'); // 実行中
const CP932_ACCESS_DENIED = Buffer.from('8341834e835a835882aa8b9194db82b382ea82dc82b582bd8142', 'hex'); // アクセスが拒否されました。
const GBK_RUNNING = Buffer.from('d5fdd4dad4cbd0d0', 'hex'); // 正在运行

describe('decodeConsoleBytes', () => {
  it('decodes CP932 output from Japanese Windows console tools', () => {
    expect(decodeConsoleBytes(CP932_ACCESS_DENIED, 932)).toBe('アクセスが拒否されました。');
  });

  it('decodes GBK output from Chinese Windows console tools', () => {
    expect(decodeConsoleBytes(GBK_RUNNING, 936)).toBe('正在运行');
  });

  it('keeps UTF-8 lines as UTF-8 when the OEM codepage is CP932', () => {
    const bytes = Buffer.from('npm ERR! 権限がありません\n', 'utf8');
    expect(decodeConsoleBytes(bytes, 932)).toBe('npm ERR! 権限がありません\n');
  });

  it('decodes a stream that mixes UTF-8 lines and CP932 lines', () => {
    const bytes = Buffer.concat([
      Buffer.from('node: 日本語\r\n', 'utf8'),
      Buffer.from('status: ', 'ascii'),
      CP932_RUNNING,
      Buffer.from('\r\n', 'ascii'),
    ]);
    expect(decodeConsoleBytes(bytes, 932)).toBe('node: 日本語\r\nstatus: 実行中\r\n');
  });

  it('falls back to UTF-8 when the codepage is unknown or absent', () => {
    expect(decodeConsoleBytes(Buffer.from('ok ✓', 'utf8'), undefined)).toBe('ok ✓');
    expect(decodeConsoleBytes(Buffer.from('ok', 'utf8'), 437)).toBe('ok');
  });
});

// cmd.exe on Japanese Windows when `claude` is not on PATH (CP932, two lines):
//   'claude' は、内部コマンドまたは外部コマンド、
//   操作可能なプログラムまたはバッチ ファイルとして認識されていません。
const CP932_NOT_FOUND = Buffer.from(
  '27636c61756465272082cd814193e095948352837d8393836882dc82bd82cd8a4f95948352837d8393836881410d0a' +
    '91808dec89c2945c82c88376838d834f8389838082dc82bd82cd836f8362836020837483408343838b82c682b582c494468eaf82b382ea82c482a282dc82b982f181420d0a',
  'hex',
);

describe('ChildLineDecoder', () => {
  it('decodes CP932 lines even when a chunk splits a character', () => {
    const decoder = new ChildLineDecoder(932);
    const cut = 10; // between the two bytes of 'は' (82 | cd)
    const lines = [...decoder.push(CP932_NOT_FOUND.subarray(0, cut)), ...decoder.push(CP932_NOT_FOUND.subarray(cut))];
    expect(lines).toEqual([
      "'claude' は、内部コマンドまたは外部コマンド、",
      '操作可能なプログラムまたはバッチ ファイルとして認識されていません。',
    ]);
  });

  it('holds back an unfinished line until its newline arrives', () => {
    const decoder = new ChildLineDecoder(932);
    expect(decoder.push(Buffer.from('partial', 'utf8'))).toEqual([]);
    expect(decoder.push(Buffer.from(' line\n', 'utf8'))).toEqual(['partial line']);
  });
});

describe('isWindowsCommandNotFoundLine', () => {
  it('matches the English, Japanese and Chinese cmd.exe texts on win32 only', () => {
    expect(isWindowsCommandNotFoundLine("'claude' is not recognized as an internal or external command,", 'win32')).toBe(true);
    expect(isWindowsCommandNotFoundLine("'claude' は、内部コマンドまたは外部コマンド、", 'win32')).toBe(true);
    expect(isWindowsCommandNotFoundLine("'claude' 不是内部或外部命令，也不是可运行的程序", 'win32')).toBe(true);
    expect(isWindowsCommandNotFoundLine("'claude' は、内部コマンドまたは外部コマンド、", 'darwin')).toBe(false);
    expect(isWindowsCommandNotFoundLine('ordinary stderr line', 'win32')).toBe(false);
  });
});

describe('compactQrIsSafe', () => {
  it('avoids half-block QR on the legacy console of CJK Windows', () => {
    expect(compactQrIsSafe('win32', {}, 932)).toBe(false);
    expect(compactQrIsSafe('win32', {}, 936)).toBe(false);
  });

  it('keeps the compact QR on Windows Terminal, non-CJK Windows and other OSes', () => {
    expect(compactQrIsSafe('win32', { WT_SESSION: 'x' }, 932)).toBe(true);
    expect(compactQrIsSafe('win32', {}, 437)).toBe(true);
    expect(compactQrIsSafe('darwin', {}, undefined)).toBe(true);
  });
});
