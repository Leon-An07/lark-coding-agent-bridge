import { existsSync } from 'node:fs';
import { cp, readdir, stat } from 'node:fs/promises';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { AgentKind } from '../cli/agent-detection';

/**
 * Where each supported agent looks for user-level skills (SKILL.md folders).
 * Codex: `$CODEX_HOME/skills`, default `~/.codex/skills` (Codex CLI 0.160's
 * own skill-installer writes there). Claude Code: `$CLAUDE_CONFIG_DIR/skills`,
 * default `~/.claude/skills`. Add a row to support another agent.
 */
export const AGENT_SKILL_DIRS: Record<AgentKind, (env: NodeJS.ProcessEnv, home: string) => string> = {
  claude: (env, home) => join(env.CLAUDE_CONFIG_DIR || join(home, '.claude'), 'skills'),
  codex: (env, home) => join(env.CODEX_HOME || join(home, '.codex'), 'skills'),
};

export interface SkillInstallResult {
  skill: string;
  dest: string;
  outcome: 'installed' | 'updated' | 'skipped-existing';
}

/** The `skills/` folder shipped in the npm package (or the repo in dev). */
export function bundledSkillsDir(from: string = dirname(fileURLToPath(import.meta.url))): string {
  for (let dir = from; ; dir = dirname(dir)) {
    const candidate = join(dir, 'skills');
    if (existsSync(join(dir, 'package.json')) && existsSync(candidate)) return candidate;
    if (dirname(dir) === dir) throw new Error(`bundled skills directory not found above ${from}`);
  }
}

/** Names of bundled skills: subfolders that contain a SKILL.md. */
export async function listBundledSkills(sourceDir: string): Promise<string[]> {
  const entries = await readdir(sourceDir, { withFileTypes: true });
  return entries
    .filter((e) => e.isDirectory() && existsSync(join(sourceDir, e.name, 'SKILL.md')))
    .map((e) => e.name)
    .sort();
}

/**
 * Copy every bundled skill into `targetDir/<name>`. An existing skill of the
 * same name is left alone unless `force`, so a user's local edits survive a
 * re-run; with `force` it is replaced by the bundled copy.
 */
export async function installSkills(opts: {
  sourceDir: string;
  targetDir: string;
  force?: boolean;
}): Promise<SkillInstallResult[]> {
  const results: SkillInstallResult[] = [];
  for (const skill of await listBundledSkills(opts.sourceDir)) {
    const dest = join(opts.targetDir, skill);
    const exists = await stat(dest).then(
      () => true,
      () => false,
    );
    if (exists && !opts.force) {
      results.push({ skill, dest, outcome: 'skipped-existing' });
      continue;
    }
    await cp(join(opts.sourceDir, skill), dest, { recursive: true, force: true });
    results.push({ skill, dest, outcome: exists ? 'updated' : 'installed' });
  }
  return results;
}

export function agentSkillDir(agent: AgentKind, env: NodeJS.ProcessEnv = process.env, home = homedir()): string {
  return AGENT_SKILL_DIRS[agent](env, home);
}
