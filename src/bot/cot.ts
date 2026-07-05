import type { AgentEvent } from '../agent/types';
import type { CotMessagesMode } from '../config/schema';
import { log } from '../core/logger';
import { toolHeaderText } from '../card/tool-render';
import type { RunState } from '../card/run-state';

const COT_UPDATE_THROTTLE_MS = 600;
const COT_TOOL_OUTPUT_MAX = 1200;
const COT_TEXT_MAX = 1200;

/** Minimal authed-request surface from the channel SDK's lark Client. The SDK
 * already manages the tenant_access_token + domain and throws on non-zero Feishu
 * codes, so COT reuses it instead of minting its own token. */
export interface CotRequester {
  request(payload: { method: string; url: string; data?: unknown }): Promise<Record<string, unknown>>;
}

export class CotClient {
  constructor(private readonly raw: CotRequester) {}

  async create(receiveId: string, originMessageId?: string): Promise<Record<string, unknown>> {
    const resp = await this.raw.request({
      method: 'POST',
      url: '/open-apis/im/v1/message_cot?receive_id_type=chat_id',
      data: {
        receive_id: receiveId,
        ...(originMessageId ? { origin_message_id: originMessageId } : {}),
      },
    });
    return (resp.data as Record<string, unknown> | undefined) ?? resp;
  }

  async update(ref: CotRef, events: readonly CotEvent[]): Promise<void> {
    if (events.length === 0) return;
    await this.raw.request({
      method: 'PUT',
      url: '/open-apis/im/v1/message_cot',
      data: { cot_id: ref.cotId, message_id: ref.messageId, events },
    });
  }

  async complete(ref: CotRef, reason: string): Promise<void> {
    await this.raw.request({
      method: 'POST',
      url: `/open-apis/im/v1/message_cot/complete/${encodeURIComponent(ref.cotId)}?message_id=${encodeURIComponent(ref.messageId)}&reason=${encodeURIComponent(reason)}`,
    });
  }
}

interface CotRef {
  cotId: string;
  messageId: string;
}

interface CotEvent {
  event_type: string;
  content: string;
  timestamp: number;
}

export class CotPublisher {
  private readonly client: Pick<CotClient, 'create' | 'update' | 'complete'>;
  readonly chatId: string;
  readonly originMessageId: string;
  readonly runId: string;
  readonly scope: string;
  readonly inputPreview: string;
  ref: CotRef | undefined;
  disabled = false;
  degradedReason: string | undefined;
  private buffer: CotEvent[] = [];
  private flushing: Promise<void> | undefined;
  private timer: NodeJS.Timeout | undefined;

  constructor(opts: {
    client: Pick<CotClient, 'create' | 'update' | 'complete'>;
    chatId: string;
    originMessageId: string;
    runId: string;
    scope: string;
    inputPreview: string;
  }) {
    this.client = opts.client;
    this.chatId = opts.chatId;
    this.originMessageId = opts.originMessageId;
    this.runId = opts.runId;
    this.scope = opts.scope;
    this.inputPreview = opts.inputPreview;
  }

  async start(): Promise<void> {
    try {
      const created = await this.client.create(this.chatId, this.originMessageId);
      const cotId = stringValue(created.cot_id ?? created.cotId);
      const messageId = stringValue(created.message_id ?? created.messageId);
      if (!cotId || !messageId) {
        throw new Error(`CreateCOT missing ids: ${JSON.stringify(created).slice(0, 200)}`);
      }
      this.ref = { cotId, messageId };
      log.info('cot', 'created', { cotId, messageId });
      this.enqueue('RUN_STARTED', {
        threadId: this.scope,
        runId: this.runId,
        input: { query: this.inputPreview },
      });
      this.enqueue('STEP_STARTED', {
        stepId: `step-understand-${this.runId}`,
        stepName: '理解用户问题',
      });
    } catch (err) {
      this.disabled = true;
      log.warn('cot', 'create-failed', { err: err instanceof Error ? err.message : String(err) });
    }
  }

  enqueue(eventType: string, content: unknown): void {
    if (this.disabled || !this.ref) return;
    this.buffer.push({
      event_type: eventType,
      content: JSON.stringify(content),
      timestamp: Date.now(),
    });
    this.scheduleFlush();
  }

  async finish(reason: string): Promise<void> {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = undefined;
    }
    await this.flush();
    if (!this.ref) return;
    // Always attempt to close the bubble — even when updates degraded
    // (`disabled`) — otherwise the 思考过程 message spins in Lark forever.
    // One retry: complete is known to fail transiently (COT complete 10001).
    for (let attempt = 1; ; attempt++) {
      try {
        await this.client.complete(this.ref, reason);
        log.info('cot', 'completed', { cotId: this.ref.cotId, reason });
        return;
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        if (attempt >= 2) {
          log.warn('cot', 'complete-failed', { err: message });
          return;
        }
        log.warn('cot', 'complete-retry', { err: message });
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }
  }

  private scheduleFlush(): void {
    if (this.timer || this.flushing) return;
    this.timer = setTimeout(() => {
      this.timer = undefined;
      void this.flush();
    }, COT_UPDATE_THROTTLE_MS);
  }

  private async flush(): Promise<void> {
    if (this.disabled || !this.ref) return;
    if (this.flushing) {
      await this.flushing;
      if (this.buffer.length > 0 && !this.disabled) await this.flush();
      return;
    }
    const events = this.buffer.splice(0);
    if (events.length === 0) return;
    this.flushing = this.client.update(this.ref, events)
      .catch((err) => {
        this.disabled = true;
        this.degradedReason = err instanceof Error ? err.message : String(err);
        log.warn('cot', 'update-failed', { err: this.degradedReason });
      })
      .finally(() => {
        this.flushing = undefined;
        if (this.buffer.length > 0 && !this.disabled) this.scheduleFlush();
      });
    await this.flushing;
  }
}

