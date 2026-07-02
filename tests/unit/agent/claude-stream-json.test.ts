import { chmod, mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { ClaudeAdapter } from '../../../src/agent/claude/adapter.js';
import { translateEvent } from '../../../src/agent/claude/stream-json.js';
import type { AgentEvent } from '../../../src/agent/types.js';

describe('Claude stream-json translator', () => {
  it('translates system init metadata', () => {
    expect([
      ...translateEvent({
        type: 'system',
        subtype: 'init',
        session_id: 'sess-1',
        cwd: '/repo',
        model: 'sonnet',
      }),
    ]).toEqual([
      { type: 'system', sessionId: 'sess-1', cwd: '/repo', model: 'sonnet' },
    ]);
    expect([...translateEvent({ type: 'system', subtype: 'init', session_id: 'sess-1' })][0]).not.toHaveProperty('threadId');
  });

  it('translates assistant text, thinking, and tool_use blocks in order', () => {
    expect([
      ...translateEvent({
        type: 'assistant',
        message: {
          content: [
            { type: 'text', text: 'hello' },
            { type: 'thinking', thinking: 'checking' },
            { type: 'tool_use', id: 'tool-1', name: 'Bash', input: { command: 'pwd' } },
          ],
        },
      }),
    ]).toEqual([
      { type: 'text', delta: 'hello' },
      { type: 'thinking', delta: 'checking' },
      { type: 'tool_use', id: 'tool-1', name: 'Bash', input: { command: 'pwd' } },
    ]);
  });

  it('translates user tool_result blocks including structured output and errors', () => {
    expect([
      ...translateEvent({
        type: 'user',
        message: {
          content: [
            { type: 'tool_result', tool_use_id: 'tool-1', content: 'ok' },
            {
              type: 'tool_result',
              tool_use_id: 'tool-2',
              content: [{ type: 'text', text: 'bad' }],
              is_error: true,
            },
          ],
        },
      }),
    ]).toEqual([
      { type: 'tool_result', id: 'tool-1', output: 'ok', isError: false },
      {
        type: 'tool_result',
        id: 'tool-2',
        output: JSON.stringify([{ type: 'text', text: 'bad' }]),
        isError: true,
      },
    ]);
  });

  it('translates result usage before done', () => {
    expect([
      ...translateEvent({
        type: 'result',
        session_id: 'sess-2',
        usage: { input_tokens: 12, output_tokens: 34, cache_read_input_tokens: 5 },
        total_cost_usd: 0.1234,
      }),
    ]).toEqual([
      { type: 'usage', inputTokens: 12, outputTokens: 34, cachedInputTokens: 5, costUsd: 0.1234 },
      { type: 'done', sessionId: 'sess-2', terminationReason: 'normal' },
    ]);
    expect([...translateEvent({ type: 'result', session_id: 'sess-2' })][0]).not.toHaveProperty('threadId');
  });

  it('translates an is_error result into an error event, not done/normal', () => {
    // claude exits 0 even on failed runs (e.g. --resume with a dead session
    // id); the result event's is_error flag is the only failure signal.
    expect([
      ...translateEvent({
        type: 'result',
        subtype: 'error_during_execution',
        session_id: 'sess-dead',
        is_error: true,
        errors: ['No conversation found with session ID: sess-dead'],
        usage: { input_tokens: 0, output_tokens: 0 },
      }),
    ]).toEqual([
      { type: 'usage', inputTokens: 0, outputTokens: 0, cachedInputTokens: undefined, costUsd: undefined },
      {
        type: 'error',
        message: 'No conversation found with session ID: sess-dead',
        terminationReason: 'failed',
      },
    ]);
    // No errors array → falls back to the subtype.
    expect([
      ...translateEvent({ type: 'result', subtype: 'error_max_turns', is_error: true }),
    ]).toEqual([
      { type: 'error', message: 'claude run failed (error_max_turns)', terminationReason: 'failed' },
    ]);
  });

  it('ignores unknown, empty, and incomplete raw events', () => {
    expect([...translateEvent(null)]).toEqual([]);
    expect([...translateEvent({ type: 'assistant', message: { content: [{ type: 'text', text: '' }] } })]).toEqual([]);
    expect([...translateEvent({ type: 'assistant', message: { content: [{ type: 'tool_use', id: 't' }] } })]).toEqual([]);
    expect([...translateEvent({ type: 'system', subtype: 'other' })]).toEqual([]);
  });
});

describe('Claude stream-json reader behavior', () => {
  let cleanup: (() => Promise<void>) | undefined;

  afterEach(async () => {
    await cleanup?.();
    cleanup = undefined;
  });

  it('skips non-JSON stdout lines and reports non-zero stderr detail without redacting visible paths', async () => {
    const stderr = 'fatal stderr at /Users/example/work/repo/file.ts';
    const binary = await createFakeBinary([
      'not json',
      JSON.stringify({ type: 'assistant', message: { content: [{ type: 'text', text: 'kept' }] } }),
    ], 7, stderr);
    cleanup = binary.cleanup;

    const run = new ClaudeAdapter({ binary: binary.path }).run({
      runId: 'run-reader',
      prompt: 'hi',
      cwd: tmpdir(),
    });
    const events = await collect(run.events);

    expect(events).toEqual([
      { type: 'text', delta: 'kept' },
      {
        type: 'error',
        message: `claude exited with code 7: ${stderr}`,
        terminationReason: 'failed',
      },
    ]);
  });
});

async function collect(events: AsyncIterable<AgentEvent>): Promise<AgentEvent[]> {
  const out: AgentEvent[] = [];
  for await (const event of events) out.push(event);
  return out;
}

async function createFakeBinary(lines: string[], exitCode: number, stderr: string): Promise<{
  path: string;
  cleanup(): Promise<void>;
}> {
  const dir = await mkdtemp(join(tmpdir(), 'claude-stream-json-test-'));
  const path = join(dir, 'fake-claude.mjs');
  await writeFile(
    path,
    [
      '#!/usr/bin/env node',
      `const lines = ${JSON.stringify(lines)};`,
      'for (const line of lines) console.log(line);',
      `process.stderr.write(${JSON.stringify(stderr)});`,
      `process.exit(${exitCode});`,
    ].join('\n'),
    'utf8',
  );
  await chmod(path, 0o755);
  return {
    path,
    cleanup: async () => {
      const { rm } = await import('node:fs/promises');
      await rm(dir, { recursive: true, force: true });
    },
  };
}
