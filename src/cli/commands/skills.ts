import { msgs } from '../../i18n';
import { detectInstalledAgents, type AgentKind } from '../agent-detection';
import { agentSkillDir, AGENT_SKILL_DIRS, bundledSkillsDir, installSkills } from '../../skills/install';

export interface SkillsInstallOptions {
  /** Install for this agent only. Default: every agent found on PATH. */
  agent?: string;
  /** Install into this directory instead of the agent's default. */
  dest?: string;
  /** Replace skills that already exist at the destination. */
  force?: boolean;
}

export async function runSkillsInstall(opts: SkillsInstallOptions): Promise<void> {
  const m = msgs().cli;
  const known = Object.keys(AGENT_SKILL_DIRS) as AgentKind[];
  if (opts.agent && !known.includes(opts.agent as AgentKind)) {
    console.error(m.skillsUnknownAgent(opts.agent, known));
    process.exitCode = 1;
    return;
  }
  const agents: AgentKind[] = opts.agent
    ? [opts.agent as AgentKind]
    : (await detectInstalledAgents()).map((a) => a.kind);
  if (agents.length === 0 && !opts.dest) {
    console.error(m.skillsNoAgentFound(known));
    process.exitCode = 1;
    return;
  }

  const sourceDir = bundledSkillsDir();
  const targets = opts.dest ? [{ label: opts.dest, dir: opts.dest }] : agents.map((a) => ({ label: a, dir: agentSkillDir(a) }));
  for (const target of targets) {
    console.log(m.skillsInstallingFor(target.label, target.dir));
    for (const r of await installSkills({ sourceDir, targetDir: target.dir, force: opts.force })) {
      console.log(
        r.outcome === 'skipped-existing' ? m.skillsSkippedExisting(r.skill) : m.skillsInstalled(r.skill, r.outcome === 'updated'),
      );
    }
  }
}
