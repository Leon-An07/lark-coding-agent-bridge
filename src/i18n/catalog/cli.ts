/** cli namespace — zh-CN is the source of truth; the En object's
 * `typeof` annotation turns any missing translation into a compile error.
 * Filled by the i18n migration; keys are camelCase, parameterized entries
 * are arrow functions so params are type-checked. */

export const cliZh = {
  // ── shared across CLI commands ──
  startCancelled: '已取消启动。',
  forceStoppedPid: (pid: number) => `✓ 已强制停止 pid ${pid}`,
  stoppedPid: (pid: number) => `✓ 已停止 pid ${pid}`,
  lockHeldByOther: (kind: 'profile' | 'app') => `✗ 当前 ${kind} 已有 bridge 进程占用。`,
  enterAppSecretPrompt: (appId: string) => `输入 ${appId} 的 App Secret: `,

  // ── service (start/stop/restart/status/unregister) ──
  serviceUnsupportedPlatform: (cmdName: string) => `${cmdName}: 当前系统不支持后台运行。`,
  serviceSupportedPlatforms: '  目前支持: macOS (launchd) / Linux (systemd) / Windows (Task Scheduler)',
  serviceVerbStart: '启动',
  serviceVerbRestart: '重启',
  serviceActionFailed: (action: string) => `✗ bot ${action}失败。`,
  serviceActionFailedWithOutput: (action: string) => `✗ bot ${action}失败:`,
  serviceFailureCommonCause: '最常见原因:旧的 bot 实例还在收尾。请试以下任一种:',
  serviceFailureRetryHint: '  1. 稍等几秒,重新运行 `start`',
  serviceFailureCleanRegistrationHint: '  2. 或彻底清除注册再启动:',
  serviceFailureRawErrorLabel: '原始错误:',
  serviceNotConfigured: 'bot 还没配置 app 凭据。',
  serviceNotConfiguredHint: '请重新运行 `start` 完成首次扫码向导或传入已有应用信息。',
  lockStopHolderFirst: '  请先停止正在运行的占用进程，再执行 start。',
  lockNonInteractiveStopHint: (kind: 'profile' | 'app') =>
    `  非交互模式无法确认停止 ${kind} 占用进程。` +
    '请先用 `lark-channel-bridge ps` 查看并用 `lark-channel-bridge kill <bot id>` 停止后重试。',
  confirmStopOldStartService: '是否停止旧进程并继续启动后台服务? [y/N]: ',
  waitingForConnect: '正在等待 bot 连接...',
  waitingForReconnect: '正在等待 bot 重新连接...',
  serviceVerbStarted: '已启动',
  serviceVerbRestarted: '已重启',
  serviceConnected: (p: {
    verb: string;
    botName: string | undefined;
    appId: string;
    agentName: string;
    agentId: string;
    procId: string;
  }) =>
    `✓ ${p.verb}  bot: ${p.botName} (${p.appId})  agent: ${p.agentName} (${p.agentId})  进程: ${p.procId}`,
  serviceConnectTimeout: (verb: string) => `⚠ 已下发指令,但 30 秒内未观察到 bot 连接成功 (${verb})。`,
  serviceViewLogs: (path: string) => `  查看日志: tail -f ${path}`,
  serviceOldInstanceRestart: '检测到旧 bot 实例,先停掉再重启...',
  serviceStopOldWarning: (stderr: string) => `⚠ 停止旧实例时有警告(继续重启):\n${stderr}`,
  serviceOldInstanceStuck: '✗ 旧 bot 实例没有完全停止。请稍后重试,或:',
  serviceUnregisterHint: '  unregister  # 强制清除注册',
  serviceStartAgainHint: '  start       # 再次启动',
  serviceNeverRanNoStop: 'bot 还没在后台运行过,无需停止。',
  serviceNotRunning: 'bot 当前没在后台运行。',
  serviceStopFailed: (stderr: string) => `✗ 停止失败:\n${stderr}`,
  serviceBotStoppedNamed: (botName: string | undefined, appId: string) =>
    `✓ bot ${botName} (${appId}) 已停止运行`,
  serviceBotStopped: '✓ bot 已停止运行',
  serviceRestartHint: '  通过 `start` 可再次重启',
  serviceNeverRanRestart: 'bot 还没在后台运行过。请先运行 `start` 启动。',
  statusNeverStarted: 'bot 当前没在后台运行(从未启动过)',
  statusStartHint: '  通过 `start` 启动 bot',
  statusNotRunning: 'bot 当前没在后台运行',
  statusRestartHint: '  通过 `start` 重新启动',
  statusRunningNamed: (botName: string | undefined, appId: string) =>
    `✓ bot ${botName} (${appId}) 正在后台运行`,
  statusRunning: '✓ bot 正在后台运行',
  statusPid: (pid: string) => `  进程 ID: ${pid}`,
  statusLogsLabel: '  日志:',
  statusLastExit: (code: string) => `  上次退出码: ${code}`,
  serviceNeverRanNoCleanup: 'bot 还没在后台运行过,无需清理。',
  serviceStopWarnCleanup: (stderr: string) => `⚠ 停止 bot 时有警告(继续清理):\n${stderr}`,
  serviceBotStoppedShort: '✓ 已停止 bot',
  serviceUnregistered: '✓ 已清除后台运行注册',
  serviceUnregisteredKeep: (dir: string) => `  (配置 / 日志 / 会话保留在 ${dir})`,

  // ── start (foreground run) ──
  shutdownSignal: (sig: string) => `\n收到 ${sig}，正在关闭...`,
  reconnectedNewCreds: '✓ 已用新凭据重连',
  conflictDetected: (count: number) => `⚠️  检测到这个飞书应用已经有 ${count} 个 bot 正在运行:`,
  conflictEntry: (label: string, procId: string, ago: string) =>
    `   - ${label},进程 ${procId},${ago}启动`,
  conflictNonInteractive:
    '⚠️  当前不是交互式启动,已自动取消。如需替换,先用 `kill <bot id>` 关掉旧的。\n',
  confirmKillConflicts: (count: number): string =>
    count > 1 ? `继续启动会先关掉它们,是否继续? [y/N]: ` : `继续启动会先关掉那个,是否继续? [y/N]: `,
  killedConflict: (id: string) => `✓ 已关掉 bot ${id}`,
  killConflictFailed: (id: string, message: string) => `✗ 关掉 bot ${id} 失败:${message}`,
  confirmStopOldRestart: '是否停止旧进程并重新启动? [y/N]: ',
  lockNonInteractiveStopError: (kind: 'profile' | 'app') =>
    `当前 ${kind} 已有 bridge 进程占用；` +
    '非交互模式无法确认停止，请先用 `lark-channel-bridge ps` 查看并用 `lark-channel-bridge kill <bot id>` 停止后重试',
  agoSeconds: (n: number) => `${n} 秒前`,
  agoMinutes: (n: number) => `${n} 分钟前`,
  agoHours: (n: number) => `${n} 小时前`,
  agoDays: (n: number) => `${n} 天前`,

  // ── migrate ──
  migrateProfileUpgraded: (profile: string) => `✓ 已升级 profile 目录结构：${profile}`,
  migrateProfileUpToDate: (profile: string) => `✓ profile 目录结构已是最新：${profile}`,
  migrateCancelled: '已取消迁移。',
  migrateBridgeRunning: '检测到 bridge 正在运行，迁移需要先停止这些进程:',
  migrateNonInteractiveError: '检测到 bridge 正在运行；非交互模式无法确认停止，请先停止后重试迁移',
  migrateConfirmStop: '是否停止这些进程并继续迁移? [y/N]: ',
  migrateStoppingProcess: (desc: string) => `正在停止 ${desc}...`,
  migrateConfigMissing: '  config.json 不存在，跳过结构迁移',
  migrateConfigInvalidJson: (path: string) => `✗ config 不是合法 JSON (${path}):`,
  migrateConfigAlreadyV2: (path: string) => `✓ config 结构已是 profile v2 格式：${path}`,
  migrateConfigAlreadyNew: (path: string) => `✓ config 结构已是新格式：${path}`,
  migrateConfigUpgraded: (path: string) => `✓ 已升级 config 结构：${path}`,
  migrateConfigUnrecognized: (path: string) => `✗ 无法识别的 config 格式：${path}`,
  migrateConfigExpectedShape: '  期望 { app: { id, secret, tenant } } 或 { accounts: { app: ... } }',
  migrateMovedConfig: (from: string, to: string) => `✓ 已搬迁配置：${from} → ${to}`,
  migrateMovedCache: (from: string, to: string) => `✓ 已搬迁缓存：${from} → ${to}`,
  migrateSkipExisting: (name: string) => `  · 跳过 ${name}（目标已存在）`,

  // ── ps / kill ──
  psNoneRunning: '当前没有 bot 在运行。',
  psRunningCount: (n: number) => `# 当前共 ${n} 个 bot 在运行\n`,
  psHeaderStarted: '启动',
  psHeaderVersion: '版本',
  killUsage: '用法: lark-channel-bridge kill <bot id 或序号>',
  killNotFound: (target: string) => `✗ 没找到匹配的 bot:${target}`,
  killSeeTargets: '  用 `lark-channel-bridge ps` 看可选目标。',
  killClosing: (id: string) => `正在关闭 bot ${id}…`,
  killFailed: (message: string) => `✗ 关闭失败:${message}`,
  killForceClosed: (id: string) => `✓ 已强制关闭 bot ${id}。`,
  killClosed: (id: string) => `✓ 已关闭 bot ${id}。`,
  psAgoSeconds: (n: number) => `${n}s 前`,
  psAgoMinutes: (n: number) => `${n}m 前`,
  psAgoHours: (n: number) => `${n}h 前`,
  psAgoDays: (n: number) => `${n}d 前`,

  // ── secrets ──
  secretsSetUsage: '用法: lark-channel-bridge secrets set --app-id <id>',
  secretsCancelledEmpty: '✗ 取消(secret 为空)',
  secretsSavedEncrypted: '✓ 已加密存到 ~/.lark-channel/secrets.enc',
  secretsNoneStored: '当前没有加密存储的 secret。',
  secretsCount: (n: number) => `# 当前共 ${n} 个 secret 在加密存储里\n`,
  secretsRemoveUsage: '用法: lark-channel-bridge secrets remove --app-id <id>',
  secretsNotFound: (id: string) => `✗ 没找到 secret: ${id}`,
  secretsRemoved: (id: string) => `✓ 已删除 ${id}`,

  // ── profile ──
  profileNone: '暂无 profile。',
  profileCreated: (name: string) => `已创建 profile: ${name}`,
  profileSwitched: (name: string) => `已切换到 profile: ${name}`,
  profilePurged: (name: string) => `已永久删除 profile: ${name}`,
  profileArchived: (name: string, archivedTo: string | undefined) =>
    `已归档 profile: ${name} -> ${archivedTo}`,
  profileExported: (name: string, output: string) => `已导出 profile: ${name} -> ${output}`,

  // ── registration wizard ──
  wizardIntro: '\n未检测到飞书应用配置，进入扫码创建向导。\n',
  wizardScanQr: '请用飞书 App 扫描以下二维码完成应用创建：\n',
  wizardQrExpiry: (mins: number) => `\n二维码有效期：约 ${mins} 分钟`,
  wizardOpenInBrowser: (url: string) => `也可以直接在浏览器打开：${url}\n`,
  wizardDomainSwitched: '识别到国际版租户，已切换到 larksuite.com 域名。',
  wizardSlowDown: '轮询速度过快，已自动降速。',
  wizardAppCreated: '\n✓ 应用创建成功',
  wizardCreatorExempt: (openId: string) => `  Creator: ${openId} (Lark 应用 owner，自动豁免访问控制)`,
  wizardNoOpenIdOwnerApi: '  ⚠️ 未拿到扫码用户的 open_id；启动后会通过应用 owner API 解析创建者。',
  wizardCreatorExemptAll: (openId: string) =>
    `  Creator: ${openId} (Lark 应用 owner，自动豁免所有访问控制)`,
  wizardNoOpenIdOwnerApiV6:
    '  ⚠️ 未拿到扫码用户的 open_id；首次启动时 bridge 会自行调 application/v6 API 解析当前 owner。',

  // ── profile runtime bootstrap ──
  configSaved: (path: string) => `配置已保存到 ${path}\n`,
  bootstrapNoConfigNonInteractive:
    '当前没有配置，非交互模式无法完成扫码创建应用。' +
    '请先在终端运行 `lark-channel-bridge run` 完成首次初始化，' +
    '或传入 --app-id 和 --app-secret。',
  bootstrapMissingSecretNonInteractive: (appId: string) =>
    `非交互模式缺少 App Secret: ${appId}。` +
    '请传入 --app-secret <secret>，或在终端中重新运行命令后按提示输入。',
  credentialsValidatedNamed: (botName: string) => `✓ 应用凭证校验通过: ${botName}`,
  credentialsValidated: '✓ 应用凭证校验通过',
  ambiguousAgentsHeader: '检测到多个本地 agent，请使用 --agent <claude|codex> 指定要初始化哪一个。',
  ambiguousAgentsDetectedLabel: '已检测到：',
  selectAgentIntro: '选择本地 agent',
  selectAgentMessage: '检测到多个本地 agent，本次要初始化哪一个？',
  agentSelectionCancelled: '已取消 agent 选择。',
  agentSelected: (name: string) => `已选择 ${name}`,
  secretMigratedToKeystore: '🔒 已把 App Secret 加密迁移到 ~/.lark-channel/secrets.enc',
  secretsProviderWrapperMigrated: '🔒 已把 secrets provider 切到 wrapper 形态',

  // ── agent preflight diagnostics ──
  preflightBinaryNotFound: (agentName: string, code: string) =>
    [
      `✗ 未找到本地 ${agentName}。`,
      '',
      `请先安装 ${agentName}，或配置正确的可执行文件路径。`,
      `错误码：${code}`,
    ].join('\n'),
  preflightBinaryNotExecutable: (agentName: string, code: string) =>
    [
      `✗ 本地 ${agentName} 不可执行。`,
      '',
      `请检查可执行权限，或重新安装 ${agentName}。`,
      `错误码：${code}`,
    ].join('\n'),
  preflightBinaryResolveFailed: (agentName: string, code: string) =>
    [
      `✗ 本地 ${agentName} 路径解析失败。`,
      '',
      '请确认当前配置的可执行文件路径有效后，再重新运行 bridge。',
      `错误码：${code}`,
    ].join('\n'),
  preflightBinaryNotReadable: (agentName: string, code: string) =>
    [
      `✗ 本地 ${agentName} 二进制不可读取。`,
      '',
      `请检查文件权限，或重新安装 ${agentName}。`,
      `错误码：${code}`,
    ].join('\n'),
  preflightSpawnFailed: (agentName: string, command: string, code: string) =>
    [
      `✗ 本地 ${agentName} 不可用：无法执行 \`${command}\`。`,
      '',
      '请先在终端运行同一命令并修复报错。',
      `错误码：${code}`,
    ].join('\n'),
  preflightTimeout: (agentName: string, command: string, code: string) =>
    [
      `✗ 本地 ${agentName} 不可用：\`${command}\` 超时未返回。`,
      '',
      '请先确认该命令能正常结束。',
      `错误码：${code}`,
    ].join('\n'),
  preflightSignaled: (agentName: string, command: string, signal: string, code: string) =>
    [
      `✗ 本地 ${agentName} 不可用：执行 \`${command}\` 时被系统终止（${signal}）。`,
      '',
      '请先在终端确认：',
      `  ${command}`,
      '',
      `修复本地 ${agentName} 后，再重新运行 bridge。`,
      `错误码：${code}`,
    ].join('\n'),
  preflightNonzeroExit: (agentName: string, command: string, exitCode: string | number, code: string) =>
    [
      `✗ 本地 ${agentName} 不可用：\`${command}\` 退出码为 ${exitCode}。`,
      '',
      '请先在终端运行同一命令并修复报错。',
      `错误码：${code}`,
    ].join('\n'),
  preflightEmptyOutput: (agentName: string, command: string, code: string) =>
    [
      `✗ 本地 ${agentName} 不可用：\`${command}\` 没有返回版本信息。`,
      '',
      `请确认安装的是受支持的 ${agentName}。`,
      `错误码：${code}`,
    ].join('\n'),

  // ── daemon banner (logger stdout) ──
  wsConnected: (bot: string, appIdSuffix: string, agent: string, procSuffix: string) =>
    `✓ 已连接  bot: ${bot}${appIdSuffix}  agent: ${agent}${procSuffix}`,
  wsConnectedProc: (procId: string) => `  进程: ${procId}`,
  wsReconnecting: '↻ 正在重连…',
  wsReconnected: '✓ 已重连',
  wsError: (err: string) => `✗ WS 错误: ${err}`,

  // ── feishu auth validation ──
  networkError: (message: string) => `网络错误：${message}`,
  invalidJsonResponse: '响应不是合法 JSON',

  // ── codex session history ──
  emptySessionPreview: '(空会话)',
};

