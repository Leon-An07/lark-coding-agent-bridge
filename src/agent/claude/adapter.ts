import { createInterface } from 'node:readline';
import type { Readable } from 'node:stream';
import { log } from '../../core/logger';
import {
  killProcessTree,
  mergeProcessEnv,
  spawnProcess,
  type SpawnedProcessByStdio,
} from '../../platform/spawn';
import { buildBridgeSystemPrompt } from '../bridge-system-prompt';
import { buildLarkChannelEnv, type LarkChannelEnvContext } from '../lark-channel-env';
import { checkAgentAvailability, type AgentAvailability } from '../preflight';
import {
  CLAUDE_DEFAULT_PERMISSION_MODE,
  type AgentAdapter,
  type AgentBotIdentity,
  type AgentEvent,
  type AgentRun,
  type AgentRunOptions,
} from '../types';
import { translateEvent } from './stream-json';

export interface ClaudeAdapterOptions {
  binary?: string;
  larkChannel?: LarkChannelEnvContext;
}

type ClaudeChild = SpawnedProcessByStdio<null, Readable, Readable>;

/** Error text claude prints when `--resume` points at a session that no
 * longer exists (or never did). Empirically verified against claude CLI:
 * exit code 0, result event `error_during_execution`, this line in errors[]. */
const DEAD_SESSION_RE =
  /No conversation found with session ID|is not a UUID and does not match any session title/;

export class ClaudeAdapter implements AgentAdapter {
  readonly id = 'claude';
  readonly displayName = 'Claude Code';

  private readonly binary: string;
  private readonly larkChannel: LarkChannelEnvContext | undefined;
  private botIdentity: AgentBotIdentity | undefined;

  constructor(opts: ClaudeAdapterOptions = {}) {
    this.binary = opts.binary ?? 'claude';
    this.larkChannel = opts.larkChannel;
  }

  setBotIdentity(identity: AgentBotIdentity): void {
    this.botIdentity = identity;
  }

  async isAvailable(): Promise<boolean> {
    return (await this.checkAvailability()).ok;
  }

  async checkAvailability(): Promise<AgentAvailability> {
    return checkAgentAvailability({
      agentId: 'claude',
      agentName: 'Claude Code',
      command: this.binary,
      binaryPath: this.binary,
    });
  }

  run(opts: AgentRunOptions): AgentRun {
    const first = this.spawnOnce(opts);
    if (!opts.sessionId) return first;

    // `--resume` with a dead session id (deleted/expired transcript) makes
    // claude exit 0 with an error result before doing anything. Without a
    // fallback the stale id also stays in sessions.json, so every following
    // message in the chat fails the same way. Retry once without --resume;
    // the fresh run's init event then overwrites the stored session id.
    const holder = { active: first, stopped: false };
    const spawnFresh = (): AgentRun => this.spawnOnce({ ...opts, sessionId: undefined });
    async function* events(): AsyncGenerator<AgentEvent> {
      let sawSubstantive = false;
      for await (const evt of first.events) {
        if (evt.type === 'text' || evt.type === 'thinking' || evt.type === 'tool_use') {
          sawSubstantive = true;
        }
        if (
          evt.type === 'error' &&
          !sawSubstantive &&
          !holder.stopped &&
          DEAD_SESSION_RE.test(evt.message)
        ) {
          log.warn('agent', 'resume-fallback', {
            sessionId: opts.sessionId,
            err: evt.message.slice(0, 200),
          });
          const fresh = spawnFresh();
          holder.active = fresh;
          yield* fresh.events;
          return;
        }
        yield evt;
      }
    }
    return {
      runId: opts.runId,
      events: events(),
      stop: () => {
        holder.stopped = true;
        return holder.active.stop();
      },
      waitForExit: (timeoutMs: number) => holder.active.waitForExit(timeoutMs),
    };
  }

