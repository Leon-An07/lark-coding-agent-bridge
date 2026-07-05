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
};
