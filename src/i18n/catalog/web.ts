/** web namespace — zh-CN is the source of truth; the En/Ja objects'
 * `typeof` annotation turns any missing translation into a compile error. */

export const webZh = {
  // ── ui/api.ts ──
  identityPolicyNotApplied: 'lark-cli 身份策略未生效',
  saveFailed: (detail: string) => `保存失败：${detail}`,
  meetingDisabledForProfile: '该 profile 未启用会议智能体',
  meetingProfileOffline: 'profile 未在线（会议能力只在运行中的进程里可用）',
  meetingUnavailable: '会议能力不可用：profile 未在线或未启用',
  meetingNoInvalid: '会议号必须是 9 位数字',
  authNotComplete: '授权尚未完成',
  addBotNeedsAuth: '拉bot进群需要额外授权（添加群成员）',
  profileNoApp: 'profile 未配置 app',

  // ── ui/onboard.ts ──
  appCredentialsRequired: 'appId 和 appSecret 必填',
  credentialsInvalid: (reason: string) => `凭据校验失败：${reason}`,
  unknownReason: '未知原因',
  profileNameInvalid: (detail: string) => `profile 名称无效：${detail}`,
  profileExists: (profile: string) => `profile 已存在：${profile}，请换个名字`,

  // ── ui/qr-register.ts ──
  qrStartFailed: (detail: string) => `扫码创建启动失败：${detail}`,
  qrFailed: '扫码创建失败',
  qrNotScanned: '尚未完成扫码',
};

export const webEn: typeof webZh = {
  // ── ui/api.ts ──
  identityPolicyNotApplied: 'The lark-cli identity policy was not applied',
  saveFailed: (detail: string) => `Save failed: ${detail}`,
  meetingDisabledForProfile: 'The meeting agent is not enabled for this profile',
  meetingProfileOffline:
    'The profile is offline (meeting features are only available in a running process)',
  meetingUnavailable: 'Meeting features unavailable: the profile is offline or not enabled',
  meetingNoInvalid: 'The meeting number must be 9 digits',
  authNotComplete: 'Authorization is not complete yet',
  addBotNeedsAuth: 'Adding the bot to a group needs extra authorization (add group members)',
  profileNoApp: 'The profile has no app configured',

  // ── ui/onboard.ts ──
  appCredentialsRequired: 'appId and appSecret are required',
  credentialsInvalid: (reason: string) => `Credential check failed: ${reason}`,
  unknownReason: 'unknown reason',
  profileNameInvalid: (detail: string) => `Invalid profile name: ${detail}`,
  profileExists: (profile: string) =>
    `Profile already exists: ${profile}. Please choose another name`,

  // ── ui/qr-register.ts ──
  qrStartFailed: (detail: string) => `Failed to start QR app creation: ${detail}`,
  qrFailed: 'QR app creation failed',
  qrNotScanned: 'The QR code has not been scanned yet',
};

export const webJa: typeof webZh = {
  // ── ui/api.ts ──
  identityPolicyNotApplied: 'lark-cli のアイデンティティポリシーが適用されませんでした',
  saveFailed: (detail: string) => `保存に失敗しました：${detail}`,
  meetingDisabledForProfile: 'この profile では会議エージェントが有効になっていません',
  meetingProfileOffline:
    'profile がオフラインです（会議機能は実行中のプロセスでのみ利用できます）',
  meetingUnavailable: '会議機能を利用できません：profile がオフラインか、有効になっていません',
  meetingNoInvalid: '会議 ID は 9 桁の数字で指定してください',
  authNotComplete: '認可がまだ完了していません',
  addBotNeedsAuth: 'bot をグループに追加するには、追加の認可（グループメンバーの追加）が必要です',
  profileNoApp: 'profile にアプリが設定されていません',

  // ── ui/onboard.ts ──
  appCredentialsRequired: 'App ID と App Secret は必須です',
  credentialsInvalid: (reason: string) => `認証情報の検証に失敗しました：${reason}`,
  unknownReason: '原因不明',
  profileNameInvalid: (detail: string) => `profile 名が無効です：${detail}`,
  profileExists: (profile: string) =>
    `profile「${profile}」はすでに存在します。別の名前を指定してください`,

  // ── ui/qr-register.ts ──
  qrStartFailed: (detail: string) => `QR コードでのアプリ作成を開始できませんでした：${detail}`,
  qrFailed: 'QR コードでのアプリ作成に失敗しました',
  qrNotScanned: 'QR コードのスキャンがまだ完了していません',
};
