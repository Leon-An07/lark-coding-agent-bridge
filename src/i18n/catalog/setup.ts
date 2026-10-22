/** setup namespace — zh-CN is the source of truth; the En/Ja objects'
 * `typeof` annotation turns any missing translation into a compile error.
 * Covers first-run lark-cli install/bind (cli/preflight), the meeting
 * permission probe (meeting/preflight) and user-identity IM helpers
 * (lark-cli/user-im). Recovery-step numbering stays in code. */

export const setupZh = {
  // ── lark-cli install (cli/preflight) ──
  larkCliNotInstalled: [
    'lark-cli 未安装',
    '',
    'lark-cli 是飞书命令行工具。安装后，agent 可以：',
    '  - 发送交互卡片和表单',
    '  - 查询日历、文档、任务、OKR 和考勤',
    '  - 使用 200+ 个飞书 API 命令',
  ].join('\n'),
  nonInteractiveSkipInstall: '（非交互模式，跳过自动安装）',
  manualInstallTitle: '手动安装命令：',
  manualInstallRestart: '安装后重启当前 profile，bridge 会自动初始化 lark-cli。',
  docsLine: (url: string) => `文档：${url}`,
  larkCliSetupIntro: '配置 lark-cli',
  larkCliInstalling: '正在安装 lark-cli',
  larkCliInstallFailed: '安装失败',
  larkCliInstallIncomplete: 'lark-cli 安装未完成',
  larkCliInstalled: '已安装',
  installFailedTitle: 'lark-cli 自动安装失败',
  installFailedCauses: '可能原因：网络不可用、npm 全局安装没有权限，或 npm 源故障。',
  installFailedImpact: 'bridge 会继续运行，但 agent 可能无法使用飞书工具。',
  runManually: '请手动运行：',
  installFailedRestart: '安装后重启 bridge，或重新运行当前的启动命令。',

  // ── lark-cli bind (cli/preflight) ──
  larkCliBinding: '正在初始化 lark-cli 配置',
  larkCliBindFailed: 'lark-cli 配置失败',
  larkCliBindReady: 'lark-cli 配置完成',
  setupDone: '完成',
  bindTooOldReason: '已安装的 lark-cli 不支持 bridge 自动配置所需的 lark-channel source。',
  bindTooOldImpact: 'bridge 会继续监听消息，但 agent 无法通过 lark-cli 调用飞书 API。',
  bindTooOldInstallNewer: '安装支持 lark-channel source 的 lark-cli 版本。',
  bindFailedReason: 'bridge 会继续监听消息，但当前 profile 未完成 lark-cli 配置。',
  bindFailedImpact: '影响：agent 可能无法通过 lark-cli 发消息、发卡片或调用飞书 API。',
  bindFailedCheckSecret:
    '如果仍然失败，请检查当前 profile 的 App Secret 是否有效，以及 lark-cli 配置目录是否可写。',
  recoveryTitle: '恢复步骤：',
  diagnosticTitle: '诊断详情：',
  restartInstruction: (suffix: string) =>
    `重启当前 profile：lark-channel-bridge restart${suffix}；` +
    `前台运行时，按 Ctrl+C 后重新运行 lark-channel-bridge run${suffix}。`,
  diagnosticEmpty: '（lark-cli 未输出错误详情）',
  diagnosticNoBindSource: 'lark-cli 不支持 `config bind --source lark-channel`。',

  // ── meeting permission probe (meeting/preflight) ──
  meetingScopeJoin: '让 bot 入会 / 离会',
  meetingScopeMessage: '在会中发消息（回答会发不出去）',
  meetingScopeEvent: '读会中事件（字幕/弹幕/进退会）',
  meetingPreflightUnparsable: '无法解析 lark-cli 输出',
  meetingPreflightOk: '应用身份权限已就绪',
  meetingPreflightFailed: '权限检查失败',
  meetingNotInBeta: '智能体入会能力尚未对本应用开通（内测灰度）',
  meetingPreflightNoResult: '权限检查未返回结果（lark-cli 未安装或未绑定应用？）',

  // ── user-identity IM (lark-cli/user-im) ──
  errorWithDetail: (prefix: string, detail: string) => `${prefix}：${detail}`,
  authStartFailed: '无法开始授权',
  authNoVerificationUrl: 'lark-cli auth login 未返回验证链接',
  authNotCompleted: '授权尚未完成，请先在浏览器里确认授权后重试',
  unnamedChat: '(无名群)',
  listChatsFailed: '列出群失败',
  searchChatsFailed: '搜索群失败',
  addBotFailed: '把 bot 拉进群失败',
  addBotUnavailable: '应用对该群不可用，或缺少 im:chat 权限（去开发者后台确认应用可见范围与权限）',
  addBotPending: '已发送，等待群主/管理员通过',
  commandTimedOut: '命令超时',
  exitCode: (code: number | null) => `退出码 ${code}`,
};

