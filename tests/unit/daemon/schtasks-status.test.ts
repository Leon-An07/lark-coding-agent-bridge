import { describe, expect, it } from 'vitest';
import { queryOutputSaysRunning } from '../../../src/daemon/schtasks.js';

// Synthesized from the field layout of `schtasks /Query /V /FO LIST`. The
// localized labels are not verified against a real Japanese install; the
// check must not depend on them, only on the numeric Last Result value.
const jaRunning = [
  'ホスト名:                             DESKTOP-1',
  'タスク名:                             \\LarkChannelBridge.Bot.claude',
  'ステータス:                           実行中',
  'ログオン モード:                      対話型のみ',
  '前回の結果:                           267009',
].join('\r\n');

const jaReady = jaRunning.replace('実行中', '準備完了').replace('267009', '0');
const zhRunning = '模式:   正在运行\r\n上次结果:   267009\r\n';
const enRunning = 'Status:                               Running\r\nLast Result:                          267009\r\n';
const enReady = 'Status:                               Ready\r\nLast Result:                          0\r\n';

describe('queryOutputSaysRunning', () => {
  it('detects a running task from localized output', () => {
    expect(queryOutputSaysRunning(jaRunning)).toBe(true);
    expect(queryOutputSaysRunning(zhRunning)).toBe(true);
    expect(queryOutputSaysRunning(enRunning)).toBe(true);
  });

  it('reports a stopped task as not running', () => {
    expect(queryOutputSaysRunning(jaReady)).toBe(false);
    expect(queryOutputSaysRunning(enReady)).toBe(false);
  });

  it('does not match 267009 inside a longer number', () => {
    expect(queryOutputSaysRunning('前回の結果: 2670091\r\n')).toBe(false);
  });
});
