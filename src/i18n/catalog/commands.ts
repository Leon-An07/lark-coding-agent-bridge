/** commands namespace — zh-CN is the source of truth; the En object's
 * `typeof` annotation turns any missing translation into a compile error.
 * Filled by the i18n migration; keys are camelCase, parameterized entries
 * are arrow functions so params are type-checked. */

export const commandsZh = {
  // ── dispatch / shared ──
  auditSafeReply: '命令已处理。',
  resumeApplied: '已完成，请继续发送下一条消息。',
  adminOnly: '❌ 此命令仅管理员可用。',

  // ── /new ──
  newSessionInterrupted: '已中断当前任务并开始新会话。',
  newSessionStarted: '已开始新会话。',
  createChatFailed: (msg: string) =>
    `❌ 创建群失败：${msg}\n\n确认 bot 已开启 \`im:chat\` 权限。`,
  newChatWelcomeWithCwd: (cwd: string) =>
    `🎉 群已建好，cwd 继承自原群：\`${cwd}\`\n\n@我 + 任意消息开始对话。`,
  newChatWelcome: '🎉 群已建好。\n\n@我 + 任意消息开始对话。',
  chatCreated: (name: string) => `✓ 已创建群 **${name}**，去新群里继续。`,

  // ── /cd ──
  cdUsage: '用法：`/cd <绝对路径>` 或 `/cd ~/xxx`',
  cdNeedAbsolutePath: '请使用绝对路径，或 `~/xxx` 表示 home 下的子路径。',
  cdSwitched: (cwd: string) => `✓ 已切换 cwd 到 \`${cwd}\`\n（session 已重置）`,

  // ── /ws ──
  wsUsage: '用法：`/ws [list|save <name>|use <name>|remove <name>]`',
  wsSaveUsage: '用法：`/ws save <name>`',
  wsSaveNoCwd: '当前 chat 未设置 cwd，先用 `/cd` 设置再保存。',
  wsSaved: (name: string, cwd: string) => `✓ 工作目录别名已保存：\`${name}\` → ${cwd}`,
  wsUseUsage: '用法：`/ws use <name>`',
  wsAliasNotFound: (name: string) => `未找到工作目录别名：\`${name}\``,
  wsSwitched: (name: string, cwd: string) =>
    `✓ 已切换到 \`${name}\` (${cwd})\n（session 已重置）`,
  wsRemoveUsage: '用法：`/ws remove <name>`',
  wsRemoved: (name: string) => `✓ 已删除工作目录别名：\`${name}\``,

  // ── /doc ──
  docCommentInfo: '云文档评论现在不需要绑定工作区；在支持的文档评论里 @bot 即可触发回复。',

  // ── /resume ──
  resumeNeedCwd: '请先使用 /cd <path> 选择工作目录，再查看或恢复会话。',
  resumeGroupHidden: '群聊中不展示历史会话详情。请私聊 bot 使用 `/resume` 查看和选择历史会话。',
  resumeCodexAvailable: (nonce: string) =>
    `当前 Codex thread 可恢复。\n使用 \`/resume use ${nonce}\` 恢复（10 分钟内有效）。`,
  resumeCodexCandidateInvalid: '当前上下文不可恢复这个会话，请先用 `/resume` 重新生成恢复候选。',
  resumeContextMismatch: '当前上下文不可恢复这个会话，请重新选择当前工作区和权限策略下的会话。',
  resumeNoCodexThread: '当前上下文没有可恢复的 Codex thread，请先在当前工作区完成一次运行。',

  // ── /status ──
  statusSessionNotEstablished: '(未建立)',

  // ── /stop ──
  stopScopeAdminOnly: '❌ 指定 scope 停止任务仅管理员可用。',
  stopRequested: (scope: string) => `已请求停止 \`${scope}\`。`,
  stopNotFound: (scope: string) => `未找到正在运行的任务：\`${scope}\`。`,

  // ── /timeout ──
  timeoutScopeAdminOnly: '❌ 指定 scope 设置 timeout 仅管理员可用。',
  timeoutMinutes: (n: number) => `${n} 分钟`,
  timeoutGlobalDisabled: '未启用',
  timeoutUsage:
    '\n\n用法:\n- `/timeout 15` 当前 session 设 15 分钟\n- `/timeout off` 当前 session 关闭探活\n- `/timeout default` 清除 session 覆盖,回退全局\n- `/timeout comment:<scopeHash> 15` 管理员设置 comment scope\n\n_注:`/new` 会清掉当前 session 的覆盖,回到全局_',
  timeoutOffForSession: '已关闭（当前 session）',
  timeoutStatusOverride: (scopeLabel: string, effective: string, globalText: string) =>
    `⏱ 当前 session${scopeLabel} 探活:${effective}\n全局默认:${globalText}`,
  timeoutStatusGlobal: (scopeLabel: string, globalText: string) =>
    `⏱ 当前 session${scopeLabel} 探活:跟随全局(${globalText})`,
  timeoutCleared: (globalText: string) =>
    `✅ 已清除 session 覆盖,回退到全局(${globalText})。`,
  timeoutNoOverride: (globalText: string) =>
    `当前 session 本来就没设过覆盖,跟随全局(${globalText})。`,
  timeoutDisabled: '✅ 已关闭当前 session 的探活。',
  timeoutInvalid: '❌ 用法:`/timeout <1-120>` / `/timeout off` / `/timeout default`',
  timeoutSet: (n: number) => `✅ 当前 session 探活已设为 ${n} 分钟。`,

  // ── /ps ──
  psNoBots: '当前没有 bot 在运行(理论上不可能,你正在跟其中之一对话…)',
  psTableHeader: '| # | ID | Bot | 启动 |',
  psCurrentMarker: ' ← 当前正在回复',
  psTitle: (count: number) => `🧭 **当前有 ${count} 个 bot 在运行**`,
  psFooter: (processId: string) =>
    `用 \`/exit <id|#>\` 关掉某一个;\`/exit ${processId}\` 关掉正在回复你的这个 bot。`,
  agoSeconds: (n: number) => `${n}s 前`,
  agoMinutes: (n: number) => `${n}m 前`,
  agoHours: (n: number) => `${n}h 前`,
  agoDays: (n: number) => `${n}d 前`,

  // ── /exit ──
  exitUsage: (processId: string) =>
    `用法:\`/exit <id|#>\` —— \`id\` 是 \`/ps\` 显示的短 id,\`#\` 是序号。\n当前正在回复你的是 \`${processId}\`。`,
  exitNotFound: (target: string) => `❌ 没找到匹配的 bot:\`${target}\`。发 \`/ps\` 看可选目标。`,
  exitSelf: (id: string) => `👋 即将关闭当前 bot \`${id}\`,再见。`,
  exitFailed: (id: string, message: string) => `❌ 关掉 bot \`${id}\` 失败:${message}`,
  exitPending: (id: string) => `📨 已请求关闭 \`${id}\`,但还在收尾。再发 \`/ps\` 复查一下。`,
  exitClosed: (id: string) => `✓ 已关闭 bot \`${id}\`。`,

  // ── /reconnect ──
  reconnectAfterRun: '⏳ 将在当前运行结束后重连…',
  reconnectNow: '⏳ 正在停止当前运行并重连…',
  reconnectFailed: (msg: string) => `❌ 重连失败:${msg}`,

  // ── /doctor ──
  doctorRateLimited: 'doctor rate limited: 同一用户 30 秒内只能触发一次。',
  doctorNoWorkspace:
    '未设置工作目录。先用 `/cd <path>` 或 `/ws use <name>` 选择工作目录后再运行 agent echo check。',
  doctorWorkspaceUnavailable: (userVisible: string) =>
    `${userVisible} 工作目录不可用时只执行 self-check，不启动 agent。`,
  doctorInFlight: 'doctor in-flight: 当前 profile 已有诊断运行中。',
  doctorAck: '🔍 已收到诊断请求，分析结果将私信发给你。',
  doctorWorkspaceUnset: '(未设置)',

  // ── /account ──
  accountUsage: '用法：`/account` 或 `/account change`',
  accountEmptyCredentials: 'App ID 或 App Secret 为空',
  accountSaveFailed: (msg: string) => `保存凭据失败：${msg}`,

  // ── /invite ──
  inviteNoKnownChats: '当前 bot 还不在任何群里，没有可加入的群。',
  inviteAllGroupsAdded: (added: number, total: number) =>
    `✅ 已把 bot 所在的 ${added} 个群加入响应群名单（共 ${total} 个）。`,
  inviteUsage:
    '用法：\n• `/invite user @某人` — 加入允许私聊\n• `/invite admin @某人` — 加入管理员\n• `/invite group` — 把当前群加入响应群名单\n• `/invite all group` — 把 bot 所在的所有群一键加入',
  inviteGroupInP2p: '❌ `/invite group` 只能在群里发，在私聊里没有 chat_id 可以加。',
  inviteGroupAlready: '✅ 当前群已在白名单里，无需重复添加。',
  inviteGroupAdded: (chatId: string) => `✅ 已把当前群（\`${chatId}\`）加入响应群名单。`,
  inviteNoMention: (kind: string) =>
    `❌ 没检测到 @ 的用户。请像这样发：\`/invite ${kind} @某人\`（注意 @ 用户不是 @ bot）。`,
  accessLabelUsers: '用户白名单',
  accessLabelAdmins: '管理员',
  inviteAdded: (names: string[], label: string) => `✅ 已把 ${names.join('、')} 加入${label}。`,
  inviteAlreadyIn: (names: string[], label: string) =>
    `_${names.join('、')} 已经在${label}里，跳过。_`,

  // ── /remove ──
  removeUsage:
    '用法：\n• `/remove user @某人` — 移出用户白名单\n• `/remove admin @某人` — 移出管理员\n• `/remove group` — 把当前群移出响应群名单',
  removeGroupInP2p: '`/remove group` 请在要移除的群里发，私聊里没有可移除的群。',
  removeGroupNotIn: '✅ 当前群本来就不在响应名单里，无需移除。',
  removeGroupDone: '✅ 已把当前群移出响应群名单。',
  removeNoMention: (kind: string) => `请 @ 上要移除的人，例如：\`/remove ${kind} @某人\`。`,
  removeRemoved: (names: string[], label: string) =>
    `✅ 已把 ${names.join('、')} 移出${label}。`,
  removeNotThere: (names: string[], label: string) =>
    `${names.join('、')} 本来就不在${label}里，无需移除。`,

  // ── /mention ──
  mentionUsage:
    '用法：\n• `/mention group on` — 当前群必须 @bot 才触发\n• `/mention group off` — 当前群设为专属群免 @（普通消息也触发，不建议多 bot 群开启）\n• `/mention group default` — 当前群跟随 `/config` 的全局设置',
  mentionGroupInP2p: '`/mention group` 请在要设置的群里发，私聊里没有群策略可改。',
  mentionRequireLabel: '需要 @bot',
  mentionExemptShort: '专属群免 @',
  mentionExemptLabel: '专属群免 @（普通消息也会触发）',
  mentionResetToDefault: (label: string) =>
    `✅ 当前群已恢复为跟随全局设置（全局默认）：${label}。`,
  mentionMultiBotWarning:
    '\n\n⚠️ 如果这个群里有多个 bot，不建议开启免 @，否则普通消息可能让多个 bot 同时响应。',
  mentionSet: (label: string, warning: string) =>
    `✅ 当前群已设置为：${label}。这只影响当前群，不修改 /config 的全局默认值。${warning}`,

  // ── /config ──
  configUsage: '用法:`/config`',
  configFailRollbackFailed: '保存失败，且 lark-cli 身份策略回滚失败。请执行 /status 检查当前状态。',
  configFailRolledBack: '保存失败，lark-cli 身份策略已回滚。请重新打开 /config 确认当前状态。',
  configFailPolicyNotApplied: 'lark-cli 身份策略未生效，未做任何修改。',
  configFailNotWritten: '配置未写入，未做任何修改。',

  // ── /meeting ──
  meetingDisabled:
    '会议智能体未启用。在 `/config` 或 Web 控制台里开启「会议智能体」后重启 bot 即可。',
  meetingNotReady: '会议能力未就绪（channel 未连接或启用后尚未重启）。',
  meetingJoinUsage: '用法：`/meeting join <9位会议号>`（只接受 9 位纯数字，不是会议链接）',
  meetingJoined: (topic: string, meetingNo: string, trigger: string) =>
    `✅ 已入会 **${topic}**\n` +
    `会议号 ${meetingNo} · 会中发 \`${trigger} 你的问题\` 可以问我\n` +
    '`/meeting notes` 总结 · `/meeting leave` 离会',
  meetingJoinFailed: (detail: string) => `入会失败：${detail}`,
  meetingLeft: (meetingNo: string) => `✅ 已离会（会议号 ${meetingNo}）`,
  meetingTranscriptEmpty:
    '字幕缓冲为空 —— agent 这次拿到的会议上下文是「（暂无字幕）」。\n' +
    '注意：同一场会里 agent 复用一个会话，**早先轮次**的字幕仍留在它自己的对话历史里，' +
    '所以它可能引用缓冲里已经没有的内容。`/new` 可以清掉该会话记忆。',
  meetingTranscriptHeader: (total: number, shown: number) =>
    `字幕缓冲共 ${total} 条${shown < total ? `，以下是最近 ${shown} 条` : ''}：`,
  meetingStopped: '✅ 已中断该会议的当前任务。',
  meetingNothingToStop: '该会议当前没有正在执行的任务。',
  meetingAskUsage: '用法：`/meeting ask <问题>`',
  meetingNoExecutor: '当前上下文无法执行 agent（缺少 run executor）。',
  meetingSummarizing: '正在总结会议…',
  meetingThinking: '正在思考…',
  meetingNoAnswer: '（没有产生回答）',
  meetingRunFailed: (detail: string) => `执行失败：${detail}`,
  meetingHelp:
    '用法：\n' +
    '`/meeting` — 状态\n' +
    '`/meeting join <9位会议号>` — 让 bot 入会\n' +
    '`/meeting leave [会议号]` — 离会\n' +
    '`/meeting notes [会议号]` — 基于字幕做纪要（只发给你）\n' +
    '`/meeting stop [会议号]` — 中断该会议卡住的任务\n' +
    '`/meeting transcript [会议号]` — 看 agent 实际拿到的字幕上下文\n' +
    '`/meeting ask <问题>` — 带会议上下文提问',
  meetingNotFound: (meetingNo: string) =>
    `没找到会议号 ${meetingNo} 对应的会议。用 \`/meeting\` 看当前在跟哪几场。`,
  meetingNoneActive: '当前没有在跟的会议。先 `/meeting join <9位会议号>`。',
  meetingPickOne: (count: number, list: string, exampleNo: string) =>
    `当前在跟 ${count} 场会议，请指定会议号：\n${list}\n\n例如 \`/meeting notes ${exampleNo}\``,
  meetingPushHooked: (received: number) =>
    `推送：已挂载，累计收到 ${received} 条${received === 0 ? '（尚未收到，可能还没在后台订阅 vc.bot.* 事件）' : ''}`,
  meetingPushUnhooked: (reason: string) => `推送：未挂载（${reason}），仅靠轮询`,
  meetingUnknownReason: '未知原因',
  meetingStatusNone: (pushLine: string) =>
    `当前没有在跟的会议。\n${pushLine}\n\n\`/meeting join <9位会议号>\` 开始。`,
  meetingStatusHeader: (count: number) => `正在跟 ${count} 场会议：`,
  meetingStatusLine: (
    title: string,
    meetingNo: string,
    viaPush: boolean,
    transcriptLines: number,
    participants: number,
  ) =>
    `- **${title}**（${meetingNo}）· 来源 ${viaPush ? '推送' : '轮询'}` +
    ` · 字幕 ${transcriptLines} 条 · 参会 ${participants} 人`,
  // in-meeting chat lane + end-of-meeting summary (meeting/orchestrator.ts)
  meetingLaneStopped: '已中断当前任务。',
  meetingLaneNothingToStop: '当前没有正在执行的任务。',
  meetingLaneBusy: (prefix: string) =>
    `上一个任务还在执行。发「${prefix} stop」可以中断它，然后再问我。`,
  meetingSummaryTitle: (title: string) => `**会议纪要 · ${title}**`,
  // meeting/manager.ts, meeting/api.ts
  meetingPushNoRawEvent:
    'channel 不支持 onRawEvent（需要 @larksuite/channel >= 0.5.0），已降级为轮询',
  meetingPushHookFailed: (err: string) => `注册事件失败：${err}`,
  meetingNotInGray: '智能体入会能力尚未对本应用开通（错误码 20017）。需要先申请加入内测，再重试。',
  meetingNoInvalid: (raw: string) => `会议号必须是 9 位数字：${raw}`,
  meetingJoinNoId: '入会成功但未返回 meeting.id',
};

