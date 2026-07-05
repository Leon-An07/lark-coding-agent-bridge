/** policy namespace — zh-CN is the source of truth; the En object's
 * `typeof` annotation turns any missing translation into a compile error.
 * Filled by the i18n migration; keys are camelCase, parameterized entries
 * are arrow functions so params are type-checked. */

export const policyZh = {
  // src/policy/workspace.ts — working-directory rejection texts
  emptyRequestedCwd: '未指定工作目录。',
  pathInaccessible: (path: string) => `工作目录不存在或不可访问：${path}`,
  notDirectory: (path: string) => `路径不是目录：${path}`,
  filesystemRoot: '不能把文件系统根目录设为工作目录。',
  homeRoot: '不能把 Home 根目录设为工作目录，请选择更具体的子目录。',
  userRoot: '不能把用户目录根设为工作目录，请选择更具体的子目录。',
  broadUserFolder: '这个目录范围过大，请选择更具体的子目录。',
  tempRoot: '不能把临时目录根设为工作目录，请选择更具体的子目录。',
  systemRoot: '不能把系统目录设为工作目录。',
  volumeRoot: '不能把磁盘卷根目录设为工作目录，请选择更具体的子目录。',

  // src/policy/run-policy.ts — run rejection texts
  accessDenied: '当前用户无权发起运行。',
  folderAllowlistUnverified: '暂不支持 folder allowlist，已拒绝运行。',
  requiredAttachmentRejected: '必需附件未通过校验，已拒绝运行。',

  // src/session/history.ts — /history session list rendering
  emptySession: '(空会话)',
  relJustNow: '刚刚',
  relMinutesAgo: (min: number) => `${min} 分钟前`,
  relHoursAgo: (hr: number) => `${hr} 小时前`,
  relYesterday: '昨天',
  relDaysAgo: (day: number) => `${day} 天前`,
  relMonthsAgo: (mo: number) => `${mo} 个月前`,
};

export const policyEn: typeof policyZh = {
  emptyRequestedCwd: 'No working directory specified.',
  pathInaccessible: (path: string) => `Working directory does not exist or is inaccessible: ${path}`,
  notDirectory: (path: string) => `Path is not a directory: ${path}`,
  filesystemRoot: 'The filesystem root cannot be used as the working directory.',
  homeRoot: 'The home root cannot be used as the working directory; pick a more specific subdirectory.',
  userRoot: 'The user directory root cannot be used as the working directory; pick a more specific subdirectory.',
  broadUserFolder: 'This directory is too broad; pick a more specific subdirectory.',
  tempRoot: 'The temp directory root cannot be used as the working directory; pick a more specific subdirectory.',
  systemRoot: 'System directories cannot be used as the working directory.',
  volumeRoot: 'A volume root cannot be used as the working directory; pick a more specific subdirectory.',

  accessDenied: 'You are not allowed to start runs.',
  folderAllowlistUnverified: 'Folder allowlists are not supported yet; run rejected.',
  requiredAttachmentRejected: 'A required attachment failed validation; run rejected.',

  emptySession: '(empty session)',
  relJustNow: 'just now',
  relMinutesAgo: (min: number) => `${min} min ago`,
  relHoursAgo: (hr: number) => `${hr} hr ago`,
  relYesterday: 'yesterday',
  relDaysAgo: (day: number) => `${day} days ago`,
  relMonthsAgo: (mo: number) => `${mo} mo ago`,
};

export const policyJa: typeof policyZh = {
  emptyRequestedCwd: '作業ディレクトリが指定されていません。',
  pathInaccessible: (path: string) => `作業ディレクトリが存在しないか、アクセスできません：${path}`,
  notDirectory: (path: string) => `パスがディレクトリではありません：${path}`,
  filesystemRoot: 'ファイルシステムのルートは作業ディレクトリに設定できません。',
  homeRoot: 'ホームのルートは作業ディレクトリに設定できません。より具体的なサブディレクトリを選択してください。',
  userRoot: 'ユーザーディレクトリのルートは作業ディレクトリに設定できません。より具体的なサブディレクトリを選択してください。',
  broadUserFolder: 'このディレクトリは範囲が広すぎます。より具体的なサブディレクトリを選択してください。',
  tempRoot: '一時ディレクトリのルートは作業ディレクトリに設定できません。より具体的なサブディレクトリを選択してください。',
  systemRoot: 'システムディレクトリは作業ディレクトリに設定できません。',
  volumeRoot: 'ボリュームのルートは作業ディレクトリに設定できません。より具体的なサブディレクトリを選択してください。',

  accessDenied: '現在のユーザーには実行を開始する権限がありません。',
  folderAllowlistUnverified: 'folder allowlist は未対応のため、実行を拒否しました。',
  requiredAttachmentRejected: '必須の添付ファイルが検証を通過しなかったため、実行を拒否しました。',

  emptySession: '(空のセッション)',
  relJustNow: 'たった今',
  relMinutesAgo: (min: number) => `${min} 分前`,
  relHoursAgo: (hr: number) => `${hr} 時間前`,
  relYesterday: '昨日',
  relDaysAgo: (day: number) => `${day} 日前`,
  relMonthsAgo: (mo: number) => `${mo} か月前`,
};
