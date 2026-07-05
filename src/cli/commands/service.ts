import { isComplete } from '../../config/schema';
import { msgs } from '../../i18n';
import { createInterface } from 'node:readline';
import { paths } from '../../config/paths';
import { loadRootConfig, readActiveProfile } from '../../config/profile-store';
import { daemonStderrPath, daemonStdoutPath } from '../../daemon/paths';
import {
  getServiceAdapter,
  type ServiceAdapter,
  type ServiceResultLike,
} from '../../daemon/service-adapter';
import {
  materializeEnvSecretForService,
  resolveProfileRuntime,
} from '../../runtime/profile-runtime';
import { readAndPrune, type ProcessEntry } from '../../runtime/registry';
import { checkRuntimeLock, type RuntimeLockMeta } from '../../runtime/locks';
import { preFlightChecks } from '../preflight';
import { promptAndStopActiveBridgeMigrationConflict } from './migrate';
import { stopProcessEntry, type StopProcessEntryResult } from './ps';

export interface ServiceStartOptions {
  profile?: string;
  agent?: string;
  workspace?: string;
  appId?: string;
  appSecret?: string;
  tenant?: string;
  /** Skip lark-cli auto-install + bind during `start`. */
  skipCheckLarkCli?: boolean;
  confirmStopRuntimeLockProcess?: (meta: RuntimeLockMeta) => boolean | Promise<boolean>;
  stopRuntimeLockProcess?: (meta: RuntimeLockMeta) => StopProcessEntryResult | Promise<StopProcessEntryResult>;
}

export interface ServiceProfileOptions {
  profile?: string;
}

/**
 * Resolve the adapter for the current platform, or exit with a helpful
 * message. All service-level commands gate on this.
 */
function requireAdapter(cmdName: string, profile: string): ServiceAdapter {
  const adapter = getServiceAdapter(profile);
  if (!adapter) {
    const m = msgs();
    console.error(m.cli.serviceUnsupportedPlatform(cmdName));
    console.error(m.cli.serviceSupportedPlatforms);
    process.exit(1);
  }
  return adapter;
}

/**
 * Strip the misleading "Try re-running the command as root for richer
 * errors" line that launchctl always appends — it's incorrect for our
 * per-user LaunchAgents domain. Running as root targets a different
 * domain (system-wide) and won't even see our plist.
 */
function formatServiceStderr(stderr: string): string {
  return stderr
    .split('\n')
    .filter((line) => !/re-running the command as root/i.test(line))
    .join('\n')
    .trim();
}

/**
 * Map common failure patterns to Chinese-language hints. Falls through
 * to the raw stderr (with platform-specific noise stripped) so power
 * users can still see the underlying problem.
 */
function printServiceFailure(verb: 'started' | 'restarted', stderr: string): void {
  const m = msgs();
  const cleaned = formatServiceStderr(stderr);
  const action = verb === 'started' ? m.cli.serviceVerbStart : m.cli.serviceVerbRestart;

  if (/bootstrap failed.*input\/output error/i.test(cleaned)) {
    console.error(m.cli.serviceActionFailed(action));
    console.error('');
    console.error(m.cli.serviceFailureCommonCause);
    console.error(m.cli.serviceFailureRetryHint);
    console.error(m.cli.serviceFailureCleanRegistrationHint);
    console.error('       unregister');
    console.error('       start');
    console.error('');
    console.error(m.cli.serviceFailureRawErrorLabel);
    console.error(`  ${cleaned}`);
    return;
  }

  console.error(m.cli.serviceActionFailedWithOutput(action));
  console.error(cleaned);
}

async function ensureBridgeConfigured(
  opts: ServiceStartOptions,
): Promise<
  Pick<Awaited<ReturnType<typeof resolveProfileRuntime>>, 'profile' | 'cfg' | 'profileConfig' | 'appPaths' | 'configPath'>
> {
  const { cfg, profile, profileConfig, appPaths, configPath } = await resolveProfileRuntime({
    profile: opts.profile,
    agent: opts.agent,
    workspace: opts.workspace,
    appId: opts.appId,
    appSecret: opts.appSecret,
    tenant: opts.tenant,
    allowBootstrap: true,
    handleActiveBridgeMigrationConflict: async (err) => {
      const handled = await promptAndStopActiveBridgeMigrationConflict(err, {
        cancelMessage: msgs().cli.startCancelled,
      });
      if (!handled) process.exit(0);
      return true;
    },
  });
  if (!isComplete(cfg)) {
    const m = msgs();
    console.error(m.cli.serviceNotConfigured);
    console.error(m.cli.serviceNotConfiguredHint);
    process.exit(1);
  }
  return { profile, cfg, profileConfig, appPaths, configPath };
}

