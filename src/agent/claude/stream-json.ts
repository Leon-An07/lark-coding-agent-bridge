import type { AgentEvent } from '../types';

interface ContentBlock {
  type: string;
  text?: string;
  thinking?: string;
  id?: string;
  name?: string;
  input?: unknown;
  tool_use_id?: string;
  content?: unknown;
  is_error?: boolean;
}

interface RawUsage {
  input_tokens?: number;
  output_tokens?: number;
  cache_read_input_tokens?: number;
  cache_creation_input_tokens?: number;
}

interface ClaudeRawEvent {
  type?: string;
  subtype?: string;
  session_id?: string;
  cwd?: string;
  model?: string;
  message?: { content?: ContentBlock[]; usage?: RawUsage };
  usage?: RawUsage;
  total_cost_usd?: number;
  is_error?: boolean;
  errors?: unknown[];
}

export function* translateEvent(raw: unknown): Generator<AgentEvent> {
  if (!raw || typeof raw !== 'object') return;
  const evt = raw as ClaudeRawEvent;

  if (evt.type === 'system' && evt.subtype === 'init') {
    yield {
      type: 'system',
      sessionId: evt.session_id,
      cwd: evt.cwd,
      model: evt.model,
    };
    return;
  }

  if (evt.type === 'assistant' && evt.message?.content) {
    // Per-turn usage: input + cache_read + cache_creation of one API call ≈
    // the session's current context size (unlike the cumulative totals on
    // the final `result` event). Feeds the context-window notice.
    const turnUsage = evt.message.usage;
    if (turnUsage) {
      const contextTokens =
        (turnUsage.input_tokens ?? 0) +
        (turnUsage.cache_read_input_tokens ?? 0) +
        (turnUsage.cache_creation_input_tokens ?? 0);
      if (contextTokens > 0) {
        yield { type: 'usage', contextTokens };
      }
    }
    for (const block of evt.message.content) {
      if (block.type === 'text' && typeof block.text === 'string' && block.text) {
        yield { type: 'text', delta: block.text };
      } else if (block.type === 'thinking' && typeof block.thinking === 'string' && block.thinking) {
        yield { type: 'thinking', delta: block.thinking };
      } else if (block.type === 'tool_use' && block.id && block.name) {
        yield { type: 'tool_use', id: block.id, name: block.name, input: block.input };
      }
    }
    return;
  }

  if (evt.type === 'user' && evt.message?.content) {
    for (const block of evt.message.content) {
      if (block.type === 'tool_result' && block.tool_use_id) {
        const output =
          typeof block.content === 'string' ? block.content : JSON.stringify(block.content);
        yield {
          type: 'tool_result',
          id: block.tool_use_id,
          output,
          isError: block.is_error === true,
        };
      }
    }
    return;
  }

  if (evt.type === 'result') {
    if (evt.usage) {
      yield {
        type: 'usage',
        inputTokens: evt.usage.input_tokens,
        outputTokens: evt.usage.output_tokens,
        cachedInputTokens: evt.usage.cache_read_input_tokens,
        costUsd: evt.total_cost_usd,
      };
    }
    // claude exits 0 even when the run failed (e.g. `--resume` with a dead
    // session id → subtype "error_during_execution"); the only failure signal
    // is is_error on the result event. Mapping that to done/normal would
    // swallow the error and leave the user with a silent empty reply.
    if (evt.is_error === true) {
      const errs = Array.isArray(evt.errors)
        ? evt.errors.filter((e): e is string => typeof e === 'string')
        : [];
      yield {
        type: 'error',
        message: errs.join('; ') || `claude run failed (${evt.subtype ?? 'unknown'})`,
        terminationReason: 'failed',
      };
      return;
    }
    yield { type: 'done', sessionId: evt.session_id, terminationReason: 'normal' };
  }
}
