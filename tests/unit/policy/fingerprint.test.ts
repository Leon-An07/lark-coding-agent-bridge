import { describe, expect, it } from 'vitest';
import { createDefaultProfileConfig } from '../../../src/config/profile-schema';
import {
  accessPolicyDigest,
  attachmentPolicyShapeDigest,
  digestCanonical,
  policyFingerprint,
  resourceScopeDigest,
  type FingerprintInputV2,
} from '../../../src/policy/fingerprint';
import { canonicalizeJcs } from '../../../src/session/jcs';

describe('policy fingerprint', () => {
  it('canonicalizes JSON with sorted object keys while preserving array order', () => {
    expect(
      canonicalizeJcs({
        z: 1,
        a: {
          d: [3, { z: false, a: true }],
          c: null,
        },
        b: 'text',
      }),
    ).toBe('{"a":{"c":null,"d":[3,{"a":true,"z":false}]},"b":"text","z":1}');
  });

  it('produces sha256 first-16-byte base64url fingerprints', () => {
    const fp = policyFingerprint(baseInput());

    expect(fp).toMatch(/^[A-Za-z0-9_-]{22}$/);
    expect(fp).not.toContain('=');
    expect(fp).toBe(policyFingerprint(baseInput()));
  });

  it('changes when policy-defining fields change', () => {
    const base = baseInput();

    for (const changed of [
      { cwdRealpath: '/repo/other' },
      { sandbox: 'workspace-write' as const },
      { accessPolicyDigest: digestOf('access-other') },
      { resourceScopeDigest: digestOf('scope-other') },
      { attachmentPolicyShapeDigest: digestOf('attachments-other') },
      { codexHome: '/state/other-codex-home' },
      { inheritCodexHome: true },
    ]) {
      expect(policyFingerprint({ ...base, ...changed })).not.toBe(policyFingerprint(base));
    }
  });

  it('ignores runtime owner, timestamp, model, and concrete attachment names or sizes', () => {
    const base = baseInput();

    expect(
      policyFingerprint({
        ...base,
        owner: 'ou_owner_a',
        timestamp: 1,
        model: 'model-a',
      } as FingerprintInputV2 & Record<string, unknown>),
    ).toBe(
      policyFingerprint({
        ...base,
        owner: 'ou_owner_b',
        timestamp: 2,
        model: 'model-b',
      } as FingerprintInputV2 & Record<string, unknown>),
    );

    expect(
      attachmentPolicyShapeDigest([
        {
          kind: 'image',
          requiredness: 'required',
          decision: 'accepted',
          originalName: 'secret-a.png',
          size: 1,
        },
      ]),
    ).toBe(
      attachmentPolicyShapeDigest([
        {
          kind: 'image',
          requiredness: 'required',
          decision: 'accepted',
          originalName: 'secret-b.png',
          size: 999,
        },
      ]),
    );
  });

  it('sorts access and resource allowlists so ordering does not change digests', () => {
    const profile = createDefaultProfileConfig({
      agentKind: 'claude',
      accounts: {
        app: {
          id: 'cli_test',
          secret: '${APP_SECRET}',
          tenant: 'feishu',
        },
      },
      access: {
        allowedUsers: ['ou_b', 'ou_a'],
        allowedChats: ['oc_b', 'oc_a'],
        admins: ['ou_admin_b', 'ou_admin_a'],
        chatRequireMention: {
          oc_z: false,
          oc_y: true,
        },
      },
    });

    expect(accessPolicyDigest(profile.access)).toBe(
      accessPolicyDigest({
        ...profile.access,
        allowedUsers: ['ou_a', 'ou_b'],
        allowedChats: ['oc_a', 'oc_b'],
        admins: ['ou_admin_a', 'ou_admin_b'],
        chatRequireMention: {
          oc_y: true,
          oc_z: false,
        },
      }),
    );
    expect(
      resourceScopeDigest({
        source: 'comment',
        chatId: 'oc_1',
        threadId: 'omt_1',
        resourceBindings: ['doc_b', 'doc_a'],
      }),
    ).toBe(
      resourceScopeDigest({
        source: 'comment',
        chatId: 'oc_1',
        threadId: 'omt_1',
        resourceBindings: ['doc_a', 'doc_b'],
      }),
    );
  });

  it('digests the per-chat mention map under its pre-merge key', () => {
    // `policyFingerprint` is persisted per entry in sessions.json.catalog.json
    // and `matchesIdentity` demands an exact match, so if this digest input key
    // had followed the `requireMentionInGroupOverrides` → `chatRequireMention`
    // field rename, every catalog entry would have been orphaned on upgrade and
    // every chat/topic would silently start a fresh agent session. Pin the
    // digest of a known access shape so that can't regress unnoticed.
    const access = {
      allowedUsers: ['ou_b', 'ou_a'],
      allowedChats: ['oc_2', 'oc_1'],
      admins: ['ou_admin'],
      requireMentionInGroup: true,
      chatRequireMention: { oc_quiet: false, oc_strict: true },
    };

    expect(accessPolicyDigest(access)).toBe(
      digestCanonical({
        admins: ['ou_admin'],
        allowedChats: ['oc_1', 'oc_2'],
        allowedUsers: ['ou_a', 'ou_b'],
        requireMentionInGroup: true,
        requireMentionInGroupOverrides: { oc_quiet: false, oc_strict: true },
      }),
    );
  });

  it('treats an omitted per-chat map and an empty one as the same policy', () => {
    // `normalizeAccess` omits the map when empty; pre-merge configs stored it
    // as `{}`. Both must fingerprint alike or the upgrade resets sessions.
    const withoutMap = {
      allowedUsers: ['ou_a'],
      allowedChats: ['oc_1'],
      admins: [],
      requireMentionInGroup: true,
    };

    expect(accessPolicyDigest({ ...withoutMap, chatRequireMention: {} })).toBe(
      accessPolicyDigest(withoutMap),
    );
  });
});

function baseInput(): FingerprintInputV2 {
  return {
    cwdRealpath: '/repo/project',
    sandbox: 'read-only',
    accessPolicyDigest: digestOf('access'),
    resourceScopeDigest: digestOf('scope'),
    attachmentPolicyShapeDigest: digestOf('attachments'),
    codexHome: '/state/codex-home',
    inheritCodexHome: false,
  };
}

function digestOf(value: string): string {
  return resourceScopeDigest({ source: 'im', chatId: value });
}
