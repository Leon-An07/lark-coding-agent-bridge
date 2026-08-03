import { createHash } from 'node:crypto';
import type { ProfileConfig, SandboxMode } from '../config/profile-schema';
import { canonicalizeJcs } from '../session/jcs';

export interface FingerprintInputV2 {
  cwdRealpath: string;
  sandbox: SandboxMode;
  accessPolicyDigest: string;
  resourceScopeDigest: string;
  attachmentPolicyShapeDigest: string;
  codexHome?: string;
  inheritCodexHome: boolean;
}

export interface ResourceScopeDigestInput {
  source: 'im' | 'card' | 'comment' | 'meeting';
  chatId?: string;
  threadId?: string;
  commentScopeId?: string;
  resourceBindings?: string[];
}

export interface AttachmentPolicyShapeInput {
  kind: string;
  requiredness?: 'required' | 'optional';
  decision?: 'accepted' | 'rejected' | 'skipped';
  rejectionReason?: string;
  originalName?: string;
  size?: number;
  hash?: string;
  path?: string;
}

export function policyFingerprint(input: FingerprintInputV2): string {
  return digestCanonical({
    version: 2,
    cwdRealpath: input.cwdRealpath,
    sandbox: input.sandbox,
    accessPolicyDigest: input.accessPolicyDigest,
    resourceScopeDigest: input.resourceScopeDigest,
    attachmentPolicyShapeDigest: input.attachmentPolicyShapeDigest,
    codexHome: input.codexHome ?? null,
    inheritCodexHome: input.inheritCodexHome,
  });
}

export function accessPolicyDigest(access: ProfileConfig['access']): string {
  return digestCanonical({
    admins: [...access.admins].sort(),
    allowedChats: [...access.allowedChats].sort(),
    allowedUsers: [...access.allowedUsers].sort(),
    requireMentionInGroup: access.requireMentionInGroup,
    // Digest key deliberately keeps the pre-merge field name. The digest feeds
    // `policyFingerprint`, which `SessionCatalog.matchesIdentity` requires an
    // exact match on — renaming the key to `chatRequireMention` here would
    // change every fingerprint and orphan every catalog entry, so each chat and
    // topic would silently start a brand-new agent session after the upgrade.
    // The name is an on-disk digest input, not an API; the value is the current
    // `chatRequireMention` map. (Official omits this map from the digest
    // entirely — this fork treats per-chat mention policy as part of the
    // policy identity, which predates the merge.)
    requireMentionInGroupOverrides: Object.fromEntries(
      Object.entries(access.chatRequireMention ?? {}).sort(([a], [b]) => a.localeCompare(b)),
    ),
  });
}

export function resourceScopeDigest(input: ResourceScopeDigestInput): string {
  return digestCanonical({
    source: input.source,
    chatId: input.chatId ?? null,
    threadId: input.threadId ?? null,
    commentScopeId: input.commentScopeId ?? null,
    resourceBindings: [...(input.resourceBindings ?? [])].sort(),
  });
}

export function attachmentPolicyShapeDigest(input: AttachmentPolicyShapeInput[]): string {
  const shape = input
    .map((item) => ({
      kind: item.kind,
      requiredness: item.requiredness ?? null,
      decision: item.decision ?? null,
      rejectionReason: item.rejectionReason ?? null,
    }))
    .sort((a, b) => canonicalizeJcs(a).localeCompare(canonicalizeJcs(b)));
  return digestCanonical(shape);
}

export function attachmentPolicyConfigDigest(input: ProfileConfig['attachments']): string {
  return digestCanonical({
    maxCount: input.maxCount,
    maxBytes: input.maxBytes,
    maxFileBytes: input.maxFileBytes,
    imageMaxBytes: input.imageMaxBytes,
  });
}

export function digestCanonical(value: unknown): string {
  return createHash('sha256')
    .update(canonicalizeJcs(value))
    .digest()
    .subarray(0, 16)
    .toString('base64url');
}