export const commandsEn: typeof commandsZh = {
  // ── dispatch / shared ──
  auditSafeReply: 'Command processed.',
  resumeApplied: 'Done. Send your next message to continue.',
  adminOnly: '❌ This command is admin-only.',

  // ── /new ──
  newSessionInterrupted: 'Interrupted the current task and started a new session.',
  newSessionStarted: 'Started a new session.',
  createChatFailed: (msg: string) =>
    `❌ Failed to create the chat: ${msg}\n\nMake sure the bot has the \`im:chat\` permission enabled.`,
  newChatWelcomeWithCwd: (cwd: string) =>
    `🎉 Chat created — cwd inherited from the original chat: \`${cwd}\`\n\n@me with any message to start.`,
  newChatWelcome: '🎉 Chat created.\n\n@me with any message to start.',
  chatCreated: (name: string) => `✓ Created chat **${name}** — continue there.`,

  // ── /cd ──
  cdUsage: 'Usage: `/cd <absolute path>` or `/cd ~/xxx`',
  cdNeedAbsolutePath: 'Use an absolute path, or `~/xxx` for a path under home.',
  cdSwitched: (cwd: string) => `✓ Switched cwd to \`${cwd}\`\n(session reset)`,

  // ── /ws ──
  wsUsage: 'Usage: `/ws [list|save <name>|use <name>|remove <name>]`',
  wsSaveUsage: 'Usage: `/ws save <name>`',
  wsSaveNoCwd: 'This chat has no cwd yet — set one with `/cd` first, then save.',
  wsSaved: (name: string, cwd: string) => `✓ Workspace alias saved: \`${name}\` → ${cwd}`,
  wsUseUsage: 'Usage: `/ws use <name>`',
  wsAliasNotFound: (name: string) => `Workspace alias not found: \`${name}\``,
  wsSwitched: (name: string, cwd: string) => `✓ Switched to \`${name}\` (${cwd})\n(session reset)`,
  wsRemoveUsage: 'Usage: `/ws remove <name>`',
  wsRemoved: (name: string) => `✓ Removed workspace alias: \`${name}\``,

  // ── /doc ──
  docCommentInfo:
    'Doc comments no longer need a bound workspace; @-mention the bot in a supported doc comment to trigger a reply.',

  // ── /resume ──
  resumeNeedCwd: 'Pick a working directory with /cd <path> first, then view or resume sessions.',
  resumeGroupHidden:
    'Session history is not shown in group chats. DM the bot and use `/resume` to view and pick one.',
  resumeCodexAvailable: (nonce: string) =>
    `The current Codex thread can be resumed.\nUse \`/resume use ${nonce}\` to resume (valid for 10 minutes).`,
  resumeCodexCandidateInvalid:
    'This session cannot be resumed in the current context — run `/resume` again to regenerate candidates.',
  resumeContextMismatch:
    'This session cannot be resumed in the current context — pick one under the current workspace and permission policy.',
  resumeNoCodexThread:
    'No resumable Codex thread in the current context — complete a run in this workspace first.',

  // ── /status ──
  statusSessionNotEstablished: '(not established)',

  // ── /stop ──
  stopScopeAdminOnly: '❌ Stopping a specific scope is admin-only.',
  stopRequested: (scope: string) => `Stop requested for \`${scope}\`.`,
  stopNotFound: (scope: string) => `No running task found: \`${scope}\`.`,

  // ── /timeout ──
  timeoutScopeAdminOnly: '❌ Setting a timeout for a specific scope is admin-only.',
  timeoutMinutes: (n: number) => `${n} min`,
  timeoutGlobalDisabled: 'disabled',
  timeoutUsage:
    '\n\nUsage:\n- `/timeout 15` set 15 min for this session\n- `/timeout off` disable the idle probe for this session\n- `/timeout default` clear the session override, fall back to global\n- `/timeout comment:<scopeHash> 15` admin: set a comment scope\n\n_Note: `/new` clears this session\'s override and returns to global_',
  timeoutOffForSession: 'off (this session)',
  timeoutStatusOverride: (scopeLabel: string, effective: string, globalText: string) =>
    `⏱ Session${scopeLabel} idle probe: ${effective}\nGlobal default: ${globalText}`,
  timeoutStatusGlobal: (scopeLabel: string, globalText: string) =>
    `⏱ Session${scopeLabel} idle probe: following global (${globalText})`,
  timeoutCleared: (globalText: string) =>
    `✅ Session override cleared — back to global (${globalText}).`,
  timeoutNoOverride: (globalText: string) =>
    `This session has no override — following global (${globalText}).`,
  timeoutDisabled: '✅ Idle probe disabled for this session.',
  timeoutInvalid: '❌ Usage: `/timeout <1-120>` / `/timeout off` / `/timeout default`',
  timeoutSet: (n: number) => `✅ Session idle probe set to ${n} minutes.`,

  // ── /ps ──
  psNoBots: 'No bots running (theoretically impossible — you are talking to one of them…)',
  psTableHeader: '| # | ID | Bot | Started |',
  psCurrentMarker: ' ← replying to you now',
  psTitle: (count: number) => `🧭 **${count} bot(s) running**`,
  psFooter: (processId: string) =>
    `Use \`/exit <id|#>\` to shut one down; \`/exit ${processId}\` shuts down the bot replying to you.`,
  agoSeconds: (n: number) => `${n}s ago`,
  agoMinutes: (n: number) => `${n}m ago`,
  agoHours: (n: number) => `${n}h ago`,
  agoDays: (n: number) => `${n}d ago`,

  // ── /exit ──
  exitUsage: (processId: string) =>
    `Usage: \`/exit <id|#>\` — \`id\` is the short id shown by \`/ps\`, \`#\` is the row number.\nThe bot replying to you is \`${processId}\`.`,
  exitNotFound: (target: string) =>
    `❌ No matching bot: \`${target}\`. Send \`/ps\` to see available targets.`,
  exitSelf: (id: string) => `👋 Shutting down this bot \`${id}\` — bye.`,
  exitFailed: (id: string, message: string) => `❌ Failed to shut down bot \`${id}\`: ${message}`,
  exitPending: (id: string) =>
    `📨 Shutdown requested for \`${id}\`, still finishing up. Send \`/ps\` again to check.`,
  exitClosed: (id: string) => `✓ Bot \`${id}\` shut down.`,

  // ── /reconnect ──
  reconnectAfterRun: '⏳ Reconnecting after the current run finishes…',
  reconnectNow: '⏳ Stopping the current run and reconnecting…',
  reconnectFailed: (msg: string) => `❌ Reconnect failed: ${msg}`,

  // ── /doctor ──
  doctorRateLimited: 'doctor rate limited: one trigger per user every 30 seconds.',
  doctorNoWorkspace:
    'No working directory set. Use `/cd <path>` or `/ws use <name>` first, then run the agent echo check.',
  doctorWorkspaceUnavailable: (userVisible: string) =>
    `${userVisible} Workspace unavailable — running self-check only, agent not started.`,
  doctorInFlight: 'doctor in-flight: a diagnostic run is already in progress for this profile.',
  doctorAck: '🔍 Diagnostic request received — the analysis will be sent to you in a DM.',
  doctorWorkspaceUnset: '(not set)',

  // ── /account ──
  accountUsage: 'Usage: `/account` or `/account change`',
  accountEmptyCredentials: 'App ID or App Secret is empty',
  accountSaveFailed: (msg: string) => `Failed to save credentials: ${msg}`,

  // ── /invite ──
  inviteNoKnownChats: 'The bot is not in any group yet — nothing to add.',
  inviteAllGroupsAdded: (added: number, total: number) =>
    `✅ Added ${added} group(s) the bot is in to the allowed-chats list (${total} total).`,
  inviteUsage:
    'Usage:\n• `/invite user @someone` — allow DMs\n• `/invite admin @someone` — add as admin\n• `/invite group` — add this group to the allowed-chats list\n• `/invite all group` — add every group the bot is in',
  inviteGroupInP2p: '❌ `/invite group` only works in a group — a DM has no chat_id to add.',
  inviteGroupAlready: '✅ This group is already on the allowlist.',
  inviteGroupAdded: (chatId: string) =>
    `✅ Added this group (\`${chatId}\`) to the allowed-chats list.`,
  inviteNoMention: (kind: string) =>
    `❌ No @-mentioned user detected. Send it like: \`/invite ${kind} @someone\` (note: @ the user, not the bot).`,
  accessLabelUsers: 'user allowlist',
  accessLabelAdmins: 'admin list',
  inviteAdded: (names: string[], label: string) =>
    `✅ Added ${names.join(', ')} to the ${label}.`,
  inviteAlreadyIn: (names: string[], label: string) =>
    `_${names.join(', ')} already in the ${label}, skipped._`,

  // ── /remove ──
  removeUsage:
    'Usage:\n• `/remove user @someone` — remove from the user allowlist\n• `/remove admin @someone` — remove from the admin list\n• `/remove group` — remove this group from the allowed-chats list',
  removeGroupInP2p:
    'Send `/remove group` in the group you want to remove — a DM has no group to remove.',
  removeGroupNotIn: '✅ This group is not on the allowed-chats list — nothing to remove.',
  removeGroupDone: '✅ Removed this group from the allowed-chats list.',
  removeNoMention: (kind: string) =>
    `@-mention who to remove, e.g. \`/remove ${kind} @someone\`.`,
  removeRemoved: (names: string[], label: string) =>
    `✅ Removed ${names.join(', ')} from the ${label}.`,
  removeNotThere: (names: string[], label: string) =>
    `${names.join(', ')} not in the ${label} — nothing to remove.`,

  // ── /mention ──
  mentionUsage:
    'Usage:\n• `/mention group on` — this group requires @bot to trigger\n• `/mention group off` — dedicated group, no @ needed (any message triggers; not recommended with multiple bots)\n• `/mention group default` — follow the global `/config` setting',
  mentionGroupInP2p: 'Send `/mention group` in the target group — a DM has no group policy.',
  mentionRequireLabel: '@bot required',
  mentionExemptShort: 'dedicated group, no @ needed',
  mentionExemptLabel: 'dedicated group, no @ needed (any message triggers)',
  mentionResetToDefault: (label: string) =>
    `✅ This group now follows the global setting (default): ${label}.`,
  mentionMultiBotWarning:
    '\n\n⚠️ With multiple bots in this group, enabling no-@ is not recommended — an ordinary message could trigger several bots at once.',
  mentionSet: (label: string, warning: string) =>
    `✅ This group is now set to: ${label}. This only affects this group and does not change the global \`/config\` default.${warning}`,

  // ── /config ──
  configUsage: 'Usage: `/config`',
  configFailRollbackFailed:
    'Save failed, and rolling back the lark-cli identity policy also failed. Run /status to check the current state.',
  configFailRolledBack:
    'Save failed; the lark-cli identity policy was rolled back. Reopen /config to confirm the current state.',
  configFailPolicyNotApplied: 'lark-cli identity policy not applied; nothing was changed.',
  configFailNotWritten: 'Config not written; nothing was changed.',

  // ── /meeting ──
  meetingDisabled:
    'The meeting agent is not enabled. Turn on "Meeting agent" in `/config` or the Web console, then restart the bot.',
  meetingNotReady:
    'Meeting features are not ready (the channel is not connected, or the bot has not restarted since enabling them).',
  meetingJoinUsage:
    'Usage: `/meeting join <9-digit meeting number>` (9 digits only, not a meeting link)',
  meetingJoined: (topic: string, meetingNo: string, trigger: string) =>
    `✅ Joined **${topic}**\n` +
    `Meeting number ${meetingNo} · send \`${trigger} your question\` in the meeting chat to ask me\n` +
    '`/meeting notes` to summarize · `/meeting leave` to leave',
  meetingJoinFailed: (detail: string) => `Failed to join the meeting: ${detail}`,
  meetingLeft: (meetingNo: string) => `✅ Left the meeting (meeting number ${meetingNo})`,
  meetingTranscriptEmpty:
    'The caption buffer is empty, so the agent got "(no captions yet)" as meeting context this time.\n' +
    'Note: the agent reuses one session per meeting, so captions from **earlier turns** stay in its own conversation history ' +
    'and it may quote content that is no longer in the buffer. `/new` clears that session memory.',
  meetingTranscriptHeader: (total: number, shown: number) =>
    `${total} lines in the caption buffer${shown < total ? `; the latest ${shown} are below` : ''}:`,
  meetingStopped: "✅ Stopped this meeting's current task.",
  meetingNothingToStop: 'This meeting has no task running.',
  meetingAskUsage: 'Usage: `/meeting ask <question>`',
  meetingNoExecutor: 'Cannot run the agent in this context (no run executor).',
  meetingSummarizing: 'Summarizing the meeting…',
  meetingThinking: 'Thinking…',
  meetingNoAnswer: '(No answer was produced)',
  meetingRunFailed: (detail: string) => `Run failed: ${detail}`,
  meetingHelp:
    'Usage:\n' +
    '`/meeting` — status\n' +
    '`/meeting join <9-digit meeting number>` — have the bot join\n' +
    '`/meeting leave [meeting number]` — leave\n' +
    '`/meeting notes [meeting number]` — summarize from the captions (sent only to you)\n' +
    "`/meeting stop [meeting number]` — stop the meeting's stuck task\n" +
    '`/meeting transcript [meeting number]` — show the caption context the agent actually gets\n' +
    '`/meeting ask <question>` — ask with the meeting as context',
  meetingNotFound: (meetingNo: string) =>
    `No meeting found with number ${meetingNo}. Send \`/meeting\` to see which meetings are being followed.`,
  meetingNoneActive: 'No meeting is being followed. Start with `/meeting join <9-digit meeting number>`.',
  meetingPickOne: (count: number, list: string, exampleNo: string) =>
    `Following ${count} meetings. Specify a meeting number:\n${list}\n\nFor example \`/meeting notes ${exampleNo}\``,
  meetingPushHooked: (received: number) =>
    `Push: attached, ${received} events received${received === 0 ? ' (none yet; the vc.bot.* events may not be subscribed in the developer console)' : ''}`,
  meetingPushUnhooked: (reason: string) => `Push: not attached (${reason}); polling only`,
  meetingUnknownReason: 'unknown reason',
  meetingStatusNone: (pushLine: string) =>
    `No meeting is being followed.\n${pushLine}\n\nStart with \`/meeting join <9-digit meeting number>\`.`,
  meetingStatusHeader: (count: number) => `Following ${count} meetings:`,
  meetingStatusLine: (
    title: string,
    meetingNo: string,
    viaPush: boolean,
    transcriptLines: number,
    participants: number,
  ) =>
    `- **${title}** (${meetingNo}) · source ${viaPush ? 'push' : 'polling'}` +
    ` · ${transcriptLines} caption lines · ${participants} participants`,
  // in-meeting chat lane + end-of-meeting summary (meeting/orchestrator.ts)
  meetingLaneStopped: 'Stopped the current task.',
  meetingLaneNothingToStop: 'No task is running.',
  meetingLaneBusy: (prefix: string) =>
    `The previous task is still running. Send "${prefix} stop" to stop it, then ask again.`,
  meetingSummaryTitle: (title: string) => `**Meeting notes · ${title}**`,
  // meeting/manager.ts, meeting/api.ts
  meetingPushNoRawEvent:
    'the channel does not support onRawEvent (needs @larksuite/channel >= 0.5.0); fell back to polling',
  meetingPushHookFailed: (err: string) => `failed to register events: ${err}`,
  meetingNotInGray:
    'Meeting join for agents is not enabled for this app yet (error code 20017). Apply to join the beta first, then try again.',
  meetingNoInvalid: (raw: string) => `The meeting number must be 9 digits: ${raw}`,
  meetingJoinNoId: 'Joined the meeting, but no meeting.id was returned',
};