export const setupEn: typeof setupZh = {
  larkCliNotInstalled: [
    'lark-cli is not installed',
    '',
    'lark-cli is the Feishu/Lark command-line tool. After installation, the agent can:',
    '  - send interactive cards and forms',
    '  - query calendars, docs, tasks, OKRs, and attendance',
    '  - use 200+ Feishu/Lark API commands',
  ].join('\n'),
  nonInteractiveSkipInstall: '(non-interactive mode; skipping auto-install)',
  manualInstallTitle: 'Manual install command:',
  manualInstallRestart:
    'Restart the current profile after installation; bridge will initialize lark-cli automatically.',
  docsLine: (url) => `Docs: ${url}`,
  larkCliSetupIntro: 'Setting up lark-cli',
  larkCliInstalling: 'Installing lark-cli',
  larkCliInstallFailed: 'Install failed',
  larkCliInstallIncomplete: 'lark-cli installation did not complete',
  larkCliInstalled: 'Installed',
  installFailedTitle: 'lark-cli auto-install failed',
  installFailedCauses:
    'Possible causes: network unavailable, npm global install permission denied, or registry failure.',
  installFailedImpact: 'Bridge will keep running, but the agent may be unable to use Feishu/Lark tools.',
  runManually: 'Run manually:',
  installFailedRestart: 'After installation, restart bridge or rerun the current start command.',

  larkCliBinding: 'Initializing lark-cli configuration',
  larkCliBindFailed: 'lark-cli configuration failed',
  larkCliBindReady: 'lark-cli configuration ready',
  setupDone: 'Done',
  bindTooOldReason:
    'The installed lark-cli does not support the lark-channel source required by bridge auto-configuration.',
  bindTooOldImpact:
    'Bridge will keep listening for messages, but the agent cannot use lark-cli to call Feishu/Lark APIs.',
  bindTooOldInstallNewer: 'Install a lark-cli build that supports the lark-channel source.',
  bindFailedReason: 'Bridge will keep listening for messages, but this profile did not finish lark-cli configuration.',
  bindFailedImpact:
    'Impact: the agent may be unable to send messages, send cards, or call Feishu/Lark APIs through lark-cli.',
  bindFailedCheckSecret:
    'If it still fails, check that this profile has a valid App Secret and that the lark-cli config directory is writable.',
  recoveryTitle: 'Recovery:',
  diagnosticTitle: 'Diagnostic details:',
  restartInstruction: (suffix) =>
    `Restart the current profile: lark-channel-bridge restart${suffix}; ` +
    `for foreground runs, press Ctrl+C and rerun lark-channel-bridge run${suffix}.`,
  diagnosticEmpty: '(lark-cli did not print error details)',
  diagnosticNoBindSource: 'lark-cli does not support `config bind --source lark-channel`.',

  meetingScopeJoin: 'Let the bot join and leave meetings',
  meetingScopeMessage: 'Post messages in the meeting (without it, answers cannot be sent)',
  meetingScopeEvent: 'Read in-meeting events (captions, chat, join/leave)',
  meetingPreflightUnparsable: 'Could not parse lark-cli output',
  meetingPreflightOk: 'App identity permissions are ready',
  meetingPreflightFailed: 'Permission check failed',
  meetingNotInBeta: 'The in-meeting agent is not yet enabled for this app (limited beta)',
  meetingPreflightNoResult: 'Permission check returned no result (is lark-cli installed and bound to the app?)',

  errorWithDetail: (prefix, detail) => `${prefix}: ${detail}`,
  authStartFailed: 'Could not start authorization',
  authNoVerificationUrl: 'lark-cli auth login returned no verification URL',
  authNotCompleted: 'Authorization is not complete yet. Approve it in the browser, then try again.',
  unnamedChat: '(unnamed group)',
  listChatsFailed: 'Failed to list groups',
  searchChatsFailed: 'Failed to search groups',
  addBotFailed: 'Failed to add the bot to the group',
  addBotUnavailable:
    'the app is not available to this group, or it lacks the im:chat permission ' +
    "(check the app's availability and permissions in the developer console)",
  addBotPending: 'Request sent; waiting for the group owner or an admin to approve',
  commandTimedOut: 'command timed out',
  exitCode: (code) => `exit code ${code}`,
};

