import { readFile } from 'node:fs/promises';
import { log } from '../core/logger';
import { writeFileAtomic } from '../platform/atomic-write';

type NonceState = 'used' | 'revoked';

interface NonceEntry {
  s: NonceState;
  /** Keep-until (epoch ms). Once the token is expired, verify() rejects a
   * replay on `expired` before ever consulting the nonce — so the entry can
   * be dropped. Anchoring retention here keeps the store bounded (it used to
   * grow one entry per card click, forever). */
  exp: number;
}

/** Kept past the keep-until stamp to absorb clock skew. */
const EXPIRY_SLACK_MS = 60 * 60 * 1000;
/** Minimum retention regardless of token expiry — covers legacy entries,
 * consume() callers that pass no expiry, and signers whose clock is off.
 * Longest routine token TTL is the 24h agent card, so 48h is comfortably
 * past every default. */
const MIN_RETENTION_MS = 48 * 60 * 60 * 1000;

export class CallbackNonceStore {
  private readonly path: string;
  private readonly nonces = new Map<string, NonceEntry>();
  private saving: Promise<void> = Promise.resolve();

  constructor(path: string) {
    this.path = path;
  }

  async load(): Promise<void> {
    try {
      const raw = JSON.parse(await readFile(this.path, 'utf8')) as unknown;
      if (!raw || typeof raw !== 'object') return;
      this.nonces.clear();
      for (const [nonce, value] of Object.entries(raw as Record<string, unknown>)) {
        // Legacy format: plain 'used' | 'revoked' strings without expiry.
        if (value === 'used' || value === 'revoked') {
          this.nonces.set(nonce, { s: value, exp: Date.now() + MIN_RETENTION_MS });
          continue;
        }
        if (value && typeof value === 'object') {
          const entry = value as Partial<NonceEntry>;
          if ((entry.s === 'used' || entry.s === 'revoked') && typeof entry.exp === 'number') {
            this.nonces.set(nonce, { s: entry.s, exp: entry.exp });
          }
        }
      }
      this.prune();
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code === 'ENOENT') return;
      log.fail('callback-nonce', err, { step: 'load' });
    }
  }

  state(nonce: string): NonceState | undefined {
    return this.nonces.get(nonce)?.s;
  }

  consume(nonce: string, tokenExp?: number): boolean {
    if (this.nonces.has(nonce)) return false;
    this.nonces.set(nonce, { s: 'used', exp: keepUntil(tokenExp) });
    this.schedulePersist();
    return true;
  }

  revoke(nonce: string, tokenExp?: number): void {
    this.nonces.set(nonce, { s: 'revoked', exp: keepUntil(tokenExp) });
    this.schedulePersist();
  }

  async flush(): Promise<void> {
    await this.saving;
  }

  private prune(): void {
    const cutoff = Date.now() - EXPIRY_SLACK_MS;
    for (const [nonce, entry] of this.nonces) {
      if (entry.exp < cutoff) this.nonces.delete(nonce);
    }
  }

  private schedulePersist(): void {
    this.saving = this.saving
      .then(async () => {
        this.prune();
        await writeFileAtomic(
          this.path,
          `${JSON.stringify(Object.fromEntries(this.nonces), null, 2)}\n`,
          { mode: 0o600 },
        );
      })
      .catch((err: unknown) => {
        log.fail('callback-nonce', err, { step: 'persist' });
      });
  }
}

function keepUntil(tokenExp: number | undefined): number {
  // Never below the minimum window: a signer with a skewed clock (or a fake
  // test clock) must not produce an entry that prunes before the token
  // actually stops verifying.
  return Math.max(typeof tokenExp === 'number' ? tokenExp : 0, Date.now() + MIN_RETENTION_MS);
}
