import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  configureOpenCardStore,
  flushOpenCardStore,
  setScopeOpenCard,
  takeScopeOpenCard,
} from '../../../src/card/managed.js';

describe('open-card store (file-backed, shared between send-card CLI and daemon)', () => {
  let dir: string;
  let storePath: string;

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'open-cards-'));
    storePath = join(dir, 'open-cards.json');
    configureOpenCardStore(storePath);
  });

  afterEach(async () => {
    await flushOpenCardStore();
    configureOpenCardStore(undefined);
    rmSync(dir, { recursive: true, force: true });
  });

  it('set persists to the file; take consumes it exactly once', async () => {
    setScopeOpenCard('oc_chat', 'om_msg1', { schema: '2.0' });
    await flushOpenCardStore();

    const onDisk = JSON.parse(readFileSync(storePath, 'utf8')) as Record<string, unknown>;
    expect(onDisk.oc_chat).toEqual({ messageId: 'om_msg1', card: { schema: '2.0' } });

    expect(takeScopeOpenCard('oc_chat')).toEqual({ messageId: 'om_msg1', card: { schema: '2.0' } });
    await flushOpenCardStore();
    expect(takeScopeOpenCard('oc_chat')).toBeUndefined();
    const after = JSON.parse(readFileSync(storePath, 'utf8')) as Record<string, unknown>;
    expect(after.oc_chat).toBeUndefined();
  });

  it('take picks up an entry written by another process (file, not memory)', () => {
    // Simulate the send-card CLI: write the file directly, bypassing this
    // process's in-memory map.
    writeFileSync(
      storePath,
      JSON.stringify({ oc_other: { messageId: 'om_cli', card: { schema: '2.0' } } }),
    );
    expect(takeScopeOpenCard('oc_other')).toEqual({ messageId: 'om_cli', card: { schema: '2.0' } });
  });

  it('survives a corrupt store file', () => {
    writeFileSync(storePath, '{not json');
    expect(takeScopeOpenCard('oc_chat')).toBeUndefined();
    setScopeOpenCard('oc_chat', 'om_msg2', {});
    expect(takeScopeOpenCard('oc_chat')).toEqual({ messageId: 'om_msg2', card: {} });
  });

  it('falls back to pure in-memory behaviour when no store is configured', () => {
    configureOpenCardStore(undefined);
    setScopeOpenCard('oc_mem', 'om_mem', {});
    expect(takeScopeOpenCard('oc_mem')).toEqual({ messageId: 'om_mem', card: {} });
    expect(takeScopeOpenCard('oc_mem')).toBeUndefined();
  });
});