  private spawnOnce(opts: AgentRunOptions): AgentRun {
    if (!opts.cwd) {
      throw new Error('cwd is required for ClaudeAdapter.run');
    }

    const args = [
      '-p',
      opts.prompt,
      '--output-format',
      'stream-json',
      '--verbose',
      '--permission-mode',
      opts.permissionMode ?? CLAUDE_DEFAULT_PERMISSION_MODE,
      '--append-system-prompt',
      buildBridgeSystemPrompt(this.botIdentity),
    ];
    if (opts.sessionId) args.push('--resume', opts.sessionId);
    if (opts.model) args.push('--model', opts.model);
    if (opts.effort) args.push('--effort', opts.effort);

    const child = spawnProcess(this.binary, args, {
      cwd: opts.cwd,
      env: mergeProcessEnv(process.env, buildLarkChannelEnv(this.larkChannel)),
      stdio: ['ignore', 'pipe', 'pipe'],
      // Own process group (POSIX) so stop() can signal the whole tree —
      // claude's own children (Bash, MCP servers) would otherwise survive
      // the SIGKILL escalation as orphans.
      detached: process.platform !== 'win32',
    }) as ClaudeChild;

    log.info('agent', 'spawn', {
      pid: child.pid ?? null,
      cwd: opts.cwd ?? process.cwd(),
      hasSession: Boolean(opts.sessionId),
      promptChars: opts.prompt.length,
      model: opts.model,
      effort: opts.effort,
    });

    // Listeners MUST be attached synchronously here, before we return.
    // The 'error' and exit-related events can fire in the next tick; if we
    // defer attachment to the async-generator body, those events fire into
    // the void and the generator hangs.
    // Kept only for the exit-code error message (truncated there anyway), so
    // retain a bounded tail — a stderr-chatty run used to grow this for its
    // whole lifetime.
    const stderrChunks: Buffer[] = [];
    let stderrBytes = 0;
    let runtimeError: Error | null = null;
    let stderrBuffer = '';
    child.stderr.on('data', (chunk: Buffer) => {
      stderrChunks.push(chunk);
      stderrBytes += chunk.length;
      while (stderrBytes > 8192 && stderrChunks.length > 1) {
        stderrBytes -= stderrChunks[0]!.length;
        stderrChunks.shift();
      }
      stderrBuffer += chunk.toString('utf8');
      let nl = stderrBuffer.indexOf('\n');
      while (nl !== -1) {
        const line = stderrBuffer.slice(0, nl);
        stderrBuffer = stderrBuffer.slice(nl + 1);
        if (line.trim()) log.warn('agent', 'stderr', { line });
        if (isWindowsCommandNotFoundLine(line)) {
          runtimeError = new Error(`failed to spawn claude: ${line.trim()}`);
          child.stdout.destroy();
          child.kill();
        }
        nl = stderrBuffer.indexOf('\n');
      }
    });

    child.on('error', (err) => {
      runtimeError = err;
    });
    child.on('exit', (code, signal) => {
      log.info('agent', 'exit', { pid: child.pid ?? null, code, signal });
    });

    // Default 5s if caller didn't specify — claude often has live
    // subprocesses (lark-cli waiting for OAuth, long Bash, etc.) and the
    // old 500ms was nowhere near enough for them to flush state before the
    // SIGKILL cascade. Callers (channel.ts, /doctor) override per-run with
    // a value derived from preferences.
    const stopGraceMs = opts.stopGraceMs ?? 5000;
    let stopRequested = false;

    return {
      runId: opts.runId,
      events: createEventStream(child, stderrChunks, () => runtimeError, () => stopRequested),
      async stop() {
        if (child.exitCode !== null || child.signalCode !== null) return;
        stopRequested = true;
        log.info('agent', 'stop-sigterm', { pid: child.pid ?? null, graceMs: stopGraceMs });
        killProcessTree(child, 'SIGTERM');
        await new Promise<void>((resolve) => {
          const timer = setTimeout(() => {
            if (child.exitCode === null && child.signalCode === null) {
              log.warn('agent', 'stop-sigkill', {
                pid: child.pid ?? null,
                graceMs: stopGraceMs,
                reason: 'grace-period-expired',
              });
              killProcessTree(child, 'SIGKILL');
            }
            resolve();
          }, stopGraceMs);
          child.once('exit', () => {
            clearTimeout(timer);
            resolve();
          });
        });
      },
      waitForExit(timeoutMs: number): Promise<boolean> {
        if (child.exitCode !== null || child.signalCode !== null) {
          return Promise.resolve(true);
        }
        return new Promise<boolean>((resolve) => {
          const onExit = (): void => {
            clearTimeout(timer);
            resolve(true);
          };
          const timer = setTimeout(() => {
            child.removeListener('exit', onExit);
            resolve(false);
          }, timeoutMs);
          child.once('exit', onExit);
        });
      },
    };
  }
}