export const commandsJa: typeof commandsZh = {
  // ── dispatch / shared ──
  auditSafeReply: 'コマンドを処理しました。',
  resumeApplied: '完了しました。次のメッセージを送って続けてください。',
  adminOnly: '❌ このコマンドは管理者専用です。',

  // ── /new ──
  newSessionInterrupted: '現在のタスクを中断し、新しいセッションを開始しました。',
  newSessionStarted: '新しいセッションを開始しました。',
  createChatFailed: (msg: string) =>
    `❌ グループの作成に失敗しました：${msg}\n\nbot の \`im:chat\` 権限が有効になっているか確認してください。`,
  newChatWelcomeWithCwd: (cwd: string) =>
    `🎉 グループを作成しました。cwd は元のグループから継承：\`${cwd}\`\n\nbot を@メンションして任意のメッセージを送ると、会話を開始できます。`,
  newChatWelcome: '🎉 グループを作成しました。\n\nbot を@メンションして任意のメッセージを送ると、会話を開始できます。',
  chatCreated: (name: string) => `✓ グループ **${name}** を作成しました。新しいグループで続けてください。`,

  // ── /cd ──
  cdUsage: '使い方：`/cd <絶対パス>` または `/cd ~/xxx`',
  cdNeedAbsolutePath: '絶対パス、または home 配下を表す `~/xxx` を使用してください。',
  cdSwitched: (cwd: string) => `✓ cwd を \`${cwd}\` に切り替えました\n（session はリセット済み）`,

  // ── /ws ──
  wsUsage: '使い方：`/ws [list|save <name>|use <name>|remove <name>]`',
  wsSaveUsage: '使い方：`/ws save <name>`',
  wsSaveNoCwd: 'この chat には cwd が未設定です。先に `/cd` で設定してから保存してください。',
  wsSaved: (name: string, cwd: string) => `✓ ワークスペースのエイリアスを保存しました：\`${name}\` → ${cwd}`,
  wsUseUsage: '使い方：`/ws use <name>`',
  wsAliasNotFound: (name: string) => `ワークスペースのエイリアスが見つかりません：\`${name}\``,
  wsSwitched: (name: string, cwd: string) =>
    `✓ \`${name}\` (${cwd}) に切り替えました\n（session はリセット済み）`,
  wsRemoveUsage: '使い方：`/ws remove <name>`',
  wsRemoved: (name: string) => `✓ ワークスペースのエイリアスを削除しました：\`${name}\``,

  // ── /doc ──
  docCommentInfo:
    'ドキュメントのコメントはワークスペースのバインドが不要になりました。対応ドキュメントのコメントで bot を@メンションすると返信がトリガーされます。',

  // ── /resume ──
  resumeNeedCwd: '先に /cd <path> で作業ディレクトリを選択してから、セッションの表示・復元を行ってください。',
  resumeGroupHidden:
    'グループチャットではセッション履歴の詳細を表示しません。bot に DM で `/resume` を送って表示・選択してください。',
  resumeCodexAvailable: (nonce: string) =>
    `現在の Codex thread は復元できます。\n\`/resume use ${nonce}\` で復元してください（10 分間有効）。`,
  resumeCodexCandidateInvalid:
    '現在のコンテキストではこのセッションを復元できません。先に `/resume` で復元候補を再生成してください。',
  resumeContextMismatch:
    '現在のコンテキストではこのセッションを復元できません。現在のワークスペースと権限ポリシーのセッションを選び直してください。',
  resumeNoCodexThread:
    '現在のコンテキストに復元可能な Codex thread がありません。先に現在のワークスペースで一度実行を完了してください。',

  // ── /status ──
  statusSessionNotEstablished: '(未確立)',

  // ── /stop ──
  stopScopeAdminOnly: '❌ scope を指定したタスク停止は管理者専用です。',
  stopRequested: (scope: string) => `\`${scope}\` の停止をリクエストしました。`,
  stopNotFound: (scope: string) => `実行中のタスクが見つかりません：\`${scope}\`。`,

  // ── /timeout ──
  timeoutScopeAdminOnly: '❌ scope を指定した timeout 設定は管理者専用です。',
  timeoutMinutes: (n: number) => `${n} 分`,
  timeoutGlobalDisabled: '無効',
  timeoutUsage:
    '\n\n使い方:\n- `/timeout 15` 現在の session を 15 分に設定\n- `/timeout off` 現在の session のアイドル監視を無効化\n- `/timeout default` session の上書きを解除してグローバル設定に戻す\n- `/timeout comment:<scopeHash> 15` 管理者が comment scope を設定\n\n_注: `/new` は現在の session の上書きを解除し、グローバル設定に戻します_',
  timeoutOffForSession: '無効（現在の session）',
  timeoutStatusOverride: (scopeLabel: string, effective: string, globalText: string) =>
    `⏱ 現在の session${scopeLabel} のアイドル監視:${effective}\nグローバル既定:${globalText}`,
  timeoutStatusGlobal: (scopeLabel: string, globalText: string) =>
    `⏱ 現在の session${scopeLabel} のアイドル監視:グローバル設定に従う(${globalText})`,
  timeoutCleared: (globalText: string) =>
    `✅ session の上書きを解除し、グローバル設定(${globalText})に戻しました。`,
  timeoutNoOverride: (globalText: string) =>
    `現在の session に上書きはもともと設定されておらず、グローバル設定(${globalText})に従っています。`,
  timeoutDisabled: '✅ 現在の session のアイドル監視を無効化しました。',
  timeoutInvalid: '❌ 使い方:`/timeout <1-120>` / `/timeout off` / `/timeout default`',
  timeoutSet: (n: number) => `✅ 現在の session のアイドル監視を ${n} 分に設定しました。`,

  // ── /ps ──
  psNoBots: '実行中の bot はありません(理論上あり得ません。あなたはそのうちの 1 つと会話中です…)',
  psTableHeader: '| # | ID | Bot | 起動 |',
  psCurrentMarker: ' ← 現在応答中',
  psTitle: (count: number) => `🧭 **現在 ${count} 個の bot が実行中**`,
  psFooter: (processId: string) =>
    `\`/exit <id|#>\` でいずれかを終了できます。\`/exit ${processId}\` は現在応答中のこの bot を終了します。`,
  agoSeconds: (n: number) => `${n}s 前`,
  agoMinutes: (n: number) => `${n}m 前`,
  agoHours: (n: number) => `${n}h 前`,
  agoDays: (n: number) => `${n}d 前`,

  // ── /exit ──
  exitUsage: (processId: string) =>
    `使い方:\`/exit <id|#>\` —— \`id\` は \`/ps\` に表示される短い id、\`#\` は行番号です。\n現在応答中の bot は \`${processId}\` です。`,
  exitNotFound: (target: string) =>
    `❌ 一致する bot が見つかりません:\`${target}\`。\`/ps\` で対象を確認してください。`,
  exitSelf: (id: string) => `👋 現在の bot \`${id}\` をまもなく終了します。さようなら。`,
  exitFailed: (id: string, message: string) => `❌ bot \`${id}\` の終了に失敗しました:${message}`,
  exitPending: (id: string) =>
    `📨 \`${id}\` の終了をリクエストしましたが、まだ後処理中です。もう一度 \`/ps\` で確認してください。`,
  exitClosed: (id: string) => `✓ bot \`${id}\` を終了しました。`,

  // ── /reconnect ──
  reconnectAfterRun: '⏳ 現在の実行が終了した後に再接続します…',
  reconnectNow: '⏳ 現在の実行を停止して再接続しています…',
  reconnectFailed: (msg: string) => `❌ 再接続に失敗しました:${msg}`,

  // ── /doctor ──
  doctorRateLimited: 'doctor rate limited: 同一ユーザーは 30 秒に 1 回のみ実行できます。',
  doctorNoWorkspace:
    '作業ディレクトリが未設定です。先に `/cd <path>` または `/ws use <name>` で作業ディレクトリを選択してから agent echo check を実行してください。',
  doctorWorkspaceUnavailable: (userVisible: string) =>
    `${userVisible} 作業ディレクトリが利用できない場合は self-check のみを実行し、agent は起動しません。`,
  doctorInFlight: 'doctor in-flight: この profile では診断がすでに実行中です。',
  doctorAck: '🔍 診断リクエストを受け付けました。分析結果は DM でお送りします。',
  doctorWorkspaceUnset: '(未設定)',

  // ── /account ──
  accountUsage: '使い方：`/account` または `/account change`',
  accountEmptyCredentials: 'App ID または App Secret が空です',
  accountSaveFailed: (msg: string) => `認証情報の保存に失敗しました：${msg}`,

  // ── /invite ──
  inviteNoKnownChats: 'bot はまだどのグループにも参加しておらず、追加できるグループがありません。',
  inviteAllGroupsAdded: (added: number, total: number) =>
    `✅ bot が参加している ${added} 個のグループを応答許可リストに追加しました（全 ${total} 個）。`,
  inviteUsage:
    '使い方：\n• `/invite user @ユーザー` — DM を許可\n• `/invite admin @ユーザー` — 管理者に追加\n• `/invite group` — 現在のグループを応答許可リストに追加\n• `/invite all group` — bot が参加している全グループを一括追加',
  inviteGroupInP2p: '❌ `/invite group` はグループ内でのみ送信できます。DM には追加できる chat_id がありません。',
  inviteGroupAlready: '✅ 現在のグループはすでに許可リストにあります。重複追加は不要です。',
  inviteGroupAdded: (chatId: string) => `✅ 現在のグループ（\`${chatId}\`）を応答許可リストに追加しました。`,
  inviteNoMention: (kind: string) =>
    `❌ @メンションされたユーザーが見つかりません。次のように送ってください：\`/invite ${kind} @ユーザー\`（bot ではなくユーザーを @ してください）。`,
  accessLabelUsers: 'ユーザー許可リスト',
  accessLabelAdmins: '管理者リスト',
  inviteAdded: (names: string[], label: string) => `✅ ${names.join('、')} を${label}に追加しました。`,
  inviteAlreadyIn: (names: string[], label: string) =>
    `_${names.join('、')} はすでに${label}にいるため、スキップしました。_`,

  // ── /remove ──
  removeUsage:
    '使い方：\n• `/remove user @ユーザー` — ユーザー許可リストから削除\n• `/remove admin @ユーザー` — 管理者リストから削除\n• `/remove group` — 現在のグループを応答許可リストから削除',
  removeGroupInP2p: '`/remove group` は削除したいグループ内で送信してください。DM には削除できるグループがありません。',
  removeGroupNotIn: '✅ 現在のグループはもともと応答許可リストにないため、削除は不要です。',
  removeGroupDone: '✅ 現在のグループを応答許可リストから削除しました。',
  removeNoMention: (kind: string) => `削除する相手を @ してください。例：\`/remove ${kind} @ユーザー\`。`,
  removeRemoved: (names: string[], label: string) =>
    `✅ ${names.join('、')} を${label}から削除しました。`,
  removeNotThere: (names: string[], label: string) =>
    `${names.join('、')} はもともと${label}にいないため、削除は不要です。`,

  // ── /mention ──
  mentionUsage:
    '使い方：\n• `/mention group on` — 現在のグループでは @bot が必要\n• `/mention group off` — 現在のグループを専用グループとして @ 不要に設定（通常メッセージでもトリガー。複数 bot がいるグループでは非推奨）\n• `/mention group default` — 現在のグループは `/config` のグローバル設定に従う',
  mentionGroupInP2p: '`/mention group` は設定したいグループ内で送信してください。DM には変更できるグループポリシーがありません。',
  mentionRequireLabel: '@bot が必要',
  mentionExemptShort: '専用グループ・@ 不要',
  mentionExemptLabel: '専用グループ・@ 不要（通常メッセージでもトリガー）',
  mentionResetToDefault: (label: string) =>
    `✅ 現在のグループはグローバル設定に従う状態に戻しました（グローバル既定）：${label}。`,
  mentionMultiBotWarning:
    '\n\n⚠️ このグループに複数の bot がいる場合、@ 不要の有効化は推奨しません。通常メッセージで複数の bot が同時に応答する可能性があります。',
  mentionSet: (label: string, warning: string) =>
    `✅ 現在のグループを次のとおり設定しました：${label}。これは現在のグループのみに影響し、/config のグローバル既定値は変更しません。${warning}`,

  // ── /config ──
  configUsage: '使い方:`/config`',
  configFailRollbackFailed:
    '保存に失敗し、さらに lark-cli アイデンティティポリシーのロールバックにも失敗しました。/status で現在の状態を確認してください。',
  configFailRolledBack:
    '保存に失敗したため、lark-cli アイデンティティポリシーをロールバックしました。/config を開き直して現在の状態を確認してください。',
  configFailPolicyNotApplied: 'lark-cli アイデンティティポリシーが適用されなかったため、何も変更していません。',
  configFailNotWritten: '設定は書き込まれず、何も変更していません。',

  // ── /meeting ──
  meetingDisabled:
    '会議エージェントが有効になっていません。`/config` または Web コンソールで「会議エージェント」を有効にしてから、bot を再起動してください。',
  meetingNotReady:
    '会議機能の準備ができていません（channel が未接続か、有効化した後に再起動していません）。',
  meetingJoinUsage:
    '使い方：`/meeting join <9 桁の会議 ID>`（9 桁の数字のみ。会議リンクは使えません）',
  meetingJoined: (topic: string, meetingNo: string, trigger: string) =>
    `✅ **${topic}** に参加しました\n` +
    `会議 ID ${meetingNo} · 会議チャットで \`${trigger} 質問内容\` を送ると質問できます\n` +
    '`/meeting notes` で要約 · `/meeting leave` で退出',
  meetingJoinFailed: (detail: string) => `会議への参加に失敗しました：${detail}`,
  meetingLeft: (meetingNo: string) => `✅ 会議から退出しました（会議 ID ${meetingNo}）`,
  meetingTranscriptEmpty:
    '字幕バッファが空です。今回 agent に渡された会議コンテキストは「（字幕はまだありません）」でした。\n' +
    '注意：同じ会議では agent が 1 つのセッションを使い回すため、**以前のターン**の字幕は agent 自身の会話履歴に残っています。' +
    'そのため、バッファにはもうない内容を引用することがあります。`/new` でそのセッションの記憶を消去できます。',
  meetingTranscriptHeader: (total: number, shown: number) =>
    `字幕バッファは全 ${total} 件です${shown < total ? `。以下は最新の ${shown} 件です` : ''}：`,
  meetingStopped: '✅ この会議で実行中のタスクを中断しました。',
  meetingNothingToStop: 'この会議で実行中のタスクはありません。',
  meetingAskUsage: '使い方：`/meeting ask <質問>`',
  meetingNoExecutor: 'このコンテキストでは agent を実行できません（run executor がありません）。',
  meetingSummarizing: '会議を要約しています…',
  meetingThinking: '考えています…',
  meetingNoAnswer: '（回答はありませんでした）',
  meetingRunFailed: (detail: string) => `実行に失敗しました：${detail}`,
  meetingHelp:
    '使い方：\n' +
    '`/meeting` — 状態を表示\n' +
    '`/meeting join <9 桁の会議 ID>` — bot を会議に参加させる\n' +
    '`/meeting leave [会議 ID]` — 退出する\n' +
    '`/meeting notes [会議 ID]` — 字幕から議事録を作成（あなたにだけ送信）\n' +
    '`/meeting stop [会議 ID]` — その会議で止まっているタスクを中断する\n' +
    '`/meeting transcript [会議 ID]` — agent が実際に受け取る字幕コンテキストを表示\n' +
    '`/meeting ask <質問>` — 会議の内容を踏まえて質問する',
  meetingNotFound: (meetingNo: string) =>
    `会議 ID ${meetingNo} の会議が見つかりません。\`/meeting\` で追跡中の会議を確認してください。`,
  meetingNoneActive: '追跡中の会議はありません。まず `/meeting join <9 桁の会議 ID>` を送ってください。',
  meetingPickOne: (count: number, list: string, exampleNo: string) =>
    `${count} 件の会議を追跡中です。会議 ID を指定してください：\n${list}\n\n例：\`/meeting notes ${exampleNo}\``,
  meetingPushHooked: (received: number) =>
    `プッシュ：接続済み、受信 ${received} 件${received === 0 ? '（まだ受信していません。開発者コンソールで vc.bot.* イベントを購読していない可能性があります）' : ''}`,
  meetingPushUnhooked: (reason: string) => `プッシュ：未接続（${reason}）。ポーリングのみで動作しています`,
  meetingUnknownReason: '原因不明',
  meetingStatusNone: (pushLine: string) =>
    `追跡中の会議はありません。\n${pushLine}\n\n\`/meeting join <9 桁の会議 ID>\` で開始できます。`,
  meetingStatusHeader: (count: number) => `${count} 件の会議を追跡中です：`,
  meetingStatusLine: (
    title: string,
    meetingNo: string,
    viaPush: boolean,
    transcriptLines: number,
    participants: number,
  ) =>
    `- **${title}**（${meetingNo}）· 取得元 ${viaPush ? 'プッシュ' : 'ポーリング'}` +
    ` · 字幕 ${transcriptLines} 件 · 参加者 ${participants} 人`,
  // in-meeting chat lane + end-of-meeting summary (meeting/orchestrator.ts)
  meetingLaneStopped: '実行中のタスクを中断しました。',
  meetingLaneNothingToStop: '実行中のタスクはありません。',
  meetingLaneBusy: (prefix: string) =>
    `前のタスクがまだ実行中です。「${prefix} stop」を送ると中断できます。その後でもう一度質問してください。`,
  meetingSummaryTitle: (title: string) => `**議事録 · ${title}**`,
  // meeting/manager.ts, meeting/api.ts
  meetingPushNoRawEvent:
    'channel が onRawEvent に対応していません（@larksuite/channel >= 0.5.0 が必要）。ポーリングに切り替えました',
  meetingPushHookFailed: (err: string) => `イベントの登録に失敗しました：${err}`,
  meetingNotInGray:
    'このアプリでは、エージェントの会議参加機能がまだ有効になっていません（エラーコード 20017）。ベータ版への参加を申請してから、もう一度お試しください。',
  meetingNoInvalid: (raw: string) => `会議 ID は 9 桁の数字で指定してください：${raw}`,
  meetingJoinNoId: '会議には参加しましたが、meeting.id が返されませんでした',
};
