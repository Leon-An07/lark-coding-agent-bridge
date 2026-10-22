import { Command } from 'commander';
import pkg from '../../package.json';
import { formatAgentPreflightDiagnostic, getAgentPreflightDiagnostic } from '../agent/preflight';
import { runMigrate } from './commands/migrate';
import { runKillCli, runPs } from './commands/ps';
import {
  runSecretsGet,
  runSecretsList,
  runSecretsRemove,
  runSecretsSet,
} from './commands/secrets';
import { runSendCard } from './commands/send-card';
import { runSkillsInstall } from './commands/skills';
import {
  runProfileCreate,
  runProfileExport,
  runProfileList,
  runProfileRemove,
  runProfileUse,
} from './commands/profile';
import {
  runServiceRestart,
  runServiceStart,
  runServiceStatus,
  runServiceStop,
  runServiceUnregister,
} from './commands/service';
import { runStart } from './commands/start';
import { runUi } from './commands/ui';
import { DEFAULT_LOCALE, detectOsLocale, msgs, setActiveLocale } from '../i18n';

// Help text is built at load, before any profile config is read, so it
// follows the OS locale.
setActiveLocale(detectOsLocale() ?? DEFAULT_LOCALE);
const h = msgs().help;

const program = new Command();

program
  .name('lark-channel-bridge')
  .description(h.program)
  .version(pkg.version, '-v, --version', h.optVersion)
  .helpOption('-h, --help', h.optHelp)
  .helpCommand('help [command]', h.helpCommand);

// === process-level commands (work directly on bridge processes) ===

program
  .command('run')
  .description(h.run)
  .option('-c, --config <path>', h.optConfig)
  .option('--profile <name>', h.optRunProfile)
  .option('--web-ui', h.optRunWebUi)
  .option('--agent <kind>', h.optAgentNew)
  .option('--workspace <path>', h.optWorkspaceBootstrap)
  .option('--app-id <id>', h.optAppId)
  .option('--app-secret <secret>', h.optAppSecret)
  .option('--tenant <tenant>', h.optTenant)
  .option('--skip-check-lark-cli', h.optSkipLarkCli)
  .action(async (opts: {
    config?: string;
    profile?: string;
    webUi?: boolean;
    agent?: string;
    workspace?: string;
    appId?: string;
    appSecret?: string;
    tenant?: string;
    skipCheckLarkCli?: boolean;
  }) => {
    await runStart(opts);
  });

program
  .command('migrate')
  .description(h.migrate)
  .option('-c, --config <path>', h.optConfig)
  .option('--profile <name>', h.optMigrateProfile)
  .option('--agent <kind>', h.optMigrateAgent)
  .action(async (opts: { config?: string; profile?: string; agent?: string }) => {
    await runMigrate(opts);
  });

const profile = program
  .command('profile')
  .description(h.profile);

profile
  .command('list')
  .description(h.profileList)
  .action(async () => {
    await runProfileList();
  });

profile
  .command('create <name>')
  .description(h.profileCreate)
  .option('--agent <kind>', h.optAgentKind)
  .option('--workspace <path>', h.optWorkspaceProfile)
  .option('--app-id <id>', h.optAppId)
  .option('--app-secret <secret>', h.optAppSecret)
  .option('--tenant <tenant>', h.optTenant)
  .action(async (name: string, opts: {
    agent?: string;
    workspace?: string;
    appId?: string;
    appSecret?: string;
    tenant?: string;
  }) => {
    await runProfileCreate(name, opts);
  });

profile
  .command('use <name>')
  .description(h.profileUse)
  .action(async (name: string) => {
    await runProfileUse(name);
  });

profile
  .command('remove <name>')
  .description(h.profileRemove)
  .option('--purge', h.optPurge)
  .option('--yes', h.optYesDelete)
  .action(async (name: string, opts: { purge?: boolean; yes?: boolean }) => {
    await runProfileRemove(name, { purge: opts.purge, yes: opts.yes });
  });

profile
  .command('export <name>')
  .description(h.profileExport)
  .option('--output <path>', h.optOutput)
  .option('--force', h.optForce)
  .option('--include-secrets', h.optIncludeSecrets)
  .option('--yes', h.optYesSecrets)
  .action(async (name: string, opts: {
    output?: string;
    force?: boolean;
    includeSecrets?: boolean;
    yes?: boolean;
  }) => {
    await runProfileExport(name, {
      output: opts.output,
      force: opts.force,
      includeSecrets: opts.includeSecrets,
      yes: opts.yes,
    });
  });

program
  .command('ui')
  .description(h.ui)
  .option('--profile <name>', h.optProfileDefault)
  .option('--print', h.optPrint)
  .action(async (opts: { profile?: string; print?: boolean }) => {
    await runUi(opts);
  });

program
  .command('ps')
  .description(h.ps)
  .action(() => {
    runPs();
  });

program
  .command('kill <target>')
  .description(h.kill)
  .action(async (target: string) => {
    await runKillCli(target);
  });