export const cliEn: typeof cliZh = {
  // ── shared across CLI commands ──
  startCancelled: 'Start cancelled.',
  forceStoppedPid: (pid: number) => `✓ Force-stopped pid ${pid}`,
  stoppedPid: (pid: number) => `✓ Stopped pid ${pid}`,
  lockHeldByOther: (kind: 'profile' | 'app') =>
    `✗ This ${kind} is already held by another bridge process.`,
  enterAppSecretPrompt: (appId: string) => `Enter App Secret for ${appId}: `,

  // ── service (start/stop/restart/status/unregister) ──
  serviceUnsupportedPlatform: (cmdName: string) =>
    `${cmdName}: background service is not supported on this OS.`,
  serviceSupportedPlatforms: '  Supported: macOS (launchd) / Linux (systemd) / Windows (Task Scheduler)',
  serviceVerbStart: 'start',
  serviceVerbRestart: 'restart',
  serviceActionFailed: (action: string) => `✗ bot ${action} failed.`,
  serviceActionFailedWithOutput: (action: string) => `✗ bot ${action} failed:`,
  serviceFailureCommonCause:
    'Most common cause: the old bot instance is still shutting down. Try either of:',
  serviceFailureRetryHint: '  1. Wait a few seconds, then run `start` again',
  serviceFailureCleanRegistrationHint: '  2. Or fully clear the registration and start again:',
  serviceFailureRawErrorLabel: 'Original error:',
  serviceNotConfigured: 'The bot has no app credentials configured yet.',
  serviceNotConfiguredHint:
    'Run `start` again to finish the first-time QR wizard, or pass existing app credentials.',
  lockStopHolderFirst: '  Stop the running holder process first, then run start again.',
  lockNonInteractiveStopHint: (kind: 'profile' | 'app') =>
    `  Cannot confirm stopping the ${kind} holder in non-interactive mode. ` +
    'Use `lark-channel-bridge ps` to inspect and `lark-channel-bridge kill <bot id>` to stop it, then retry.',
  confirmStopOldStartService: 'Stop the old process and continue starting the service? [y/N]: ',
  waitingForConnect: 'Waiting for the bot to connect...',
  waitingForReconnect: 'Waiting for the bot to reconnect...',
  serviceVerbStarted: 'Started',
  serviceVerbRestarted: 'Restarted',
  serviceConnected: (p: {
    verb: string;
    botName: string | undefined;
    appId: string;
    agentName: string;
    agentId: string;
    procId: string;
  }) =>
    `✓ ${p.verb}  bot: ${p.botName} (${p.appId})  agent: ${p.agentName} (${p.agentId})  process: ${p.procId}`,
  serviceConnectTimeout: (verb: string) =>
    `⚠ Command issued, but the bot did not connect within 30 seconds (${verb}).`,
  serviceViewLogs: (path: string) => `  View logs: tail -f ${path}`,
  serviceOldInstanceRestart: 'Old bot instance detected; stopping it before restart...',
  serviceStopOldWarning: (stderr: string) =>
    `⚠ Warning while stopping the old instance (continuing restart):\n${stderr}`,
  serviceOldInstanceStuck: '✗ The old bot instance did not fully stop. Retry later, or:',
  serviceUnregisterHint: '  unregister  # force-clear the registration',
  serviceStartAgainHint: '  start       # start again',
  serviceNeverRanNoStop: 'The bot has never run in the background; nothing to stop.',
  serviceNotRunning: 'The bot is not running in the background.',
  serviceStopFailed: (stderr: string) => `✗ Stop failed:\n${stderr}`,
  serviceBotStoppedNamed: (botName: string | undefined, appId: string) =>
    `✓ bot ${botName} (${appId}) stopped`,
  serviceBotStopped: '✓ bot stopped',
  serviceRestartHint: '  Run `start` to start it again',
  serviceNeverRanRestart: 'The bot has never run in the background. Run `start` first.',
  statusNeverStarted: 'The bot is not running in the background (never started)',
  statusStartHint: '  Run `start` to start the bot',
  statusNotRunning: 'The bot is not running in the background',
  statusRestartHint: '  Run `start` to start it again',
  statusRunningNamed: (botName: string | undefined, appId: string) =>
    `✓ bot ${botName} (${appId}) is running in the background`,
  statusRunning: '✓ bot is running in the background',
  statusPid: (pid: string) => `  Process ID: ${pid}`,
  statusLogsLabel: '  Logs:',
  statusLastExit: (code: string) => `  Last exit code: ${code}`,
  serviceNeverRanNoCleanup: 'The bot has never run in the background; nothing to clean up.',
  serviceStopWarnCleanup: (stderr: string) =>
    `⚠ Warning while stopping the bot (continuing cleanup):\n${stderr}`,
  serviceBotStoppedShort: '✓ bot stopped',
  serviceUnregistered: '✓ Background service registration cleared',
  serviceUnregisteredKeep: (dir: string) => `  (config / logs / sessions are kept in ${dir})`,

  // ── start (foreground run) ──
  shutdownSignal: (sig: string) => `\nReceived ${sig}, shutting down...`,
  reconnectedNewCreds: '✓ Reconnected with new credentials',
  conflictDetected: (count: number) =>
    `⚠️  This Feishu app already has ${count} bot(s) running:`,
  conflictEntry: (label: string, procId: string, ago: string) =>
    `   - ${label}, process ${procId}, started ${ago}`,
  conflictNonInteractive:
    '⚠️  Not an interactive start; cancelled automatically. To replace it, stop the old one with `kill <bot id>` first.\n',
  confirmKillConflicts: (count: number): string =>
    count > 1
      ? `Starting will stop them first. Continue? [y/N]: `
      : `Starting will stop it first. Continue? [y/N]: `,
  killedConflict: (id: string) => `✓ Stopped bot ${id}`,
  killConflictFailed: (id: string, message: string) => `✗ Failed to stop bot ${id}: ${message}`,
  confirmStopOldRestart: 'Stop the old process and start again? [y/N]: ',
  lockNonInteractiveStopError: (kind: 'profile' | 'app') =>
    `This ${kind} is already held by another bridge process; ` +
    'cannot confirm stopping it in non-interactive mode. Use `lark-channel-bridge ps` to inspect and `lark-channel-bridge kill <bot id>` to stop it, then retry',
  agoSeconds: (n: number) => `${n} seconds ago`,
  agoMinutes: (n: number) => `${n} minutes ago`,
  agoHours: (n: number) => `${n} hours ago`,
  agoDays: (n: number) => `${n} days ago`,

  // ── migrate ──
  migrateProfileUpgraded: (profile: string) => `✓ Upgraded profile directory layout: ${profile}`,
  migrateProfileUpToDate: (profile: string) =>
    `✓ Profile directory layout is already up to date: ${profile}`,
  migrateCancelled: 'Migration cancelled.',
  migrateBridgeRunning: 'Bridge is running; migration needs these processes stopped first:',
  migrateNonInteractiveError:
    'Bridge is running; cannot confirm stopping it in non-interactive mode. Stop it first, then retry the migration',
  migrateConfirmStop: 'Stop these processes and continue the migration? [y/N]: ',
  migrateStoppingProcess: (desc: string) => `Stopping ${desc}...`,
  migrateConfigMissing: '  config.json not found; skipping shape migration',
  migrateConfigInvalidJson: (path: string) => `✗ config is not valid JSON (${path}):`,
  migrateConfigAlreadyV2: (path: string) => `✓ config is already in profile v2 format: ${path}`,
  migrateConfigAlreadyNew: (path: string) => `✓ config is already in the new format: ${path}`,
  migrateConfigUpgraded: (path: string) => `✓ Upgraded config shape: ${path}`,
  migrateConfigUnrecognized: (path: string) => `✗ Unrecognized config format: ${path}`,
  migrateConfigExpectedShape:
    '  Expected { app: { id, secret, tenant } } or { accounts: { app: ... } }',
  migrateMovedConfig: (from: string, to: string) => `✓ Moved config: ${from} → ${to}`,
  migrateMovedCache: (from: string, to: string) => `✓ Moved cache: ${from} → ${to}`,
  migrateSkipExisting: (name: string) => `  · Skipped ${name} (target already exists)`,

  // ── ps / kill ──
  psNoneRunning: 'No bots are running.',
  psRunningCount: (n: number) => `# ${n} bot(s) running\n`,
  psHeaderStarted: 'Started',
  psHeaderVersion: 'Version',
  killUsage: 'Usage: lark-channel-bridge kill <bot id or index>',
  killNotFound: (target: string) => `✗ No matching bot: ${target}`,
  killSeeTargets: '  Use `lark-channel-bridge ps` to list available targets.',
  killClosing: (id: string) => `Stopping bot ${id}…`,
  killFailed: (message: string) => `✗ Stop failed: ${message}`,
  killForceClosed: (id: string) => `✓ Force-stopped bot ${id}.`,
  killClosed: (id: string) => `✓ Stopped bot ${id}.`,
  psAgoSeconds: (n: number) => `${n}s ago`,
  psAgoMinutes: (n: number) => `${n}m ago`,
  psAgoHours: (n: number) => `${n}h ago`,
  psAgoDays: (n: number) => `${n}d ago`,

  // ── secrets ──
  secretsSetUsage: 'Usage: lark-channel-bridge secrets set --app-id <id>',
  secretsCancelledEmpty: '✗ Cancelled (secret is empty)',
  secretsSavedEncrypted: '✓ Encrypted and saved to ~/.lark-channel/secrets.enc',
  secretsNoneStored: 'No secrets in encrypted storage.',
  secretsCount: (n: number) => `# ${n} secret(s) in encrypted storage\n`,
  secretsRemoveUsage: 'Usage: lark-channel-bridge secrets remove --app-id <id>',
  secretsNotFound: (id: string) => `✗ Secret not found: ${id}`,
  secretsRemoved: (id: string) => `✓ Removed ${id}`,

  // ── profile ──
  profileNone: 'No profiles yet.',
  profileCreated: (name: string) => `Created profile: ${name}`,
  profileSwitched: (name: string) => `Switched to profile: ${name}`,
  profilePurged: (name: string) => `Permanently removed profile: ${name}`,
  profileArchived: (name: string, archivedTo: string | undefined) =>
    `Archived profile: ${name} -> ${archivedTo}`,
  profileExported: (name: string, output: string) => `Exported profile: ${name} -> ${output}`,

  // ── registration wizard ──
  wizardIntro: '\nNo Feishu app configuration detected; entering the QR-code creation wizard.\n',
  wizardScanQr: 'Scan this QR code with the Feishu app to create the application:\n',
  wizardQrExpiry: (mins: number) => `\nQR code valid for about ${mins} minute(s)`,
  wizardOpenInBrowser: (url: string) => `Or open it directly in a browser: ${url}\n`,
  wizardDomainSwitched: 'International tenant detected; switched to the larksuite.com domain.',
  wizardSlowDown: 'Polling too fast; automatically slowed down.',
  wizardAppCreated: '\n✓ App created',
  wizardCreatorExempt: (openId: string) =>
    `  Creator: ${openId} (Lark app owner, automatically exempt from access control)`,
  wizardNoOpenIdOwnerApi:
    "  ⚠️ Could not get the QR scanner's open_id; the creator will be resolved via the app owner API after startup.",
  wizardCreatorExemptAll: (openId: string) =>
    `  Creator: ${openId} (Lark app owner, automatically exempt from all access control)`,
  wizardNoOpenIdOwnerApiV6:
    "  ⚠️ Could not get the QR scanner's open_id; on first startup the bridge will call the application/v6 API to resolve the current owner.",

  // ── profile runtime bootstrap ──
  configSaved: (path: string) => `Config saved to ${path}\n`,
  bootstrapNoConfigNonInteractive:
    'No configuration found, and the QR-code app-creation wizard cannot run in non-interactive mode. ' +
    'Run `lark-channel-bridge run` in a terminal to finish first-time setup, ' +
    'or pass --app-id and --app-secret.',
  bootstrapMissingSecretNonInteractive: (appId: string) =>
    `Missing App Secret in non-interactive mode: ${appId}. ` +
    'Pass --app-secret <secret>, or rerun the command in a terminal and enter it when prompted.',
  credentialsValidatedNamed: (botName: string) => `✓ App credentials verified: ${botName}`,
  credentialsValidated: '✓ App credentials verified',
  ambiguousAgentsHeader:
    'Multiple local agents detected; use --agent <claude|codex> to pick which one to initialize.',
  ambiguousAgentsDetectedLabel: 'Detected:',
  selectAgentIntro: 'Select a local agent',
  selectAgentMessage: 'Multiple local agents detected. Which one should be initialized?',
  agentSelectionCancelled: 'Agent selection cancelled.',
  agentSelected: (name: string) => `Selected ${name}`,
  secretMigratedToKeystore: '🔒 App Secret migrated to encrypted ~/.lark-channel/secrets.enc',
  secretsProviderWrapperMigrated: '🔒 Secrets provider switched to the wrapper form',

  // ── agent preflight diagnostics ──
  preflightBinaryNotFound: (agentName: string, code: string) =>
    [
      `✗ Local ${agentName} not found.`,
      '',
      `Install ${agentName} first, or configure the correct executable path.`,
      `Error code: ${code}`,
    ].join('\n'),
  preflightBinaryNotExecutable: (agentName: string, code: string) =>
    [
      `✗ Local ${agentName} is not executable.`,
      '',
      `Check the execute permission, or reinstall ${agentName}.`,
      `Error code: ${code}`,
    ].join('\n'),
  preflightBinaryResolveFailed: (agentName: string, code: string) =>
    [
      `✗ Failed to resolve the local ${agentName} path.`,
      '',
      'Verify the configured executable path is valid, then run the bridge again.',
      `Error code: ${code}`,
    ].join('\n'),
  preflightBinaryNotReadable: (agentName: string, code: string) =>
    [
      `✗ Local ${agentName} binary is not readable.`,
      '',
      `Check the file permissions, or reinstall ${agentName}.`,
      `Error code: ${code}`,
    ].join('\n'),
  preflightSpawnFailed: (agentName: string, command: string, code: string) =>
    [
      `✗ Local ${agentName} unavailable: could not execute \`${command}\`.`,
      '',
      'Run the same command in a terminal and fix the error first.',
      `Error code: ${code}`,
    ].join('\n'),
  preflightTimeout: (agentName: string, command: string, code: string) =>
    [
      `✗ Local ${agentName} unavailable: \`${command}\` timed out.`,
      '',
      'Make sure the command finishes normally first.',
      `Error code: ${code}`,
    ].join('\n'),
  preflightSignaled: (agentName: string, command: string, signal: string, code: string) =>
    [
      `✗ Local ${agentName} unavailable: \`${command}\` was terminated by the system (${signal}).`,
      '',
      'Verify in a terminal first:',
      `  ${command}`,
      '',
      `Fix the local ${agentName}, then run the bridge again.`,
      `Error code: ${code}`,
    ].join('\n'),
  preflightNonzeroExit: (agentName: string, command: string, exitCode: string | number, code: string) =>
    [
      `✗ Local ${agentName} unavailable: \`${command}\` exited with code ${exitCode}.`,
      '',
      'Run the same command in a terminal and fix the error first.',
      `Error code: ${code}`,
    ].join('\n'),
  preflightEmptyOutput: (agentName: string, command: string, code: string) =>
    [
      `✗ Local ${agentName} unavailable: \`${command}\` returned no version info.`,
      '',
      `Make sure a supported ${agentName} is installed.`,
      `Error code: ${code}`,
    ].join('\n'),

  // ── daemon banner (logger stdout) ──
  wsConnected: (bot: string, appIdSuffix: string, agent: string, procSuffix: string) =>
    `✓ Connected  bot: ${bot}${appIdSuffix}  agent: ${agent}${procSuffix}`,
  wsConnectedProc: (procId: string) => `  process: ${procId}`,
  wsReconnecting: '↻ Reconnecting…',
  wsReconnected: '✓ Reconnected',
  wsError: (err: string) => `✗ WS error: ${err}`,

  // ── feishu auth validation ──
  networkError: (message: string) => `Network error: ${message}`,
  invalidJsonResponse: 'Response is not valid JSON',

  // ── codex session history ──
  emptySessionPreview: '(empty session)',
};