async function assertLockNotHeldByAnotherRuntime(
  kind: 'profile' | 'app',
  target: string,
  adapter: ServiceAdapter,
  opts: Pick<ServiceStartOptions, 'confirmStopRuntimeLockProcess' | 'stopRuntimeLockProcess'> = {},
): Promise<void> {
  for (;;) {
    const lock = await checkRuntimeLock(target);
    if (!lock.locked) return;

    const servicePid = adapter.isRunning() ? adapter.parseStatus(adapter.describeStatus()).pid : undefined;
    if (servicePid && lock.meta?.pid === Number(servicePid)) return;

    const m = msgs();
    console.error(m.cli.lockHeldByOther(kind));
    if (!lock.meta) {
      console.error(`  lock: ${target}`);
      console.error(m.cli.lockStopHolderFirst);
      process.exit(1);
    }
    const app = lock.meta.appId ? ` app=${lock.meta.appId}` : '';
    console.error(
      `  holder: profile=${lock.meta.profile}${app} agent=${lock.meta.agentKind} pid=${lock.meta.pid} startedAt=${lock.meta.startedAt}`,
    );

    if (!opts.confirmStopRuntimeLockProcess && (!process.stdin.isTTY || !process.stdout.isTTY)) {
      console.error(m.cli.lockNonInteractiveStopHint(kind));
      process.exit(1);
    }

    const confirmed = opts.confirmStopRuntimeLockProcess
      ? await opts.confirmStopRuntimeLockProcess(lock.meta)
      : await confirmStopRuntimeLockProcess();
    if (!confirmed) {
      console.log(m.cli.startCancelled);
      process.exit(0);
    }

    const result = opts.stopRuntimeLockProcess
      ? await opts.stopRuntimeLockProcess(lock.meta)
      : await stopProcessEntry({ pid: lock.meta.pid });
    if (result === 'killed') {
      console.log(m.cli.forceStoppedPid(lock.meta.pid));
    } else {
      console.log(m.cli.stoppedPid(lock.meta.pid));
    }
  }
}

async function confirmStopRuntimeLockProcess(): Promise<boolean> {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  try {
    const answer = await new Promise<string>((resolve) =>
      rl.question(msgs().cli.confirmStopOldStartService, resolve),
    );
    const normalized = answer.trim().toLowerCase();
    return normalized === 'y' || normalized === 'yes';
  } finally {
    rl.close();
  }
}

/**
 * Poll `~/.lark-channel/processes.json` for a freshly-registered bridge
 * instance whose appId matches our config and whose `botName` is filled —
 * the latter only happens AFTER the WS handshake to Feishu succeeds, so
 * by the time we see it the daemon is genuinely online.
 *
 * `beforePids` is the set of pids already running before we kicked off
 * the start/restart; we exclude them so the previous daemon instance
 * (in restart scenarios, briefly) or a separate foreground `run` doesn't
 * get misreported as our newly-spawned one.
 */
async function waitForServiceConnect(
  appId: string,
  profile: string,
  beforePids: ReadonlySet<number>,
  timeoutMs = 30_000,
): Promise<ProcessEntry | undefined> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const live = readAndPrune();
    const fresh = live.find(
      (e) =>
        e.appId === appId &&
        e.profileName === profile &&
        !beforePids.has(e.pid) &&
        Boolean(e.botName),
    );
    if (fresh) return fresh;
    await new Promise((r) => setTimeout(r, 500));
  }
  return undefined;
}

/**
 * Snapshot current pids for this app + invoke the OS service action +
 * wait for a fresh registry entry, then print the same connection line
 * `run` uses. Used by both `start` and `restart`.
 */
async function reportConnectAfter(
  verb: 'started' | 'restarted',
  profile: string,
  fn: () => ServiceResultLike,
): Promise<void> {
  const { cfg } = await resolveProfileRuntime({ profile, allowBootstrap: false });
  const appId = cfg.accounts?.app?.id ?? '';
  const beforePids = new Set(
    readAndPrune()
      .filter((e) => e.appId === appId && e.profileName === profile)
      .map((e) => e.pid),
  );

  const r = await fn();
  if (!r.ok) {
    printServiceFailure(verb, r.stderr);
    process.exit(1);
  }

  const m = msgs();
  const action = verb === 'started' ? m.cli.waitingForConnect : m.cli.waitingForReconnect;
  console.log(action);

  const entry = await waitForServiceConnect(appId, profile, beforePids);
  if (entry) {
    const verbZh = verb === 'started' ? m.cli.serviceVerbStarted : m.cli.serviceVerbRestarted;
    const agent = agentDisplay(entry.agentKind);
    console.log(
      m.cli.serviceConnected({
        verb: verbZh,
        botName: entry.botName,
        appId: entry.appId,
        agentName: agent.displayName,
        agentId: agent.id,
        procId: entry.id,
      }),
    );
    return;
  }
  console.warn(m.cli.serviceConnectTimeout(verb));
  console.warn(m.cli.serviceViewLogs(daemonStderrPath(profile)));
  console.warn(`              tail -f ${daemonStdoutPath(profile)}`);
}