export function finalAnswerOnlyState(state: RunState): RunState {
  return {
    ...state,
    blocks: state.blocks.filter((b) => b.kind === 'text'),
    reasoning: { content: '', active: false },
    footer: null,
  };
}

export async function consumeCotEvents(
  events: AsyncIterable<AgentEvent>,
  publisher: CotPublisher,
  opts: { detail: CotMessagesMode },
): Promise<void> {
  let reasoningOpen = false;
  const toolBrief = new Map<string, { name: string; input: unknown }>();
  const reasoningMessageId = `reasoning-${publisher.runId}`;

  try {
    for await (const evt of events) {
      if (evt.type === 'system' || evt.type === 'usage') continue;
      if (evt.type === 'thinking') {
        if (!reasoningOpen) {
          reasoningOpen = true;
          publisher.enqueue('REASONING_START', { messageId: reasoningMessageId });
          publisher.enqueue('REASONING_MESSAGE_START', {
            messageId: reasoningMessageId,
            role: 'reasoning',
          });
        }
        publisher.enqueue('REASONING_MESSAGE_CONTENT', {
          messageId: reasoningMessageId,
          delta: truncateCot(evt.delta, COT_TEXT_MAX),
        });
        continue;
      }
      if (evt.type === 'tool_use') {
        closeReasoningIfNeeded();
        const toolCallId = evt.id;
        const detailed = opts.detail === 'detailed';
        const showSummary = opts.detail === 'brief' || detailed;
        const title = showSummary ? cotBriefToolTitle(evt.name, evt.input, 'running') : '正在调用工具';
        toolBrief.set(toolCallId, { name: evt.name, input: evt.input });
        publisher.enqueue('TOOL_CALL_START', {
          toolCallId,
          icon: showSummary ? cotToolIcon(evt.name) : 'default',
          title,
          toolCallName: showSummary ? evt.name : 'tool',
        });
        if (detailed && evt.input !== undefined) {
          publisher.enqueue('TOOL_CALL_ARGS', {
            toolCallId,
            delta: JSON.stringify(evt.input),
          });
        }
        publisher.enqueue('TOOL_CALL_END', { toolCallId });
        continue;
      }
      if (evt.type === 'tool_result') {
        const detailed = opts.detail === 'detailed';
        const brief = toolBrief.get(evt.id);
        publisher.enqueue('TOOL_CALL_RESULT', {
          messageId: `tool-result-${evt.id}`,
          toolCallId: evt.id,
          role: 'tool',
          content: detailed
            ? truncateCot(evt.output ?? '', COT_TOOL_OUTPUT_MAX)
            : brief
              ? cotBriefToolTitle(brief.name, brief.input, evt.isError ? 'error' : 'done')
              : '工具调用已完成',
        });
        toolBrief.delete(evt.id);
        continue;
      }
      if (evt.type === 'text') {
        // The agent's answer text is the VISIBLE final reply (sent from
        // channel.ts), NOT COT content — the fold holds only thinking + tools,
        // like common AI tools. So just close any open reasoning and skip.
        closeReasoningIfNeeded();
        continue;
      }
      if (evt.type === 'done' || evt.type === 'error') {
        closeReasoningIfNeeded();
        if (evt.type === 'error') {
          publisher.enqueue('RUN_ERROR', { message: evt.message, code: evt.terminationReason ?? 'error' });
          await publisher.finish('error');
        } else {
          const status = evt.terminationReason === 'normal' ? 'done' : evt.terminationReason ?? 'done';
          publisher.enqueue('RUN_FINISHED', {
            threadId: publisher.scope,
            runId: publisher.runId,
            status,
          });
          await publisher.finish(status === 'done' ? 'done' : 'error');
        }
        return;
      }
    }
    // Reaching here means the stream ended WITHOUT a done/error event — i.e. the
    // run was signal-killed (⏹ stop or idle-timeout). Those branches return, so
    // a normal finish is 'done' there; here it's an abnormal end → 'error'.
    closeReasoningIfNeeded();
    await publisher.finish('error');
  } catch (err) {
    log.warn('cot', 'consume-failed', { err: err instanceof Error ? err.message : String(err) });
    await publisher.finish('error');
  }

  function closeReasoningIfNeeded(): void {
    if (!reasoningOpen) return;
    reasoningOpen = false;
    publisher.enqueue('REASONING_MESSAGE_END', { messageId: reasoningMessageId });
    publisher.enqueue('REASONING_END', { messageId: reasoningMessageId });
  }

}

export function cotBriefToolTitle(
  name: string,
  input: unknown,
  status: 'running' | 'done' | 'error' = 'running',
): string {
  return toolHeaderText({ id: 'cot-tool', name, input, status }).replace(/\*\*/g, '');
}

function cotToolIcon(name: string): string {
  const lower = String(name ?? '').toLowerCase();
  if (lower.includes('search') || lower.includes('grep') || lower.includes('rg')) return 'search';
  if (lower.includes('read')) return 'read';
  if (lower.includes('write') || lower.includes('edit')) return 'write';
  if (lower.includes('doc')) return 'doc';
  if (lower.includes('calendar')) return 'calendar';
  if (lower.includes('task')) return 'task';
  if (lower.includes('command') || lower.includes('bash')) return 'bash';
  return 'default';
}

function truncateCot(value: unknown, max: number): string {
  const text = String(value ?? '');
  return text.length > max ? `${text.slice(0, max)}...` : text;
}

function stringValue(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined;
}