async function* createEventStream(
  child: ClaudeChild,
  stderrChunks: Buffer[],
  getError: () => Error | null,
  wasStopped: () => boolean,
): AsyncGenerator<AgentEvent> {
  // If fork itself failed synchronously, child.pid is undefined. The 'error'
  // event (ENOENT etc.) fires in the next tick, so also check getError().
  if (!child.pid) {
    const err = getError();
    yield {
      type: 'error',
      message: err ? `failed to spawn claude: ${err.message}` : 'spawn returned no pid',
      terminationReason: 'failed',
    };
    return;
  }

  const rl = createInterface({ input: child.stdout, crlfDelay: Infinity });
  let sawStdout = false;
  let silentExitTimer: ReturnType<typeof setTimeout> | undefined;
  const closeSilentStdout = (): void => {
    silentExitTimer = setTimeout(() => {
      if (!sawStdout && !child.stdout.readableEnded) child.stdout.destroy();
    }, 50);
  };
  child.once('exit', closeSilentStdout);
  try {
    for await (const line of rl) {
      sawStdout = true;
      const trimmed = line.trim();
      if (!trimmed) continue;
      let parsed: unknown;
      try {
        parsed = JSON.parse(trimmed);
      } catch {
        continue;
      }
      yield* translateEvent(parsed);
    }
  } finally {
    if (silentExitTimer) clearTimeout(silentExitTimer);
    child.removeListener('exit', closeSilentStdout);
    rl.close();
  }

  const earlyRuntimeError = getError();
  if (earlyRuntimeError && child.exitCode === null && child.signalCode === null) {
    yield {
      type: 'error',
      message: `claude runtime error: ${earlyRuntimeError.message}`,
      terminationReason: 'failed',
    };
    return;
  }

  // When the child is killed by a signal, exitCode stays null and signalCode
  // carries the name. Both must be checked or we'll attach an 'exit' listener
  // for an event that already fired and hang forever.
  const exitCode = await new Promise<number | null>((resolve) => {
    if (child.exitCode !== null || child.signalCode !== null) {
      resolve(child.exitCode);
    } else {
      child.once('exit', (code) => resolve(code));
    }
  });

  const runtimeError = getError();
  if (exitCode !== 0 && exitCode !== null) {
    const stderr = Buffer.concat(stderrChunks).toString('utf8').trim();
    const detail = stderr ? `: ${stderr.slice(0, 500)}` : '';
    yield {
      type: 'error',
      message: `claude exited with code ${exitCode}${detail}`,
      terminationReason: 'failed',
    };
  } else if (runtimeError) {
    yield {
      type: 'error',
      message: `claude runtime error: ${runtimeError.message}`,
      terminationReason: 'failed',
    };
  } else if (exitCode === null && child.signalCode && !wasStopped()) {
    // Killed by a signal we didn't send (OOM killer, external kill, crash).
    // exitCode stays null in that case, so without this branch the stream
    // ends silently and the run is finalized as success.
    yield {
      type: 'error',
      message: `claude killed by signal ${child.signalCode}`,
      terminationReason: 'failed',
    };
  }
}

function isWindowsCommandNotFoundLine(line: string): boolean {
  return (
    process.platform === 'win32' &&
    /is not recognized as an internal or external command|operable program or batch file/i.test(line)
  );
}