/**
 * `bridge start` — install (write file + reload) then start.
 *
 * Always re-installs so that `process.execPath` (current node binary)
 * and `process.env.PATH` reflect the user's current shell — important if
 * they've switched runtime versions or updated their PATH since last install.
 */
export async function runServiceStart(opts: ServiceStartOptions = {}): Promise<void> {
  const { profile, cfg, profileConfig, appPaths, configPath } = await ensureBridgeConfigured(opts);
  const adapter = requireAdapter('start', profile);
  await assertLockNotHeldByAnotherRuntime('profile', appPaths.profileLockFile, adapter, opts);
  await assertLockNotHeldByAnotherRuntime('app', appPaths.appLockFile(cfg.accounts.app.id), adapter, opts);
  const materializedEnvSecret = await materializeEnvSecretForService({ profile });
  const bridgeConfig = materializedEnvSecret
    ? (await resolveProfileRuntime({ profile, allowBootstrap: false })).cfg
    : cfg;
  // Run the same lark-cli check as `bridge run` BEFORE writing the
  // service file — the user is in a TTY here and can answer the install
  // prompt. The daemon's own preflight (when launchd / systemd spawns
  // it) will be non-TTY and would silently skip the install.
  await preFlightChecks({
    skipCheckLarkCli: opts.skipCheckLarkCli,
    bridgeConfig,
    profileConfig,
    appPaths,
    larkChannel: {
      profile: appPaths.profile,
      rootDir: appPaths.rootDir,
      configPath,
      larkCliConfigDir: appPaths.larkCliConfigDir,
      larkCliSourceConfigFile: appPaths.larkCliSourceConfigFile,
    },
  });

  await adapter.install();

  // If already running, stop first so start operations don't race.
  if (adapter.isRunning()) {
    const m = msgs();
    console.log(m.cli.serviceOldInstanceRestart);
    const r = await adapter.stop();
    if (!r.ok) {
      console.warn(m.cli.serviceStopOldWarning(formatServiceStderr(r.stderr)));
    }
    // Stop is async at the OS level (especially launchd) — wait until it
    // really takes effect before start, otherwise some platforms refuse.
    const ok = await adapter.waitUntilStopped();
    if (!ok) {
      console.error(m.cli.serviceOldInstanceStuck);
      console.error(m.cli.serviceUnregisterHint);
      console.error(m.cli.serviceStartAgainHint);
      process.exit(1);
    }
  }

  await reportConnectAfter('started', profile, adapter.start);
}

/**
 * `bridge stop` — stop AND prevent auto-restart on next boot.
 *
 * Uses stopAndDisableAutostart so the semantics match on both platforms:
 *  - launchd: bootout (removes from launchd; KeepAlive / RunAtLoad off)
 *  - systemd: `disable --now` (stop + remove autostart symlinks)
 *
 * If the user just wants to bounce the service (keep autostart),
 * `restart` is the right command.
 */
export async function runServiceStop(opts: ServiceProfileOptions = {}): Promise<void> {
  const profile = await resolveServiceProfile(opts.profile);
  const adapter = requireAdapter('stop', profile);
  const m = msgs();
  if (!adapter.fileExists()) {
    console.log(m.cli.serviceNeverRanNoStop);
    return;
  }
  if (!adapter.isRunning()) {
    console.log(m.cli.serviceNotRunning);
    return;
  }

  // Snapshot bot info BEFORE stop so the success message can name
  // exactly which bot got stopped. Reading after would race the
  // unregisterSync the daemon fires on shutdown.
  const runtime = await maybeResolveProfileRuntime(profile);
  const appId = runtime?.cfg.accounts?.app?.id;
  const entry = appId
    ? readAndPrune().find((e) => e.appId === appId && e.profileName === profile && Boolean(e.botName))
    : undefined;

  const r = await adapter.stopAndDisableAutostart();
  if (!r.ok) {
    console.error(m.cli.serviceStopFailed(formatServiceStderr(r.stderr)));
    process.exit(1);
  }
  if (entry) {
    console.log(m.cli.serviceBotStoppedNamed(entry.botName, entry.appId));
  } else {
    console.log(m.cli.serviceBotStopped);
  }
  console.log(m.cli.serviceRestartHint);
}