export const cliJa: typeof cliZh = {
  // ── shared across CLI commands ──
  startCancelled: '起動をキャンセルしました。',
  forceStoppedPid: (pid: number) => `✓ pid ${pid} を強制停止しました`,
  stoppedPid: (pid: number) => `✓ pid ${pid} を停止しました`,
  lockHeldByOther: (kind: 'profile' | 'app') =>
    `✗ この ${kind} は既に別の bridge プロセスが使用中です。`,
  enterAppSecretPrompt: (appId: string) => `${appId} の App Secret を入力してください: `,

  // ── service (start/stop/restart/status/unregister) ──
  serviceUnsupportedPlatform: (cmdName: string) =>
    `${cmdName}: この OS ではバックグラウンド実行に対応していません。`,
  serviceSupportedPlatforms: '  対応: macOS (launchd) / Linux (systemd) / Windows (Task Scheduler)',
  serviceVerbStart: '起動',
  serviceVerbRestart: '再起動',
  serviceActionFailed: (action: string) => `✗ bot の${action}に失敗しました。`,
  serviceActionFailedWithOutput: (action: string) => `✗ bot の${action}に失敗しました:`,
  serviceFailureCommonCause:
    '最も多い原因: 古い bot インスタンスがまだ終了処理中です。以下のいずれかをお試しください:',
  serviceFailureRetryHint: '  1. 数秒待ってから、もう一度 `start` を実行してください',
  serviceFailureCleanRegistrationHint: '  2. または登録を完全にクリアしてから起動してください:',
  serviceFailureRawErrorLabel: '元のエラー:',
  serviceNotConfigured: 'bot にはまだ app 認証情報が設定されていません。',
  serviceNotConfiguredHint:
    '`start` を再実行して初回の QR コードウィザードを完了するか、既存のアプリ情報を渡してください。',
  lockStopHolderFirst: '  使用中のプロセスを先に停止してから、start を実行してください。',
  lockNonInteractiveStopHint: (kind: 'profile' | 'app') =>
    `  非対話モードでは ${kind} を使用中のプロセスの停止を確認できません。` +
    '先に `lark-channel-bridge ps` で確認し、`lark-channel-bridge kill <bot id>` で停止してから再試行してください。',
  confirmStopOldStartService:
    '古いプロセスを停止してバックグラウンドサービスの起動を続けますか? [y/N]: ',
  waitingForConnect: 'bot の接続を待っています...',
  waitingForReconnect: 'bot の再接続を待っています...',
  serviceVerbStarted: '起動しました',
  serviceVerbRestarted: '再起動しました',
  serviceConnected: (p: {
    verb: string;
    botName: string | undefined;
    appId: string;
    agentName: string;
    agentId: string;
    procId: string;
  }) =>
    `✓ ${p.verb}  bot: ${p.botName} (${p.appId})  agent: ${p.agentName} (${p.agentId})  プロセス: ${p.procId}`,
  serviceConnectTimeout: (verb: string) =>
    `⚠ コマンドを実行しましたが、30 秒以内に bot の接続を確認できませんでした (${verb})。`,
  serviceViewLogs: (path: string) => `  ログの確認: tail -f ${path}`,
  serviceOldInstanceRestart: '古い bot インスタンスを検出しました。停止してから再起動します...',
  serviceStopOldWarning: (stderr: string) =>
    `⚠ 古いインスタンスの停止時に警告がありました(再起動を続行します):\n${stderr}`,
  serviceOldInstanceStuck:
    '✗ 古い bot インスタンスが完全に停止しませんでした。しばらくしてから再試行するか、以下を実行してください:',
  serviceUnregisterHint: '  unregister  # 登録を強制クリア',
  serviceStartAgainHint: '  start       # 再度起動',
  serviceNeverRanNoStop: 'bot はまだバックグラウンドで実行されたことがないため、停止は不要です。',
  serviceNotRunning: 'bot は現在バックグラウンドで実行されていません。',
  serviceStopFailed: (stderr: string) => `✗ 停止に失敗しました:\n${stderr}`,
  serviceBotStoppedNamed: (botName: string | undefined, appId: string) =>
    `✓ bot ${botName} (${appId}) を停止しました`,
  serviceBotStopped: '✓ bot を停止しました',
  serviceRestartHint: '  `start` で再度起動できます',
  serviceNeverRanRestart:
    'bot はまだバックグラウンドで実行されたことがありません。先に `start` を実行してください。',
  statusNeverStarted: 'bot は現在バックグラウンドで実行されていません(まだ起動されていません)',
  statusStartHint: '  `start` で bot を起動してください',
  statusNotRunning: 'bot は現在バックグラウンドで実行されていません',
  statusRestartHint: '  `start` で再度起動してください',
  statusRunningNamed: (botName: string | undefined, appId: string) =>
    `✓ bot ${botName} (${appId}) はバックグラウンドで実行中です`,
  statusRunning: '✓ bot はバックグラウンドで実行中です',
  statusPid: (pid: string) => `  プロセス ID: ${pid}`,
  statusLogsLabel: '  ログ:',
  statusLastExit: (code: string) => `  前回の終了コード: ${code}`,
  serviceNeverRanNoCleanup:
    'bot はまだバックグラウンドで実行されたことがないため、クリーンアップは不要です。',
  serviceStopWarnCleanup: (stderr: string) =>
    `⚠ bot の停止時に警告がありました(クリーンアップを続行します):\n${stderr}`,
  serviceBotStoppedShort: '✓ bot を停止しました',
  serviceUnregistered: '✓ バックグラウンド実行の登録をクリアしました',
  serviceUnregisteredKeep: (dir: string) => `  (設定 / ログ / セッションは ${dir} に保持されます)`,

  // ── start (foreground run) ──
  shutdownSignal: (sig: string) => `\n${sig} を受信しました。シャットダウンしています...`,
  reconnectedNewCreds: '✓ 新しい認証情報で再接続しました',
  conflictDetected: (count: number) =>
    `⚠️  この Feishu アプリでは既に ${count} 個の bot が実行中です:`,
  conflictEntry: (label: string, procId: string, ago: string) =>
    `   - ${label}、プロセス ${procId}、${ago}に起動`,
  conflictNonInteractive:
    '⚠️  対話モードでの起動ではないため、自動的にキャンセルしました。置き換える場合は、先に `kill <bot id>` で古いものを停止してください。\n',
  confirmKillConflicts: (count: number): string =>
    count > 1
      ? `続行するとそれらを先に停止します。続行しますか? [y/N]: `
      : `続行するとそれを先に停止します。続行しますか? [y/N]: `,
  killedConflict: (id: string) => `✓ bot ${id} を停止しました`,
  killConflictFailed: (id: string, message: string) =>
    `✗ bot ${id} の停止に失敗しました: ${message}`,
  confirmStopOldRestart: '古いプロセスを停止して再起動しますか? [y/N]: ',
  lockNonInteractiveStopError: (kind: 'profile' | 'app') =>
    `この ${kind} は既に別の bridge プロセスが使用中です。` +
    '非対話モードでは停止を確認できないため、先に `lark-channel-bridge ps` で確認し、`lark-channel-bridge kill <bot id>` で停止してから再試行してください',
  agoSeconds: (n: number) => `${n} 秒前`,
  agoMinutes: (n: number) => `${n} 分前`,
  agoHours: (n: number) => `${n} 時間前`,
  agoDays: (n: number) => `${n} 日前`,

  // ── migrate ──
  migrateProfileUpgraded: (profile: string) =>
    `✓ profile のディレクトリ構造をアップグレードしました: ${profile}`,
  migrateProfileUpToDate: (profile: string) =>
    `✓ profile のディレクトリ構造は最新です: ${profile}`,
  migrateCancelled: '移行をキャンセルしました。',
  migrateBridgeRunning: 'bridge が実行中です。移行には先にこれらのプロセスの停止が必要です:',
  migrateNonInteractiveError:
    'bridge が実行中です。非対話モードでは停止を確認できないため、先に停止してから移行を再試行してください',
  migrateConfirmStop: 'これらのプロセスを停止して移行を続けますか? [y/N]: ',
  migrateStoppingProcess: (desc: string) => `${desc} を停止しています...`,
  migrateConfigMissing: '  config.json が存在しないため、構造移行をスキップします',
  migrateConfigInvalidJson: (path: string) => `✗ config が有効な JSON ではありません (${path}):`,
  migrateConfigAlreadyV2: (path: string) => `✓ config は既に profile v2 形式です: ${path}`,
  migrateConfigAlreadyNew: (path: string) => `✓ config は既に新形式です: ${path}`,
  migrateConfigUpgraded: (path: string) => `✓ config の構造をアップグレードしました: ${path}`,
  migrateConfigUnrecognized: (path: string) => `✗ 認識できない config 形式です: ${path}`,
  migrateConfigExpectedShape:
    '  期待される形式: { app: { id, secret, tenant } } または { accounts: { app: ... } }',
  migrateMovedConfig: (from: string, to: string) => `✓ 設定を移動しました: ${from} → ${to}`,
  migrateMovedCache: (from: string, to: string) => `✓ キャッシュを移動しました: ${from} → ${to}`,
  migrateSkipExisting: (name: string) => `  · ${name} をスキップしました(移動先が既に存在します)`,

  // ── ps / kill ──
  psNoneRunning: '現在実行中の bot はありません。',
  psRunningCount: (n: number) => `# 現在 ${n} 個の bot が実行中\n`,
  psHeaderStarted: '起動',
  psHeaderVersion: 'バージョン',
  killUsage: '使い方: lark-channel-bridge kill <bot id または番号>',
  killNotFound: (target: string) => `✗ 一致する bot が見つかりません: ${target}`,
  killSeeTargets: '  `lark-channel-bridge ps` で対象を確認してください。',
  killClosing: (id: string) => `bot ${id} を停止しています…`,
  killFailed: (message: string) => `✗ 停止に失敗しました: ${message}`,
  killForceClosed: (id: string) => `✓ bot ${id} を強制停止しました。`,
  killClosed: (id: string) => `✓ bot ${id} を停止しました。`,
  psAgoSeconds: (n: number) => `${n}s 前`,
  psAgoMinutes: (n: number) => `${n}m 前`,
  psAgoHours: (n: number) => `${n}h 前`,
  psAgoDays: (n: number) => `${n}d 前`,

  // ── secrets ──
  secretsSetUsage: '使い方: lark-channel-bridge secrets set --app-id <id>',
  secretsCancelledEmpty: '✗ キャンセルしました(secret が空です)',
  secretsSavedEncrypted: '✓ 暗号化して ~/.lark-channel/secrets.enc に保存しました',
  secretsNoneStored: '暗号化ストレージに secret はありません。',
  secretsCount: (n: number) => `# 暗号化ストレージに ${n} 個の secret があります\n`,
  secretsRemoveUsage: '使い方: lark-channel-bridge secrets remove --app-id <id>',
  secretsNotFound: (id: string) => `✗ secret が見つかりません: ${id}`,
  secretsRemoved: (id: string) => `✓ ${id} を削除しました`,

  // ── profile ──
  profileNone: 'profile はまだありません。',
  profileCreated: (name: string) => `profile を作成しました: ${name}`,
  profileSwitched: (name: string) => `profile を切り替えました: ${name}`,
  profilePurged: (name: string) => `profile を完全に削除しました: ${name}`,
  profileArchived: (name: string, archivedTo: string | undefined) =>
    `profile をアーカイブしました: ${name} -> ${archivedTo}`,
  profileExported: (name: string, output: string) =>
    `profile をエクスポートしました: ${name} -> ${output}`,

  // ── registration wizard ──
  wizardIntro: '\nFeishu アプリの設定が見つからないため、QR コード作成ウィザードを開始します。\n',
  wizardScanQr: 'Feishu アプリで以下の QR コードをスキャンして、アプリの作成を完了してください:\n',
  wizardQrExpiry: (mins: number) => `\nQR コードの有効期限: 約 ${mins} 分`,
  wizardOpenInBrowser: (url: string) => `ブラウザで直接開くこともできます: ${url}\n`,
  wizardDomainSwitched: '国際版テナントを検出したため、larksuite.com ドメインに切り替えました。',
  wizardSlowDown: 'ポーリングが速すぎるため、自動的に減速しました。',
  wizardAppCreated: '\n✓ アプリを作成しました',
  wizardCreatorExempt: (openId: string) =>
    `  Creator: ${openId} (Lark アプリ owner のため、アクセス制御を自動的に免除)`,
  wizardNoOpenIdOwnerApi:
    '  ⚠️ QR コードをスキャンしたユーザーの open_id を取得できませんでした。起動後にアプリ owner API で作成者を解決します。',
  wizardCreatorExemptAll: (openId: string) =>
    `  Creator: ${openId} (Lark アプリ owner のため、すべてのアクセス制御を自動的に免除)`,
  wizardNoOpenIdOwnerApiV6:
    '  ⚠️ QR コードをスキャンしたユーザーの open_id を取得できませんでした。初回起動時に bridge が application/v6 API を呼び出して現在の owner を解決します。',

  // ── profile runtime bootstrap ──
  configSaved: (path: string) => `設定を ${path} に保存しました\n`,
  bootstrapNoConfigNonInteractive:
    '設定が見つからず、非対話モードでは QR コードによるアプリ作成ウィザードを完了できません。' +
    '先にターミナルで `lark-channel-bridge run` を実行して初回セットアップを完了するか、' +
    '--app-id と --app-secret を渡してください。',
  bootstrapMissingSecretNonInteractive: (appId: string) =>
    `非対話モードで App Secret がありません: ${appId}。` +
    '--app-secret <secret> を渡すか、ターミナルでコマンドを再実行してプロンプトに従って入力してください。',
  credentialsValidatedNamed: (botName: string) => `✓ アプリ認証情報の検証に成功しました: ${botName}`,
  credentialsValidated: '✓ アプリ認証情報の検証に成功しました',
  ambiguousAgentsHeader:
    '複数のローカル agent を検出しました。--agent <claude|codex> で初期化する agent を指定してください。',
  ambiguousAgentsDetectedLabel: '検出済み:',
  selectAgentIntro: 'ローカル agent の選択',
  selectAgentMessage: '複数のローカル agent を検出しました。今回はどれを初期化しますか?',
  agentSelectionCancelled: 'agent の選択をキャンセルしました。',
  agentSelected: (name: string) => `${name} を選択しました`,
  secretMigratedToKeystore: '🔒 App Secret を暗号化して ~/.lark-channel/secrets.enc に移行しました',
  secretsProviderWrapperMigrated: '🔒 secrets provider を wrapper 形式に切り替えました',

  // ── agent preflight diagnostics ──
  preflightBinaryNotFound: (agentName: string, code: string) =>
    [
      `✗ ローカルの ${agentName} が見つかりません。`,
      '',
      `先に ${agentName} をインストールするか、正しい実行ファイルのパスを設定してください。`,
      `エラーコード: ${code}`,
    ].join('\n'),
  preflightBinaryNotExecutable: (agentName: string, code: string) =>
    [
      `✗ ローカルの ${agentName} を実行できません。`,
      '',
      `実行権限を確認するか、${agentName} を再インストールしてください。`,
      `エラーコード: ${code}`,
    ].join('\n'),
  preflightBinaryResolveFailed: (agentName: string, code: string) =>
    [
      `✗ ローカルの ${agentName} のパス解決に失敗しました。`,
      '',
      '現在設定されている実行ファイルのパスが有効であることを確認してから、bridge を再実行してください。',
      `エラーコード: ${code}`,
    ].join('\n'),
  preflightBinaryNotReadable: (agentName: string, code: string) =>
    [
      `✗ ローカルの ${agentName} バイナリを読み取れません。`,
      '',
      `ファイルの権限を確認するか、${agentName} を再インストールしてください。`,
      `エラーコード: ${code}`,
    ].join('\n'),
  preflightSpawnFailed: (agentName: string, command: string, code: string) =>
    [
      `✗ ローカルの ${agentName} を利用できません: \`${command}\` を実行できませんでした。`,
      '',
      '先にターミナルで同じコマンドを実行し、エラーを修正してください。',
      `エラーコード: ${code}`,
    ].join('\n'),
  preflightTimeout: (agentName: string, command: string, code: string) =>
    [
      `✗ ローカルの ${agentName} を利用できません: \`${command}\` がタイムアウトしました。`,
      '',
      '先にこのコマンドが正常に終了することを確認してください。',
      `エラーコード: ${code}`,
    ].join('\n'),
  preflightSignaled: (agentName: string, command: string, signal: string, code: string) =>
    [
      `✗ ローカルの ${agentName} を利用できません: \`${command}\` の実行がシステムに終了させられました (${signal})。`,
      '',
      '先にターミナルで確認してください:',
      `  ${command}`,
      '',
      `ローカルの ${agentName} を修復してから、bridge を再実行してください。`,
      `エラーコード: ${code}`,
    ].join('\n'),
  preflightNonzeroExit: (agentName: string, command: string, exitCode: string | number, code: string) =>
    [
      `✗ ローカルの ${agentName} を利用できません: \`${command}\` の終了コードは ${exitCode} でした。`,
      '',
      '先にターミナルで同じコマンドを実行し、エラーを修正してください。',
      `エラーコード: ${code}`,
    ].join('\n'),
  preflightEmptyOutput: (agentName: string, command: string, code: string) =>
    [
      `✗ ローカルの ${agentName} を利用できません: \`${command}\` がバージョン情報を返しませんでした。`,
      '',
      `サポートされている ${agentName} がインストールされていることを確認してください。`,
      `エラーコード: ${code}`,
    ].join('\n'),

  // ── daemon banner (logger stdout) ──
  wsConnected: (bot: string, appIdSuffix: string, agent: string, procSuffix: string) =>
    `✓ 接続しました  bot: ${bot}${appIdSuffix}  agent: ${agent}${procSuffix}`,
  wsConnectedProc: (procId: string) => `  プロセス: ${procId}`,
  wsReconnecting: '↻ 再接続しています…',
  wsReconnected: '✓ 再接続しました',
  wsError: (err: string) => `✗ WS エラー: ${err}`,

  // ── feishu auth validation ──
  networkError: (message: string) => `ネットワークエラー: ${message}`,
  invalidJsonResponse: 'レスポンスが有効な JSON ではありません',

  // ── codex session history ──
  emptySessionPreview: '(空のセッション)',
};