program
  .command('send-card')
  .description(h.sendCard)
  .requiredOption('--chat-id <id>', h.optChatId)
  .requiredOption('--file <path>', h.optFile)
  .option('--operator <open_id>', h.optOperator, '*')
  .option('--ttl-minutes <minutes>', h.optTtl)
  .option('--reply-to <message_id>', h.optReplyTo)
  .option(
    '--thread-id <thread_id>',
    h.optThreadId,
  )
  .option('--dry-run', h.optDryRun)
  .option('-c, --config <path>', h.optConfig)
  .option('--profile <name>', h.optProfileDefault)
  .action(async (opts: {
    chatId: string;
    file: string;
    operator?: string;
    ttlMinutes?: string;
    replyTo?: string;
    threadId?: string;
    dryRun?: boolean;
    config?: string;
    profile?: string;
  }) => {
    await runSendCard(opts);
  });

// === service-level commands (OS-managed daemon: launchd/systemd/schtasks) ===

program
  .command('start')
  .description(h.start)
  .option('--profile <name>', h.optProfileDefault)
  .option('--web-ui', h.optStartWebUi)
  .option('--agent <kind>', h.optAgentBootstrap)
  .option('--workspace <path>', h.optWorkspaceBootstrap)
  .option('--app-id <id>', h.optAppId)
  .option('--app-secret <secret>', h.optAppSecret)
  .option('--tenant <tenant>', h.optTenant)
  .option('--skip-check-lark-cli', h.optSkipLarkCli)
  .action(async (opts: {
    profile?: string;
    webUi?: boolean;
    agent?: string;
    workspace?: string;
    appId?: string;
    appSecret?: string;
    tenant?: string;
    skipCheckLarkCli?: boolean;
  }) => {
    await runServiceStart(opts);
  });

program
  .command('stop')
  .description(h.stop)
  .option('--profile <name>', h.optProfileDefault)
  .option('--web-ui', h.optStopWebUi)
  .action(async (opts: { profile?: string; webUi?: boolean }) => {
    await runServiceStop({ profile: opts.profile, webUi: opts.webUi });
  });

program
  .command('restart')
  .description(h.restart)
  .option('--profile <name>', h.optProfileDefault)
  .option('--web-ui', h.optTargetSupervisor)
  .action(async (opts: { profile?: string; webUi?: boolean }) => {
    await runServiceRestart({ profile: opts.profile, webUi: opts.webUi });
  });

program
  .command('status')
  .description(h.status)
  .option('--profile <name>', h.optProfileDefault)
  .option('--web-ui', h.optTargetSupervisor)
  .action(async (opts: { profile?: string; webUi?: boolean }) => {
    await runServiceStatus({ profile: opts.profile, webUi: opts.webUi });
  });

program
  .command('unregister')
  .description(h.unregister)
  .option('--profile <name>', h.optProfileDefault)
  .option('--web-ui', h.optTargetSupervisor)
  .action(async (opts: { profile?: string; webUi?: boolean }) => {
    await runServiceUnregister({ profile: opts.profile, webUi: opts.webUi });
  });

const secrets = program
  .command('secrets')
  .description(h.secrets);

secrets
  .command('get')
  .description(h.secretsGet)
  .action(async () => {
    await runSecretsGet();
  });

secrets
  .command('set')
  .description(h.secretsSet)
  .requiredOption('--app-id <id>', h.optSecretsAppId)
  .option('--profile <name>', h.optProfileDefault)
  .action(async (opts: { appId: string; profile?: string }) => {
    await runSecretsSet(opts.appId, { profile: opts.profile });
  });

secrets
  .command('list')
  .description(h.secretsList)
  .option('--profile <name>', h.optProfileDefault)
  .action(async (opts: { profile?: string }) => {
    await runSecretsList({ profile: opts.profile });
  });

secrets
  .command('remove')
  .description(h.secretsRemove)
  .requiredOption('--app-id <id>', h.optSecretsRemoveAppId)
  .option('--profile <name>', h.optProfileDefault)
  .action(async (opts: { appId: string; profile?: string }) => {
    await runSecretsRemove(opts.appId, { profile: opts.profile });
  });

const skills = program.command('skills').description(h.skills);

skills
  .command('install')
  .description(h.skillsInstall)
  .option('--agent <kind>', h.optSkillsAgent)
  .option('--dest <dir>', h.optSkillsDest)
  .option('--force', h.optSkillsForce)
  .action(async (opts: { agent?: string; dest?: string; force?: boolean }) => {
    await runSkillsInstall(opts);
  });

program.parseAsync(process.argv).catch((err: unknown) => {
  const diagnostic = getAgentPreflightDiagnostic(err);
  if (diagnostic) {
    console.error(formatAgentPreflightDiagnostic(diagnostic));
    process.exit(1);
  }
  if (err instanceof Error) {
    if (err.name === 'UserCancelledError') {
      console.log(err.message);
      process.exit(0);
    }
    console.error(`${h.errorPrefix} ${err.message}`);
  } else {
    console.error(err);
  }
  process.exit(1);
});