/**
 * `bridge restart` — bounce the running daemon in place.
 *
 * If the service is not running (stopped or never started), behaves like
 * `start` and goes through the full install + start path.
 */
export async function runServiceRestart(opts: ServiceProfileOptions = {}): Promise<void> {
  const profile = await resolveServiceProfile(opts.profile);
  const adapter = requireAdapter('restart', profile);
  if (!adapter.fileExists()) {
    console.error(msgs().cli.serviceNeverRanRestart);
    process.exit(1);
  }
  if (adapter.isRunning()) {
    await reportConnectAfter('restarted', profile, adapter.restart);
    return;
  }
  await reportConnectAfter('started', profile, adapter.start);
}

/** `bridge status` — report whether the daemon is running, with pid + log paths. */
export async function runServiceStatus(opts: ServiceProfileOptions = {}): Promise<void> {
  const profile = await resolveServiceProfile(opts.profile);
  const adapter = requireAdapter('status', profile);
  const m = msgs();
  if (!adapter.fileExists()) {
    console.log(m.cli.statusNeverStarted);
    console.log(m.cli.statusStartHint);
    return;
  }
  if (!adapter.isRunning()) {
    console.log(m.cli.statusNotRunning);
    console.log(m.cli.statusRestartHint);
    return;
  }

  const runtime = await maybeResolveProfileRuntime(profile);
  const appId = runtime?.cfg.accounts?.app?.id;
  const entry = appId
    ? readAndPrune().find((e) => e.appId === appId && e.profileName === profile && Boolean(e.botName))
    : undefined;

  const { pid, lastExit } = adapter.parseStatus(adapter.describeStatus());

  if (entry) {
    console.log(m.cli.statusRunningNamed(entry.botName, entry.appId));
  } else {
    console.log(m.cli.statusRunning);
  }
  if (pid) console.log(m.cli.statusPid(pid));
  console.log(m.cli.statusLogsLabel);
  console.log(`    ${daemonStdoutPath(profile)}`);
  console.log(`    ${daemonStderrPath(profile)}`);
  // -1 is launchd's "no meaningful exit recorded" marker; hide it.
  if (lastExit && lastExit !== '-1') console.log(m.cli.statusLastExit(lastExit));
}

/**
 * `bridge unregister` — stop, disable autostart, and remove the service
 * definition file.
 *
 * Idempotent. Leaves ~/.lark-channel/ state untouched (keystore, sessions,
 * logs etc) — that's the user's data, not service-manager hooks.
 */
export async function runServiceUnregister(opts: ServiceProfileOptions = {}): Promise<void> {
  const profile = await resolveServiceProfile(opts.profile);
  const adapter = requireAdapter('unregister', profile);
  const m = msgs();
  if (!adapter.fileExists()) {
    console.log(m.cli.serviceNeverRanNoCleanup);
    return;
  }
  if (adapter.isRunning()) {
    const r = await adapter.stopAndDisableAutostart();
    if (!r.ok) {
      console.warn(m.cli.serviceStopWarnCleanup(formatServiceStderr(r.stderr)));
    } else {
      console.log(m.cli.serviceBotStoppedShort);
    }
  }
  await adapter.deleteFile();
  console.log(m.cli.serviceUnregistered);
  console.log(m.cli.serviceUnregisteredKeep(paths.rootDir));
}

async function resolveServiceProfile(explicitProfile: string | undefined): Promise<string> {
  if (explicitProfile) return explicitProfile;
  const root = await loadRootConfig(paths.configFile);
  const profile = (await readActiveProfile(paths.rootDir)) ?? root?.activeProfile;
  if (!profile) {
    throw new Error('active profile is required for service command; pass --profile <name>');
  }
  if (root && !root.profiles[profile]) throw new Error(`profile not found: ${profile}`);
  return profile;
}

async function maybeResolveProfileRuntime(
  profile: string,
): Promise<Awaited<ReturnType<typeof resolveProfileRuntime>> | undefined> {
  try {
    return await resolveProfileRuntime({ profile, allowBootstrap: false });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (/profile not found|config not initialized|active profile is required/i.test(message)) {
      return undefined;
    }
    throw err;
  }
}

function agentDisplay(agentKind: ProcessEntry['agentKind']): { id: string; displayName: string } {
  return agentKind === 'codex'
    ? { id: 'codex', displayName: 'Codex CLI' }
    : { id: 'claude', displayName: 'Claude Code' };
}
