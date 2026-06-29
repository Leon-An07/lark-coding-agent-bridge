import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { CallbackAuth } from '../../../src/card/callback-auth.js';
import { CallbackNonceStore } from '../../../src/card/callback-store.js';
import { injectBridgeTokens } from '../../../src/card/bridge-token-card.js';

const cleanups: Array<() => Promise<void>> = [];

describe('injectBridgeTokens', () => {
  afterEach(async () => {
    for (const cleanup of cleanups.splice(0).reverse()) {
      await cleanup();
    }
  });

  it('injects one valid token into marked bridge callback payloads only', async () => {
    const h = await harness();
    const input = {
      schema: '2.0',
      body: {
        elements: [
          {
            tag: 'button',
            behaviors: [
              {
                type: 'callback',
                value: {
                  __bridge_cb: true,
                  choice: 'approve',
                },
              },
            ],
          },
          {
            tag: 'button',
            behaviors: [
              {
                type: 'callback',
                value: {
                  unrelated: true,
                },
              },
            ],
          },
        ],
      },
    };

    const signed = injectBridgeTokens(input, {
      auth: h.auth,
      chatId: 'oc_chat',
      operatorOpenId: '*',
      ttlMs: 60_000,
    });

    expect(signed.signedCallbacks).toBe(1);
    expect(signed.alreadySignedCallbacks).toBe(0);

    const bridgeValue = (((signed.card as Record<string, unknown>).body as {
      elements: Array<{ behaviors: Array<{ value: Record<string, unknown> }> }>;
    }).elements[0]?.behaviors[0]?.value);
    const unrelatedValue = (((signed.card as Record<string, unknown>).body as {
      elements: Array<{ behaviors: Array<{ value: Record<string, unknown> }> }>;
    }).elements[1]?.behaviors[0]?.value);

    expect(typeof bridgeValue?.bridge_token).toBe('string');
    expect(unrelatedValue?.bridge_token).toBeUndefined();
    expect(
      h.auth.verify(String(bridgeValue?.bridge_token), {
        runId: '',
        scope: 'oc_chat',
        chatId: 'oc_chat',
        operatorOpenId: 'ou_clicker',
        action: 'agent_callback',
        policyFingerprint: '',
      }),
    ).toMatchObject({ ok: true });
  });

  it('preserves existing bridge tokens', async () => {
    const h = await harness();
    const signed = injectBridgeTokens(
      {
        body: {
          elements: [
            {
              value: {
                __bridge_cb: true,
                bridge_token: 'bridge_cb.v1.existing.signature',
              },
            },
          ],
        },
      },
      {
        auth: h.auth,
        chatId: 'oc_chat',
        operatorOpenId: '*',
        ttlMs: 60_000,
      },
    );

    expect(signed.signedCallbacks).toBe(0);
    expect(signed.alreadySignedCallbacks).toBe(1);
    expect(JSON.stringify(signed.card)).toContain('bridge_cb.v1.existing.signature');
  });
});

async function harness() {
  const root = await mkdtemp(join(tmpdir(), 'bridge-token-card-'));
  cleanups.push(() => rm(root, { recursive: true, force: true }));
  const store = new CallbackNonceStore(join(root, 'nonces.json'));
  cleanups.push(() => store.flush());
  const auth = new CallbackAuth({
    keys: [{ version: 1, secret: 'secret' }],
    nonceStore: store,
    now: () => 1000,
    createNonce: () => 'nonce',
  });
  return { auth };
}
