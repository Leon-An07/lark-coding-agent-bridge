/** bot namespace — zh-CN is the source of truth; the En object's
 * `typeof` annotation turns any missing translation into a compile error.
 * Filled by the i18n migration; keys are camelCase, parameterized entries
 * are arrow functions so params are type-checked. */

export const botZh = {
  // channel.ts
  flushFailedNotice: (detail: string) => `⚠️ 本次消息处理失败，未能发起 agent 运行：${detail}`,
  reconnectWarn3: '⚠️ 已连续重连 3 次,网络可能不稳。',
  reconnectWarn10: '❌ 已连续重连 10 次,建议在飞书发 /reconnect 或重启 bot。',
  listening: '正在监听消息。按 Ctrl+C 退出。',
  nonAllowedGroupHint:
    '当前群尚未加入响应列表，所以 bot 不会处理消息。\n' +
    'Bot owner/管理员可在本群发 /invite group 加入白名单。',
  streamInterrupted: '⚠️ 这条消息处理中断了(内部错误),请重发一次;反复出现可用 /doctor 排查。',

  // comments.ts
  commentWorkspaceUnavailable: (detail: string) => `工作目录不可用：${detail}`,
  commentTimedOut: '本次评论任务已超时，请重新 @ 我。',
  commentAgentError: (message: string) => `⚠️ Claude 报错：${message}`,
  commentNoReply: '（无回复内容）',
  commentRejectedActive: '当前评论线程已有任务在执行，请稍后再试。',
  commentRejectedPoolFull: '当前任务较多，请稍后再试。',
  commentRejectedReconnecting: '当前 bot 正在重连，请稍后再试。',
  managedWorkspaceUnavailable: (detail: string) => `托管工作目录不可用：${detail}`,

  // cot.ts
  cotStepUnderstand: '理解用户问题',
  cotToolRunning: '正在调用工具',
  cotToolDone: '工具调用已完成',

  // run-flow.ts
  runRejectedReconnecting: '当前 bot 正在重连，稍后会继续处理新消息。',
  runRejectedActive: '当前会话已有运行在执行，请稍后再试或先停止当前运行。',
  runRejectedGeneric: '当前无法发起运行，请稍后重试。',

  // lark-info.ts
  unnamedChat: '(无名)',
};

export const botEn: typeof botZh = {
  // channel.ts
  flushFailedNotice: (detail: string) =>
    `⚠️ Failed to process this message — could not start an agent run: ${detail}`,
  reconnectWarn3: '⚠️ Reconnected 3 times in a row; the network may be unstable.',
  reconnectWarn10: '❌ Reconnected 10 times in a row; send /reconnect in Lark or restart the bot.',
  listening: 'Listening for messages. Press Ctrl+C to exit.',
  nonAllowedGroupHint:
    'This group is not on the response list yet, so the bot will not process messages.\n' +
    'The bot owner/admin can send /invite group here to add it to the allowlist.',
  streamInterrupted:
    '⚠️ This message was interrupted (internal error). Please resend it; if it keeps happening, run /doctor.',

  // comments.ts
  commentWorkspaceUnavailable: (detail: string) => `Working directory unavailable: ${detail}`,
  commentTimedOut: 'This comment task timed out. Please @ me again.',
  commentAgentError: (message: string) => `⚠️ Claude error: ${message}`,
  commentNoReply: '(No reply content)',
  commentRejectedActive: 'This comment thread already has a task running. Please try again later.',
  commentRejectedPoolFull: 'Too many tasks right now. Please try again later.',
  commentRejectedReconnecting: 'The bot is reconnecting. Please try again later.',
  managedWorkspaceUnavailable: (detail: string) =>
    `Managed working directory unavailable: ${detail}`,

  // cot.ts
  cotStepUnderstand: 'Understanding the question',
  cotToolRunning: 'Calling a tool',
  cotToolDone: 'Tool call completed',

  // run-flow.ts
  runRejectedReconnecting: 'The bot is reconnecting; new messages will be handled shortly.',
  runRejectedActive:
    'This conversation already has a run in progress. Try again later or stop the current run first.',
  runRejectedGeneric: 'Cannot start a run right now. Please try again later.',

  // lark-info.ts
  unnamedChat: '(unnamed)',
};

export const botJa: typeof botZh = {
  // channel.ts
  flushFailedNotice: (detail: string) =>
    `⚠️ このメッセージの処理に失敗し、agent の実行を開始できませんでした：${detail}`,
  reconnectWarn3: '⚠️ 3 回連続で再接続しました。ネットワークが不安定な可能性があります。',
  reconnectWarn10: '❌ 10 回連続で再接続しました。Lark で /reconnect を送るか、bot を再起動してください。',
  listening: 'メッセージを待ち受けています。Ctrl+C で終了します。',
  nonAllowedGroupHint:
    'このグループはまだ応答リストに登録されていないため、bot はメッセージを処理しません。\n' +
    'Bot owner/管理者はこのグループで /invite group を送ると許可リストに追加できます。',
  streamInterrupted:
    '⚠️ このメッセージの処理が中断されました（内部エラー）。もう一度送信してください。繰り返し発生する場合は /doctor で確認できます。',

  // comments.ts
  commentWorkspaceUnavailable: (detail: string) => `作業ディレクトリを利用できません：${detail}`,
  commentTimedOut: 'このコメントタスクはタイムアウトしました。もう一度 @ してください。',
  commentAgentError: (message: string) => `⚠️ Claude エラー：${message}`,
  commentNoReply: '（返信内容なし）',
  commentRejectedActive: 'このコメントスレッドではタスクが実行中です。しばらくしてからお試しください。',
  commentRejectedPoolFull: '現在タスクが混み合っています。しばらくしてからお試しください。',
  commentRejectedReconnecting: 'bot は再接続中です。しばらくしてからお試しください。',
  managedWorkspaceUnavailable: (detail: string) =>
    `マネージド作業ディレクトリを利用できません：${detail}`,

  // cot.ts
  cotStepUnderstand: '質問を理解しています',
  cotToolRunning: 'ツールを呼び出しています',
  cotToolDone: 'ツール呼び出しが完了しました',

  // run-flow.ts
  runRejectedReconnecting: 'bot は再接続中です。新しいメッセージは後ほど処理されます。',
  runRejectedActive:
    'この会話では実行中のタスクがあります。しばらく待つか、現在の実行を停止してください。',
  runRejectedGeneric: '現在実行を開始できません。しばらくしてからお試しください。',

  // lark-info.ts
  unnamedChat: '(名称なし)',
};
