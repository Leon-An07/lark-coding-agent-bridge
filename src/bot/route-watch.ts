import { spawn, type ChildProcess } from 'node:child_process';
import { log } from '../core/logger';

/**
 * Route-flush watcher (macOS only).
 *
 * VPN / secure-gateway clients such as CorpLink rebuild hundreds of routes
 * every minute or so. Each rebuild silently kills open WebSockets: the server
 * sees the drop at once and rejects card callbacks as "callback service
 * offline", while the SDK only notices at its next ping timeout (20-40s
 * later). Watching the routing socket lets us reconnect right after the burst.
 *
 * One `route -n monitor` child is shared by every channel in the process.
 */

/** Route messages in one burst before it counts as a flush. */
const BURST_MIN_EVENTS = 50;
/** A burst ends after this much silence. */
const SETTLE_MS = 1_500;

export class RouteBurstDetector {
  private count = 0;
  private timer: ReturnType<typeof setTimeout> | undefined;

  constructor(private readonly onFlush: (events: number) => void) {}

  feed(line: string): void {
    if (!line.startsWith('RTM_')) return;
    this.count++;
    if (this.timer) clearTimeout(this.timer);
    this.timer = setTimeout(() => this.settle(), SETTLE_MS);
  }

  stop(): void {
    if (this.timer) clearTimeout(this.timer);
    this.timer = undefined;
    this.count = 0;
  }

  private settle(): void {
    const events = this.count;
    this.count = 0;
    this.timer = undefined;
    if (events >= BURST_MIN_EVENTS) this.onFlush(events);
  }
}

type Listener = () => void;

const listeners = new Set<Listener>();
let child: ChildProcess | undefined;
let detector: RouteBurstDetector | undefined;

export function onRouteFlush(listener: Listener): () => void {
  listeners.add(listener);
  if (process.platform === 'darwin' && !child) startMonitor();
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) stopMonitor();
  };
}

function startMonitor(): void {
  detector = new RouteBurstDetector((events) => {
    log.info('ws', 'route-flush', { events, listeners: listeners.size });
    for (const l of listeners) l();
  });
  const proc = spawn('/sbin/route', ['-n', 'monitor'], { stdio: ['ignore', 'pipe', 'ignore'] });
  child = proc;
  let buf = '';
  proc.stdout?.setEncoding('utf8');
  proc.stdout?.on('data', (chunk: string) => {
    buf += chunk;
    let nl: number;
    while ((nl = buf.indexOf('\n')) >= 0) {
      detector?.feed(buf.slice(0, nl));
      buf = buf.slice(nl + 1);
    }
  });
  proc.on('error', (err) => log.fail('ws', err, { step: 'route-monitor' }));
  proc.on('exit', (code, signal) => {
    if (child !== proc) return;
    child = undefined;
    detector?.stop();
    log.warn('ws', 'route-monitor-exit', { code, signal });
  });
  process.once('exit', stopMonitor);
}

function stopMonitor(): void {
  const proc = child;
  child = undefined;
  detector?.stop();
  detector = undefined;
  proc?.kill();
}
