import { describe, expect, it } from 'vitest';
import { decodeConsoleBytes } from '../../../src/platform/console-decode.js';

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