export const setupJa: typeof setupZh = {
  larkCliNotInstalled: [
    'lark-cli がインストールされていません',
    '',
    'lark-cli は Lark のコマンドラインツールです。インストールすると、エージェントは次のことができます:',
    '  - インタラクティブカードやフォームの送信',
    '  - カレンダー、ドキュメント、タスク、OKR、勤怠の照会',
    '  - 200 以上の Lark API コマンドの利用',
  ].join('\n'),
  nonInteractiveSkipInstall: '（非対話モードのため、自動インストールをスキップします）',
  manualInstallTitle: '手動でインストールするコマンド:',
  manualInstallRestart: 'インストール後に現在の profile を再起動してください。bridge が lark-cli を自動で初期化します。',
  docsLine: (url) => `ドキュメント: ${url}`,
  larkCliSetupIntro: 'lark-cli をセットアップします',
  larkCliInstalling: 'lark-cli をインストールしています',
  larkCliInstallFailed: 'インストールに失敗しました',
  larkCliInstallIncomplete: 'lark-cli のインストールが完了しませんでした',
  larkCliInstalled: 'インストールしました',
  installFailedTitle: 'lark-cli の自動インストールに失敗しました',
  installFailedCauses:
    '考えられる原因: ネットワークに接続できない、npm のグローバルインストール権限がない、またはレジストリの障害です。',
  installFailedImpact: 'bridge は動作を続けますが、エージェントが Lark のツールを使えない可能性があります。',
  runManually: '次のコマンドを手動で実行してください:',
  installFailedRestart: 'インストール後に bridge を再起動するか、現在の起動コマンドを再実行してください。',

  larkCliBinding: 'lark-cli の設定を初期化しています',
  larkCliBindFailed: 'lark-cli の設定に失敗しました',
  larkCliBindReady: 'lark-cli の設定が完了しました',
  setupDone: '完了しました',
  bindTooOldReason:
    'インストール済みの lark-cli は、bridge の自動設定に必要な lark-channel source に対応していません。',
  bindTooOldImpact: 'bridge はメッセージの受信を続けますが、エージェントは lark-cli で Lark API を呼び出せません。',
  bindTooOldInstallNewer: 'lark-channel source に対応した lark-cli をインストールしてください。',
  bindFailedReason: 'bridge はメッセージの受信を続けますが、この profile では lark-cli の設定が完了していません。',
  bindFailedImpact:
    '影響: エージェントが lark-cli 経由でメッセージやカードを送信したり、Lark API を呼び出したりできない可能性があります。',
  bindFailedCheckSecret:
    '解決しない場合は、この profile の App Secret が有効か、lark-cli の設定ディレクトリに書き込めるかを確認してください。',
  recoveryTitle: '復旧手順:',
  diagnosticTitle: '診断情報:',
  restartInstruction: (suffix) =>
    `現在の profile を再起動してください: lark-channel-bridge restart${suffix}。` +
    `フォアグラウンドで実行している場合は、Ctrl+C で停止してから lark-channel-bridge run${suffix} を再実行してください。`,
  diagnosticEmpty: '（lark-cli はエラーの詳細を出力しませんでした）',
  diagnosticNoBindSource: 'lark-cli は `config bind --source lark-channel` に対応していません。',

  meetingScopeJoin: 'bot の会議への参加・退出',
  meetingScopeMessage: '会議中のメッセージ送信（未付与の場合、回答を送信できません）',
  meetingScopeEvent: '会議中イベントの読み取り（字幕・チャット・入退室）',
  meetingPreflightUnparsable: 'lark-cli の出力を解析できませんでした',
  meetingPreflightOk: 'アプリとしての権限は準備できています',
  meetingPreflightFailed: '権限チェックに失敗しました',
  meetingNotInBeta: 'このアプリでは、エージェントの会議参加機能がまだ有効になっていません（限定ベータ）',
  meetingPreflightNoResult:
    '権限チェックの結果が返されませんでした（lark-cli が未インストールか、アプリに紐付けられていない可能性があります）',

  errorWithDetail: (prefix, detail) => `${prefix}: ${detail}`,
  authStartFailed: '認可を開始できませんでした',
  authNoVerificationUrl: 'lark-cli auth login から認証 URL が返されませんでした',
  authNotCompleted: '認可がまだ完了していません。ブラウザで認可を承認してから、もう一度お試しください。',
  unnamedChat: '（名前のないグループ）',
  listChatsFailed: 'グループの一覧を取得できませんでした',
  searchChatsFailed: 'グループを検索できませんでした',
  addBotFailed: 'bot をグループに追加できませんでした',
  addBotUnavailable:
    'このグループではアプリを利用できないか、im:chat 権限がありません（開発者コンソールでアプリの公開範囲と権限を確認してください）',
  addBotPending: 'リクエストを送信しました。グループオーナーまたは管理者の承認待ちです',
  commandTimedOut: 'コマンドがタイムアウトしました',
  exitCode: (code) => `終了コード ${code}`,
};
