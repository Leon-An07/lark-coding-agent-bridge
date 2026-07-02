import { EventEmitter } from 'node:events';
import { PassThrough } from 'node:stream';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const spawnMock = vi.hoisted(() => ({
  spawnProcess: vi.fn(),
}));

vi.mock('../../../src/platform/spawn', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../src/platform/spawn')>();
  return { ...actual, spawnProcess: spawnMock.spawnProcess };
});

import {
  buildBridgeSystemPrompt,
  prefixBridgeContractPrompt,
  prefixBridgeSystemPrompt,
} from '../../../src/agent/bridge-system-prompt';
import { ClaudeAdapter } from '../../../src/agent/claude/adapter';
import { CodexAdapter } from '../../../src/agent/codex/adapter';

interface FakeChild extends EventEmitter {
  pid: number;
  stdin: PassThrough;
  stdout: PassThrough;
  stderr: PassThrough;
  exitCode: number | null;
  signalCode: NodeJS.Signals | null;
  kill: ReturnType<typeof vi.fn>;
}

function fakeChild(): FakeChild {
  const child = new EventEmitter() as FakeChild;
  child.pid = 4242;
  child.stdin = new PassThrough();
  child.stdout = new PassThrough();
  child.stderr = new PassThrough();
  child.exitCode = 0;
  child.signalCode = null;
  child.kill = vi.fn();
  return child;
}

beforeEach(() => {
  spawnMock.spawnProcess.mockReset();
});

describe('ClaudeAdapter system prompt wiring', () => {
  it('persists the identity-aware bridge contract in the first user prompt and appends system prompt', () => {
    spawnMock.spawnProcess.mockReturnValue(fakeChild());
    const adapter = new ClaudeAdapter();
    adapter.setBotIdentity({ openId: 'ou_bot_self', name: 'Bridge' });

    adapter.run({ runId: 'r1', prompt: 'hi', cwd: '/tmp' });

    const args = spawnMock.spawnProcess.mock.calls[0]?.[1] as string[];
    expect(args[0]).toBe('-p');
    expect(args[1]).toBe(
      prefixBridgeContractPrompt('hi', { openId: 'ou_bot_self', name: 'Bridge' }),
    );
    const flagIndex = args.indexOf('--append-system-prompt');
    expect(flagIndex).toBeGreaterThan(-1);
    expect(args[flagIndex + 1]).toBe(
      buildBridgeSystemPrompt({ openId: 'ou_bot_self', name: 'Bridge' }),
    );
    expect(args).not.toContain('--bare');
  });

  it('falls back to the base system prompt when no identity was set', () => {
    spawnMock.spawnProcess.mockReturnValue(fakeChild());
    const adapter = new ClaudeAdapter();

    adapter.run({ runId: 'r1', prompt: 'hi', cwd: '/tmp' });

    const args = spawnMock.spawnProcess.mock.calls[0]?.[1] as string[];
    expect(args[1]).toBe(prefixBridgeContractPrompt('hi', undefined));
    const flagIndex = args.indexOf('--append-system-prompt');
    expect(args[flagIndex + 1]).toBe(buildBridgeSystemPrompt(undefined));
  });

  it('resumes with the compact prompt and without repeated bridge prompt (no --bare: OAuth-incompatible)', () => {
    spawnMock.spawnProcess.mockReturnValue(fakeChild());
    const adapter = new ClaudeAdapter();
    adapter.setBotIdentity({ openId: 'ou_bot_self', name: 'Bridge' });

    adapter.run({ runId: 'r1', prompt: 'hi', cwd: '/tmp', sessionId: 'sess-1' });

    const args = spawnMock.spawnProcess.mock.calls[0]?.[1] as string[];
    expect(args).toEqual([
      '-p',
      'hi',
      '--output-format',
      'stream-json',
      '--verbose',
      '--permission-mode',
      'bypassPermissions',
      '--resume',
      'sess-1',
    ]);
    expect(args).not.toContain('--append-system-prompt');
    expect(args.join('\n')).not.toContain('<bridge_contract>');
  });
});

describe('CodexAdapter system prompt wiring', () => {
  function codexAdapter(): CodexAdapter {
    return new CodexAdapter({
      binary: '/usr/local/bin/codex',
      profileStateDir: '/tmp/codex-profile',
    });
  }

  it('prefixes stdin with the identity-aware bridge system prompt after setBotIdentity', async () => {
    const child = fakeChild();
    spawnMock.spawnProcess.mockReturnValue(child);
    const adapter = codexAdapter();
    adapter.setBotIdentity({ openId: 'ou_bot_self', name: 'Bridge' });

    adapter.run({ runId: 'r1', prompt: 'hi', cwd: '/tmp' });

    const stdin = await readAll(child.stdin);
    expect(stdin).toBe(
      prefixBridgeSystemPrompt('hi', { openId: 'ou_bot_self', name: 'Bridge' }),
    );
  });

  it('falls back to the base system prompt when no identity was set', async () => {
    const child = fakeChild();
    spawnMock.spawnProcess.mockReturnValue(child);
    const adapter = codexAdapter();

    adapter.run({ runId: 'r1', prompt: 'hi', cwd: '/tmp' });

    const stdin = await readAll(child.stdin);
    expect(stdin).toBe(prefixBridgeSystemPrompt('hi', undefined));
  });
});

async function readAll(stream: PassThrough): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    chunks.push(chunk as Buffer);
  }
  return Buffer.concat(chunks).toString('utf8');
}
