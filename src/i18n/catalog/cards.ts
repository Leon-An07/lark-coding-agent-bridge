/** cards namespace — zh-CN is the source of truth; the En object's
 * `typeof` annotation turns any missing translation into a compile error.
 * Filled by the i18n migration; keys are camelCase, parameterized entries
 * are arrow functions so params are type-checked. */

export const cardsZh = {
  // ── shared ──
  submit: '提交',
  cancel: '取消',
  cancelledSummary: '已取消',
  doneLabel: '已完成',
  currentMarker: '  ← 当前',
  notSet: '(未设置)',
  workspacesLabel: '📂 工作目录',
  btnNewSession: '🆕 新会话',
  btnResume: '🔁 恢复会话',
  btnHelp: '💡 帮助',
  btnStatus: '📊 状态',

  // ── config-card.ts ──
  noneMarker: '_（暂无）_',
  unknownChat: '(未知群)',
  chatListItem: (name: string, idSuffix: string) => `- **${name}**（...${idSuffix}）`,
  noOverrides: '_（暂无，全部跟随全局设置）_',
  mentionOverrideItem: (name: string, idSuffix: string, required: boolean) =>
    `- **${name}**（...${idSuffix}）：${required ? '需要 @bot' : '不需要 @bot'}`,
  accessIntro:
    '_控制谁能通过私聊和群聊使用 bot。**留空 = 不响应聊天消息**。云文档评论按文档权限生效。_',
  accessAllowedUsers: (count: number, mentionLine: string) =>
    `**允许私聊的用户**（共 ${count} 人）\n` +
    `${mentionLine}\n\n` +
    '_加 / 删：_ `/invite user @某人`  `/remove user @某人`',
  accessAllowedChats: (count: number, list: string) =>
    `**允许响应的群**（共 ${count} 个）\n` +
    `${list}\n\n` +
    '_一键加全部 bot 所在的群：_ `/invite all group`\n' +
    '_加 / 删（在目标群里发）：_ `/invite group`  `/remove group`',
  accessMentionOverrides: (count: number, list: string) =>
    `**单群 @ 例外**（共 ${count} 个）\n` +
    '_在目标群里发 `/mention group on|off|default` 只影响那个群；`off` 表示把当前群设为专属群免 @，`default` 会删除该群例外,重新跟随全局默认值。_\n' +
    `${list}`,
  accessAdmins: (count: number, mentionLine: string) =>
    `**管理员**（共 ${count} 人）\n` +
    `${mentionLine}\n\n` +
    '_可以跑敏感命令：`/account` `/config` `/exit` `/reconnect` `/doctor` `/cd` `/ws` `/invite` `/remove`。管理员也自动获得私聊权限，并可在未白名单群里管理访问控制。_\n\n' +
    '_加 / 删：_ `/invite admin @某人`  `/remove admin @某人`',
  configSummary: '偏好设置',
  configIntro:
    '⚙️ **偏好设置**\n\n' +
    '调整 bot 的行为偏好。改完点提交后写入当前 profile 配置；消息和访问控制设置立即生效。',
  messageReplyHeading:
    '**消息回复方式**\n' +
    '_纯文本:agent 跑完一次性发出,不流式,体感最轻_\n' +
    '_消息卡片:轻量流式 markdown 卡片,飞书原生打字机动画_\n' +
    '_交互卡片:完整卡片,工具调用折叠成可展开面板、带运行状态_',
  optText: '纯文本',
  optMarkdown: '消息卡片(默认)',
  optCard: '交互卡片',
  labelMarkdown: '消息卡片',
  toolCallsHeading:
    '\n**工具调用显示**\n' +
    '_显示:可以看到 bot 跑了什么命令、读了哪些文件等过程_\n' +
    '_隐藏:只看 agent 最终的文字答复,跳过所有工具块_',
  optShow: '显示(默认)',
  optHide: '隐藏',
  cotHeading:
    '\n**思考过程(COT)**\n' +
    '_关闭:只发最终答案_\n' +
    '_精简 / 详细:最终答案前,用独立的「思考过程」消息实时展示步骤与工具调用(详细含推理与参数)。需应用具备 message_cot 权限,缺失则自动回退_',
  optCotOff: '关闭(默认)',
  optCotBrief: '精简',
  optCotDetailed: '详细',
  concurrencyHeading:
    '\n**并发上限**\n' +
    '_全局同时运行的 agent 进程数(主要影响话题群多话题并行场景)_\n' +
    '_默认 10,范围 1-50。超出的请求会 FIFO 排队_',
  idleTimeoutHeading:
    '\n**run 探活(分钟)**\n' +
    '_agent 长时间没输出时自动 kill,防止假死_\n' +
    '_0 = 关闭(默认),范围 1-120。可被 `/timeout` 在单个 scope 覆盖_',
  mentionHeading:
    '\n**群里是否需要 @bot（全局默认）**\n' +
    '_推荐保持“需要 @bot”。“专属群免 @”只适合这个群基本只给当前 bot 使用的场景。私聊永远不需要 @;`@全员` 永远不响应。_',
  mentionPlaceholder: '选择群聊触发方式',
  optMentionYes: '需要 @bot（默认）',
  optMentionNo: '专属群免 @',
  mentionNote:
    '_需要 @bot:群和话题群里,不 @bot 的消息不会触发回复。_\n' +
    '_专属群免 @:群里普通消息也会发给 agent；如果同群有多个 bot，容易多 bot 同时响应，不建议开启。需应用具备 `im:message.group_msg` 权限。_\n' +
    '_单群例外在下方“访问控制”里查看；修改请在目标群里发 `/mention group on|off|default`。_',
  identityHeading:
    '\n**lark-cli 身份策略**\n' +
    '_只允许应用身份:使用 bot/app 能力,不访问个人资源_\n' +
    '_允许用户身份:保留应用身份,并允许已授权用户访问个人日历、邮箱、云盘等资源_',
  optIdentityBot: '只允许应用身份',
  optIdentityUser: '允许用户身份',
  languageHeading: '\n**语言 / Language**\n_影响 bot 回复、卡片与命令输出的语言_',
  langOptionZh: '中文',
  langOptionEn: 'English',
  accessPanelTitle: '🔒 **访问控制**（点击展开）',
  configSavedSummary: '偏好已保存',
  emptyList: '_(空)_',
  itemsCount: (n: number) => `${n} 项`,
  configSavedBody: (p: {
    replyLabel: string;
    showToolCalls: boolean;
    maxConcurrentRuns: number;
    runIdleTimeoutMinutes: number;
    requireMentionInGroup: boolean;
    mentionOverridesSummary: string;
    allowUserIdentity: boolean;
    allowedUsersSummary: string;
    allowedChatsSummary: string;
    adminsSummary: string;
  }) =>
    '✅ **偏好已保存**\n\n' +
    `**消息回复方式**:${p.replyLabel}\n` +
    `**工具调用显示**:\`${p.showToolCalls ? 'show' : 'hide'}\`\n` +
    `**并发上限**:\`${p.maxConcurrentRuns}\`\n` +
    `**run 探活**:\`${p.runIdleTimeoutMinutes > 0 ? `${p.runIdleTimeoutMinutes} 分钟` : '关闭'}\`\n` +
    `**群里需要 @bot（全局默认）**:\`${p.requireMentionInGroup ? '是' : '专属群免 @'}\`\n` +
    `**单群 @ 例外**:${p.mentionOverridesSummary}\n\n` +
    `**lark-cli 身份策略**:\`${p.allowUserIdentity ? '允许用户身份' : '只允许应用身份'}\`\n\n` +
    '🔒 **访问控制**\n' +
    `**允许私聊的用户**:${p.allowedUsersSummary}\n` +
    `**允许响应的群**:${p.allowedChatsSummary}\n` +
    `**管理员**:${p.adminsSummary}\n\n` +
    '下条消息开始生效。',
  scopeGrantSummary: '需要补授权',
  scopeGrantBody: (url: string, expireMins: number) =>
    '⚠️ **「群里不需要 @ bot」还差一个权限**\n\n' +
    '你已开启「不 @ bot 也回复」，但当前应用没有 **获取群组中所有消息**（`im:message.group_msg`）权限。' +
    '没有它，飞书不会把群里非 @ 的消息推给 bot，所以这个设置暂时不生效。\n\n' +
    `**点下面的链接补授权**（约 ${expireMins} 分钟内有效）：\n` +
    `[🔗 点此一键授权](${url})\n\n` +
    '_扫码/点击后会进入确认页，新权限已预填好，确认即可。授权成功后，群里新消息开始自动生效，无需重启。_\n' +
    `_若链接打不开，可复制：_\n\`${url}\`\n\n` +
    '_授权后若群里仍收不到非 @ 消息，发 `/reconnect` 重连一次即可。_',
  scopeGrantedSummary: '授权成功',
  scopeGrantedBody:
    '✅ **授权成功**\n\n' +
    '`im:message.group_msg` 权限已生效，群里非 @ bot 的消息从现在开始会触发回复。\n\n' +
    '_若仍未生效，发 `/reconnect` 重连一次。_',
  configCancelledBody: '已取消,未做任何修改。',
  configFailedSummary: '保存失败',
  configFailedBody: (reason: string) => `保存失败：${reason}`,

  // ── account-cards.ts ──
  accountCurrentSummary: '当前应用',
  accountCurrentBody: (appId: string, botName: string, tenant: string) =>
    [
      '📋 **当前应用**',
      '',
      `**App ID**: \`${appId}\``,
      `**Bot 名**: ${botName}`,
      `**Tenant**: ${tenant}`,
    ].join('\n'),
  unknownValue: '(未知)',
  accountChangeLabel: '更换凭据',
  accountValidationFailedInline: (msg: string) => `❌ **校验失败**：${msg}`,
  appSecretPlaceholder: '32 位字符串',
  tenantFeishu: 'Feishu (国内)',
  tenantLark: 'Lark (海外)',
  accountValidatingSummary: '正在校验...',
  accountValidatingBody: '⏳ **正在校验凭据...**',
  accountSavedSummary: '已保存',
  accountSuccessBody: (appId: string, botName: string | undefined, tenant: string) =>
    [
      '✅ **凭据已保存**',
      '',
      `**App ID**: \`${appId}\``,
      botName ? `**Bot 名**: ${botName}` : '',
      `**Tenant**: ${tenant}`,
      '',
      '正在用新凭据重连 WebSocket...',
      '⚠️ 如果新 bot 不在此群，后续消息将由新 bot 接管，老 bot 不会再回复。',
    ]
      .filter(Boolean)
      .join('\n'),
  accountFailureSummary: '校验失败',
  accountFailureBody: (reason: string) =>
    `❌ **校验失败**\n\n\`${reason}\`\n\n请检查 App ID 和 Secret 是否正确，重发 \`/account change\` 重试。`,
  accountCancelledBody: '已取消，未做任何修改。',

  // ── templates.ts ──
  lockedPanelTitle: '查看提交内容',
  lockedBody: '已收到你的操作,这张卡已完成。',
  lockedHeader: '✅ 已完成',
  expiredSummary: '已过期',
  expiredHeader: '⏰ 已过期',
  expiredBody: '这张卡片已过期,请重新发送你的需求。',
  disabledNote: '_已改用文字回复,此卡已关闭_',
  cwdLine: (cwd: string) => `当前 cwd：\`${cwd}\``,
  noNamedWorkspaces: '暂无命名工作目录。',
  wsSaveHint: '💡 发送 `/ws save <name>` 把当前 cwd 存为命名工作目录',
  switchHere: '切换到此处',
  deleteLabel: '删除',
  sessionStaleSuffix: ' ⚠️ 旧 cwd，下一条会新建',
  noSession: '(无)',
  topicScopeLine: (scope: string) => `\`${scope}\` _（话题独立 session）_`,
  statusTitle: '📊 当前状态',
  noHistorySessions: '此 cwd 下没有历史会话。',
  resumeTitle: '🔁 恢复历史会话',
  lineCount: (n: number) => `${n} 条`,
  alreadyCurrentSession: '已是当前会话',
  resumeThisSession: '▸ 恢复此会话',
  helpTitle: '💡 使用帮助',
  helpBody: (agentName: string) =>
    [
      '**命令列表**',
      '',
      '- `/new` `/reset` — 清空当前 chat 的会话',
      '- `/new chat [name]` — 新建群+新会话，自动拉你进群',
      '- `/resume [N]` — 列出并恢复历史会话（最多 N 条）',
      '- `/cd <path>` — 切换工作目录（会重置 session）',
      '- `/ws list|save <name>|use <name>|remove <name>` — 工作目录',
      '- `/account` — 查看当前应用；`/account change` 换 appId/secret 并重连',
      '- `/config` — 调整偏好、访问控制和 lark-cli 身份策略',
      '- `/mention group on|off|default` — 设置当前群是否需要 @bot；off 是专属群免 @ 模式',
      '- `/status` — 当前状态',
      '- `/stop` — 结束当前正在跑的任务（也可点卡片底部 ⏹ 终止 按钮）',
      '- `/stop comment:<scopeHash>` — 管理员停止云文档评论任务',
      '- `/timeout [N|off|default]` — 当前 session 的探活分钟数,`/config` 改全局默认',
      '- `/timeout comment:<scopeHash> N` — 管理员设置云文档评论任务探活',
      '- `/ps` — 列出本机所有 bot,标识当前正在回复的那个',
      '- `/exit <id|#>` — 关掉指定 bot(用 `/ps` 看 id/序号)',
      '- `/reconnect` — 强制重连 WebSocket(网络抖动后 bot 没反应时用)',
      `- \`/doctor [描述]\` — 把日志和描述交给 ${agentName} 自助诊断`,
      '- `/help` — 本帮助',
      '',
      `其他内容直接交给 ${agentName}。`,
    ].join('\n'),

  // ── run-renderer.ts / text-renderer.ts ──
  interruptedNote: '_⏹ 已被中断_',
  idleTimeoutNote: (mins: number) => `_⏱ ${mins} 分钟无响应,已自动终止_`,
  agentFailedCard: (msg: string) => `⚠️ agent 失败：${msg}`,
  agentFailedText: (msg: string) => `⚠️ agent 失败:${msg}`,
  noContentNote: '_（未返回内容）_',
  reasoningActive: '🧠 **思考中**',
  reasoningDone: '🧠 **思考完成，点击查看**',
  noToolOutput: '_无输出_',
  toolSummaryTitle: (count: number, finalized: boolean) =>
    `☕ **${count} 个工具调用${finalized ? '（已结束）' : ''}**`,
  stopBtn: '⏹ 终止',
  footerThinking: '🧠 正在思考',
  footerToolRunning: '🧰 正在调用工具',
  footerStreaming: '✍️ 正在输出',
  summaryInterrupted: '已中断',
  summaryTimeout: '已超时',
  summaryError: '出错',
  summaryToolRunning: '正在调用工具',
  summaryStreaming: '正在输出',
  summaryThinking: '思考中',
  footerThinkingText: '_🧠 正在思考…_',
  footerToolRunningText: '_🧰 正在调用工具…_',
  footerStreamingText: '_✍️ 正在输出…_',

  // ── dispatcher.ts ──
  cardExpiredNotice: '⏰ 这张卡片已过期，请重新发送你的需求，我会发一张新的。',
  buttonAlreadySubmitted:
    '⚠️ 这个按钮已提交过，每个按钮只能提交一次。如果之前的提交没有得到回复，请直接用文字重新发送你的选择。',
  askAnswerEntry: (q: string, a: string | string[]) =>
    `**${q}** ${Array.isArray(a) ? a.join('、') || '（空）' : a || '（空）'}`,
  yourChoice: (choices: string[]) => `你的选择:${choices.join('、')}`,

  // ── tool-render.ts ──
  toolRunningBody: '_运行中…_',
  toolBodyTruncated: (body: string) =>
    `${body}…\n\n_（body 已截断,完整内容查 \`/doctor\` 或日志）_`,
};

