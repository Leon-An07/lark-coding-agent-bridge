import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { agentSkillDir, bundledSkillsDir, installSkills, listBundledSkills } from '../../../src/skills/install.js';

const dirs: string[] = [];
afterEach(async () => {
  await Promise.all(dirs.splice(0).map((d) => rm(d, { recursive: true, force: true })));
});
async function tmp(): Promise<string> {
  const d = await mkdtemp(join(tmpdir(), 'skills-'));
  dirs.push(d);
  return d;
}

describe('bundled skills', () => {
  it('ships at least the example skill with a SKILL.md', async () => {
    expect(await listBundledSkills(bundledSkillsDir())).toContain('lark-channel-bridge-basics');
  });

  it('resolves each agent skill dir from its home env var, else the default', () => {
    expect(agentSkillDir('codex', {}, '/home/u')).toBe(join('/home/u', '.codex', 'skills'));
    expect(agentSkillDir('codex', { CODEX_HOME: '/x/codex' }, '/home/u')).toBe(join('/x/codex', 'skills'));
    expect(agentSkillDir('claude', {}, '/home/u')).toBe(join('/home/u', '.claude', 'skills'));
    expect(agentSkillDir('claude', { CLAUDE_CONFIG_DIR: '/x/claude' }, '/home/u')).toBe(join('/x/claude', 'skills'));
  });

  it('installs, keeps local edits on re-run, and replaces them with force', async () => {
    const target = await tmp();
    const sourceDir = bundledSkillsDir();
    const first = await installSkills({ sourceDir, targetDir: target });
    expect(first.find((r) => r.skill === 'lark-channel-bridge-basics')?.outcome).toBe('installed');

    const skillFile = join(target, 'lark-channel-bridge-basics', 'SKILL.md');
    await writeFile(skillFile, 'local edit');
    const again = await installSkills({ sourceDir, targetDir: target });
    expect(again.find((r) => r.skill === 'lark-channel-bridge-basics')?.outcome).toBe('skipped-existing');
    expect(await readFile(skillFile, 'utf8')).toBe('local edit');

    const forced = await installSkills({ sourceDir, targetDir: target, force: true });
    expect(forced.find((r) => r.skill === 'lark-channel-bridge-basics')?.outcome).toBe('updated');
    expect(await readFile(skillFile, 'utf8')).toContain('name: lark-channel-bridge-basics');
  });
});
