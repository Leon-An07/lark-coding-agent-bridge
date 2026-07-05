/**
 * Context-window usage notice, appended to the tail of a reply when the
 * session's context crosses a usage tier. Replaces the old Stop-hook approach
 * (cc-agent/.claude/hooks/bridge-done-ping.py) which sent a SEPARATE Lark
 * message — this renders inline in the same reply instead.
 *
 * Tier state is per scope + session: each tier fires once per session and
 * resets on /new (session id changes). In-memory only — a bridge restart
 * re-warns at most once per tier, which is acceptable.
 */

const TIERS: ReadonlyArray<{ threshold: number; icon: string; hint: string }> = [
  { threshold: 0.9, icon: '🔴', hint: 'nearly full — wrap up and /new' },
  { threshold: 0.75, icon: '🟠', hint: 'every turn rereads history; /new after this topic saves cost' },
  { threshold: 0.6, icon: '🟡', hint: 'still fine; consider /new at a natural break' },
];

/** Infer the context window from the model id reported by the agent's init
 * event. 1M-context variants carry a "[1m]" (or "-1m") marker; everything
 * else on the Claude side is a 200k window today. */
export function contextWindowFor(model: string | undefined): number {
  if (model && /\[1m\]|-1m\b/i.test(model)) return 1_000_000;
  return 200_000;
}

function formatTokens(n: number): string {
  return n >= 1_000_000 ? `${(n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1)}M` : `${Math.round(n / 1000)}k`;
}

/** Highest tier index reached (0 = most severe), or undefined below 60%. */
function tierFor(tokens: number, window: number): number | undefined {
  const ratio = tokens / window;
  for (let i = 0; i < TIERS.length; i++) {
    if (ratio >= TIERS[i]!.threshold) return i;
  }
  return undefined;
}

export class ContextNoticeTracker {
  /** scope → last session key + most severe tier already shown for it. */
  private readonly shown = new Map<string, { session: string; tier: number }>();

  /**
   * Returns the notice line to append (and records it as shown), or
   * undefined when below every tier or this tier was already shown for the
   * session. `sessionKey` should change on /new so tiers re-arm.
   */
  take(
    scope: string,
    sessionKey: string | undefined,
    contextTokens: number | undefined,
    model: string | undefined,
  ): string | undefined {
    if (contextTokens === undefined || contextTokens <= 0) return undefined;
    const window = contextWindowFor(model);
    const tier = tierFor(contextTokens, window);
    if (tier === undefined) return undefined;

    const session = sessionKey ?? scope;
    const prev = this.shown.get(scope);
    // Lower index = more severe; only fire when strictly escalating within
    // the same session.
    if (prev && prev.session === session && prev.tier <= tier) return undefined;
    this.shown.set(scope, { session, tier });

    const t = TIERS[tier]!;
    const pct = Math.round((contextTokens / window) * 100);
    return `${t.icon} Context ≈${formatTokens(contextTokens)} / ${formatTokens(window)} (${pct}%) — ${t.hint}.`;
  }
}