export const cardsEn: typeof cardsZh = {
  // ── shared ──
  submit: 'Submit',
  cancel: 'Cancel',
  cancelledSummary: 'Cancelled',
  doneLabel: 'Done',
  currentMarker: '  ← current',
  notSet: '(not set)',
  workspacesLabel: '📂 Workspaces',
  btnNewSession: '🆕 New session',
  btnResume: '🔁 Resume session',
  btnHelp: '💡 Help',
  btnStatus: '📊 Status',

  // ── config-card.ts ──
  noneMarker: '_(none)_',
  unknownChat: '(unknown group)',
  chatListItem: (name: string, idSuffix: string) => `- **${name}** (...${idSuffix})`,
  noOverrides: '_(none — all groups follow the global setting)_',
  mentionOverrideItem: (name: string, idSuffix: string, required: boolean) =>
    `- **${name}** (...${idSuffix}): ${required ? '@bot required' : 'no @bot needed'}`,
  accessIntro:
    '_Controls who can use the bot via DM and group chats. **Empty = chat messages are not answered**. Doc comments follow document permissions._',
  accessAllowedUsers: (count: number, mentionLine: string) =>
    `**Users allowed to DM** (${count})\n` +
    `${mentionLine}\n\n` +
    '_Add / remove:_ `/invite user @someone`  `/remove user @someone`',
  accessAllowedChats: (count: number, list: string) =>
    `**Groups the bot responds in** (${count})\n` +
    `${list}\n\n` +
    '_Add every group the bot is in:_ `/invite all group`\n' +
    '_Add / remove (send in the target group):_ `/invite group`  `/remove group`',
  accessMentionOverrides: (count: number, list: string) =>
    `**Per-group @ exceptions** (${count})\n` +
    '_Send `/mention group on|off|default` in the target group to affect only that group; `off` makes that group mention-free (dedicated group), `default` removes the exception so it follows the global default again._\n' +
    `${list}`,
  accessAdmins: (count: number, mentionLine: string) =>
    `**Admins** (${count})\n` +
    `${mentionLine}\n\n` +
    '_Can run sensitive commands: `/account` `/config` `/exit` `/reconnect` `/doctor` `/cd` `/ws` `/invite` `/remove`. Admins also get DM access automatically and can manage access control in non-allowlisted groups._\n\n' +
    '_Add / remove:_ `/invite admin @someone`  `/remove admin @someone`',
  configSummary: 'Preferences',
  configIntro:
    '⚙️ **Preferences**\n\n' +
    'Adjust how the bot behaves. Submitting writes to the current profile config; message and access-control settings take effect immediately.',
  messageReplyHeading:
    '**Reply style**\n' +
    '_Plain text: sent once when the agent finishes — no streaming, lightest feel_\n' +
    "_Message card: lightweight streaming markdown card with Lark's native typewriter animation_\n" +
    '_Interactive card: full card — tool calls fold into expandable panels, with run status_',
  optText: 'Plain text',
  optMarkdown: 'Message card (default)',
  optCard: 'Interactive card',
  labelMarkdown: 'Message card',
  toolCallsHeading:
    '\n**Tool call display**\n' +
    '_Show: see what commands the bot ran, which files it read, etc._\n' +
    "_Hide: only the agent's final text reply — all tool blocks skipped_",
  optShow: 'Show (default)',
  optHide: 'Hide',
  cotHeading:
    '\n**Thinking process (COT)**\n' +
    '_Off: only the final answer_\n' +
    '_Brief / Detailed: before the final answer, a separate "thinking" message streams steps and tool calls in real time (Detailed includes reasoning and arguments). Requires the message_cot permission; falls back automatically if missing_',
  optCotOff: 'Off (default)',
  optCotBrief: 'Brief',
  optCotDetailed: 'Detailed',
  concurrencyHeading:
    '\n**Concurrency limit**\n' +
    '_Global cap on agent processes running at once (mainly affects parallel topics in topic groups)_\n' +
    '_Default 10, range 1-50. Requests over the cap queue FIFO_',
  idleTimeoutHeading:
    '\n**Run keepalive (minutes)**\n' +
    '_Auto-kill the agent when it produces no output for too long, preventing hangs_\n' +
    '_0 = off (default), range 1-120. Can be overridden per scope with `/timeout`_',
  mentionHeading:
    '\n**Require @bot in groups (global default)**\n' +
    '_Recommended: keep "@bot required". "Mention-free dedicated group" only suits groups used almost exclusively with this bot. DMs never need @; `@everyone` never triggers._',
  mentionPlaceholder: 'Choose how group chats trigger the bot',
  optMentionYes: '@bot required (default)',
  optMentionNo: 'Mention-free dedicated group',
  mentionNote:
    '_@bot required: in groups and topic groups, messages that do not @bot get no reply._\n' +
    '_Mention-free: ordinary group messages also go to the agent; with multiple bots in one group several may respond at once — not recommended. Requires the `im:message.group_msg` permission._\n' +
    '_Per-group exceptions are listed under "Access control" below; change them by sending `/mention group on|off|default` in the target group._',
  identityHeading:
    '\n**lark-cli identity policy**\n' +
    '_App identity only: uses bot/app capabilities, never touches personal resources_\n' +
    '_Allow user identity: keeps the app identity and lets authorized users access personal calendar, mail, drive, etc._',
  optIdentityBot: 'App identity only',
  optIdentityUser: 'Allow user identity',
  languageHeading: '\n**Language**\n_Language for bot replies, cards and command output_',
  langOptionZh: '中文',
  langOptionEn: 'English',
  accessPanelTitle: '🔒 **Access control** (click to expand)',
  configSavedSummary: 'Preferences saved',
  emptyList: '_(empty)_',
  itemsCount: (n: number) => `${n} item(s)`,
  configSavedBody: (p: {
    replyLabel: string;
    showToolCalls: boolean;
    maxConcurrentRuns: number;
    runIdleTimeoutMinutes: number;
    requireMentionInGroup: boolean;
    mentionOverridesSummary: string;
    allowUserIdentity: boolean;
    allowedUsersSummary: string;
    allowedChatsSummary: string;
    adminsSummary: string;
  }) =>
    '✅ **Preferences saved**\n\n' +
    `**Reply style**: ${p.replyLabel}\n` +
    `**Tool call display**: \`${p.showToolCalls ? 'show' : 'hide'}\`\n` +
    `**Concurrency limit**: \`${p.maxConcurrentRuns}\`\n` +
    `**Run keepalive**: \`${p.runIdleTimeoutMinutes > 0 ? `${p.runIdleTimeoutMinutes} min` : 'off'}\`\n` +
    `**Require @bot in groups (global default)**: \`${p.requireMentionInGroup ? 'yes' : 'mention-free dedicated group'}\`\n` +
    `**Per-group @ exceptions**: ${p.mentionOverridesSummary}\n\n` +
    `**lark-cli identity policy**: \`${p.allowUserIdentity ? 'allow user identity' : 'app identity only'}\`\n\n` +
    '🔒 **Access control**\n' +
    `**Users allowed to DM**: ${p.allowedUsersSummary}\n` +
    `**Groups the bot responds in**: ${p.allowedChatsSummary}\n` +
    `**Admins**: ${p.adminsSummary}\n\n` +
    'Takes effect from the next message.',
  scopeGrantSummary: 'Authorization needed',
  scopeGrantBody: (url: string, expireMins: number) =>
    '⚠️ **"No @bot needed in groups" is one permission short**\n\n' +
    'You enabled "reply without @bot", but the app is missing the **Receive all group messages** (`im:message.group_msg`) permission. ' +
    'Without it, Lark does not push non-@ group messages to the bot, so the setting has no effect yet.\n\n' +
    `**Click the link below to grant it** (valid for about ${expireMins} minutes):\n` +
    `[🔗 One-click authorization](${url})\n\n` +
    '_Scanning/clicking opens a confirmation page with the new permission pre-filled — just confirm. Once granted, new group messages start working immediately, no restart needed._\n' +
    `_If the link does not open, copy it:_\n\`${url}\`\n\n` +
    '_If non-@ messages still do not arrive after granting, send `/reconnect` once._',
  scopeGrantedSummary: 'Authorized',
  scopeGrantedBody:
    '✅ **Authorization successful**\n\n' +
    'The `im:message.group_msg` permission is now active — group messages without @bot will trigger replies from now on.\n\n' +
    '_If it still does not work, send `/reconnect` once._',
  configCancelledBody: 'Cancelled — nothing was changed.',
  configFailedSummary: 'Save failed',
  configFailedBody: (reason: string) => `Save failed: ${reason}`,

  // ── account-cards.ts ──
  accountCurrentSummary: 'Current app',
  accountCurrentBody: (appId: string, botName: string, tenant: string) =>
    [
      '📋 **Current app**',
      '',
      `**App ID**: \`${appId}\``,
      `**Bot name**: ${botName}`,
      `**Tenant**: ${tenant}`,
    ].join('\n'),
  unknownValue: '(unknown)',
  accountChangeLabel: 'Change credentials',
  accountValidationFailedInline: (msg: string) => `❌ **Validation failed**: ${msg}`,
  appSecretPlaceholder: '32-character string',
  tenantFeishu: 'Feishu (China)',
  tenantLark: 'Lark (Global)',
  accountValidatingSummary: 'Validating...',
  accountValidatingBody: '⏳ **Validating credentials...**',
  accountSavedSummary: 'Saved',
  accountSuccessBody: (appId: string, botName: string | undefined, tenant: string) =>
    [
      '✅ **Credentials saved**',
      '',
      `**App ID**: \`${appId}\``,
      botName ? `**Bot name**: ${botName}` : '',
      `**Tenant**: ${tenant}`,
      '',
      'Reconnecting the WebSocket with the new credentials...',
      '⚠️ If the new bot is not in this group, the new bot takes over from here and the old bot stops replying.',
    ]
      .filter(Boolean)
      .join('\n'),
  accountFailureSummary: 'Validation failed',
  accountFailureBody: (reason: string) =>
    `❌ **Validation failed**\n\n\`${reason}\`\n\nCheck that the App ID and Secret are correct, then resend \`/account change\` to retry.`,
  accountCancelledBody: 'Cancelled — nothing was changed.',

  // ── templates.ts ──
  lockedPanelTitle: 'View submission',
  lockedBody: 'Got your action — this card is complete.',
  lockedHeader: '✅ Done',
  expiredSummary: 'Expired',
  expiredHeader: '⏰ Expired',
  expiredBody: 'This card has expired — please resend your request.',
  disabledNote: '_Answered with a text reply; this card is closed_',
  cwdLine: (cwd: string) => `Current cwd: \`${cwd}\``,
  noNamedWorkspaces: 'No named workspaces yet.',
  wsSaveHint: '💡 Send `/ws save <name>` to save the current cwd as a named workspace',
  switchHere: 'Switch here',
  deleteLabel: 'Delete',
  sessionStaleSuffix: ' ⚠️ stale cwd — the next message starts a new session',
  noSession: '(none)',
  topicScopeLine: (scope: string) => `\`${scope}\` _(per-topic session)_`,
  statusTitle: '📊 Status',
  noHistorySessions: 'No past sessions under this cwd.',
  resumeTitle: '🔁 Resume a past session',
  lineCount: (n: number) => `${n} entries`,
  alreadyCurrentSession: 'Current session',
  resumeThisSession: '▸ Resume this session',
  helpTitle: '💡 Help',
  helpBody: (agentName: string) =>
    [
      '**Commands**',
      '',
      "- `/new` `/reset` — clear this chat's session",
      '- `/new chat [name]` — create a new group + session and pull you in',
      '- `/resume [N]` — list and resume past sessions (up to N)',
      '- `/cd <path>` — change the working directory (resets the session)',
      '- `/ws list|save <name>|use <name>|remove <name>` — workspaces',
      '- `/account` — show the current app; `/account change` swaps appId/secret and reconnects',
      '- `/config` — adjust preferences, access control and the lark-cli identity policy',
      '- `/mention group on|off|default` — set whether this group requires @bot; off = mention-free dedicated group',
      '- `/status` — current status',
      '- `/stop` — stop the running task (or tap the ⏹ Stop button at the bottom of the card)',
      '- `/stop comment:<scopeHash>` — admin: stop a doc-comment task',
      "- `/timeout [N|off|default]` — this session's keepalive minutes; `/config` changes the global default",
      '- `/timeout comment:<scopeHash> N` — admin: set a doc-comment task keepalive',
      '- `/ps` — list all bots on this machine, marking the one replying now',
      '- `/exit <id|#>` — shut down a bot (see ids with `/ps`)',
      '- `/reconnect` — force a WebSocket reconnect (use when the bot goes quiet after network hiccups)',
      `- \`/doctor [description]\` — hand the logs and description to ${agentName} for self-diagnosis`,
      '- `/help` — this help',
      '',
      `Anything else goes straight to ${agentName}.`,
    ].join('\n'),

  // ── run-renderer.ts / text-renderer.ts ──
  interruptedNote: '_⏹ Interrupted_',
  idleTimeoutNote: (mins: number) => `_⏱ No response for ${mins} min — auto-terminated_`,
  agentFailedCard: (msg: string) => `⚠️ Agent failed: ${msg}`,
  agentFailedText: (msg: string) => `⚠️ Agent failed: ${msg}`,
  noContentNote: '_(no content returned)_',
  reasoningActive: '🧠 **Thinking**',
  reasoningDone: '🧠 **Thinking finished — click to view**',
  noToolOutput: '_no output_',
  toolSummaryTitle: (count: number, finalized: boolean) =>
    `☕ **${count} tool calls${finalized ? ' (finished)' : ''}**`,
  stopBtn: '⏹ Stop',
  footerThinking: '🧠 Thinking',
  footerToolRunning: '🧰 Running tools',
  footerStreaming: '✍️ Writing',
  summaryInterrupted: 'Interrupted',
  summaryTimeout: 'Timed out',
  summaryError: 'Error',
  summaryToolRunning: 'Running tools',
  summaryStreaming: 'Writing',
  summaryThinking: 'Thinking',
  footerThinkingText: '_🧠 Thinking…_',
  footerToolRunningText: '_🧰 Running tools…_',
  footerStreamingText: '_✍️ Writing…_',

  // ── dispatcher.ts ──
  cardExpiredNotice: '⏰ This card has expired — please resend your request and I will send a new one.',
  buttonAlreadySubmitted:
    '⚠️ This button was already submitted — each button can only be submitted once. If the earlier submission got no reply, resend your choice as a text message.',
  askAnswerEntry: (q: string, a: string | string[]) =>
    `**${q}** ${Array.isArray(a) ? a.join(', ') || '(empty)' : a || '(empty)'}`,
  yourChoice: (choices: string[]) => `Your choice: ${choices.join(', ')}`,

  // ── tool-render.ts ──
  toolRunningBody: '_running…_',
  toolBodyTruncated: (body: string) =>
    `${body}…\n\n_(body truncated — see \`/doctor\` or the log for the full content)_`,
};
