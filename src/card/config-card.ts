import { supportedModels } from '../agent/models';
import type { KnownChat } from '../bot/lark-info';
import type { AgentKind, LarkCliIdentityPreset, ProfileMode } from '../config/profile-schema';
import type { CotMessagesMode, MessageReplyMode } from '../config/schema';
import { activeLocale, msgs, type Locale } from '../i18n';

export interface ConfigFormOpts {
  /** Profile's agent kind — decides which model catalog the picker shows. */
  agentKind: AgentKind;
  /** Deployment mode: 'personal' (default) or 'team'. */
  mode: ProfileMode;
  /** Current model selection (a value from {@link supportedModels}). */
  model: string;
  messageReply: MessageReplyMode;
  showToolCalls: boolean;
  cotMessages: CotMessagesMode;
  /** Global default reasoning-effort. Undefined = CLI default. */
  effort?: string;
  maxConcurrentRuns: number;
  /** 0 means "disabled". */
  runIdleTimeoutMinutes: number;
  requireMentionInGroup: boolean;
  /** Per-chat @-mention overrides; absent/empty when none are set. */
  chatRequireMention?: Record<string, boolean>;
  larkCliIdentity: LarkCliIdentityPreset;
  /** Current UI language (caller passes `getLanguage(cfg)`). Falls back to
   * the ambient active locale, which is set from the same preference. */
  language?: Locale;
  allowedUsers: string[];
  allowedChats: string[];
  admins: string[];
  knownChats: KnownChat[];
  /** URL of the running local web console (supervisor `--web-ui` mode). Shown
   * at the top of the card when present; omitted when no console is running. */
  consoleUrl?: string;
}

function collapsedAccessPanel(title: string, elements: object[]): object {
  return {
    tag: 'collapsible_panel',
    expanded: false,
    header: {
      title: { tag: 'markdown', content: title },
      vertical_align: 'center',
      icon: {
        tag: 'standard_icon',
        token: 'down-small-ccm_outlined',
        size: '16px 16px',
      },
      icon_position: 'follow_text',
      icon_expanded_angle: -180,
    },
    border: { color: 'blue', corner_radius: '5px' },
    vertical_spacing: '8px',
    padding: '8px 8px 8px 8px',
    elements,
  };
}

function atMentionLine(openIds: string[]): string {
  if (openIds.length === 0) return msgs().cards.noneMarker;
  return openIds.map((id) => `<at id="${id}"></at>`).join('  ');
}

function chatList(chatIds: string[], knownChats: KnownChat[]): string {
  const m = msgs().cards;
  if (chatIds.length === 0) return m.noneMarker;
  const nameMap = new Map(knownChats.map((chat) => [chat.id, chat.name]));
  return chatIds
    .map((id) => m.chatListItem(nameMap.get(id) ?? m.unknownChat, id.slice(-6)))
    .join('\n');
}

function mentionOverrideList(overrides: Record<string, boolean>, knownChats: KnownChat[]): string {
  const m = msgs().cards;
  const entries = Object.entries(overrides).sort(([a], [b]) => a.localeCompare(b));
  if (entries.length === 0) return m.noOverrides;
  const nameMap = new Map(knownChats.map((chat) => [chat.id, chat.name]));
  return entries
    .map(([id, required]) =>
      m.mentionOverrideItem(nameMap.get(id) ?? m.unknownChat, id.slice(-6), required),
    )
    .join('\n');
}

/** Form card for `/config`. */
export function configFormCard(opts: ConfigFormOpts): object {
  const m = msgs().cards;
  // TODO(i18n): upstream's team-mode strings are still hardcoded zh — same
  // deferral policy as the 2026-07-10 merge; translate in a follow-up pass.
  const teamMode = opts.mode === 'team';
  const teamOverrideNote =
    '\n\n_⚠️ 团队版已开启：本项被覆盖 —— 身份强制为「只允许应用身份」、访问控制不生效。切回个人版后恢复。_';
  const accessElements: object[] = [
    ...(teamMode
      ? [
          {
            tag: 'markdown',
            content:
              '_⚠️ **团队版已开启**：访问控制暂不生效 —— 任何人 @ bot 都能使用（管理命令仍限 owner/管理员）。切回个人版后以下白名单恢复生效。_',
          },
          { tag: 'hr' },
        ]
      : []),
    {
      tag: 'markdown',
      content: m.accessIntro,
    },
    { tag: 'hr' },
    {
      tag: 'markdown',
      content: m.accessAllowedUsers(opts.allowedUsers.length, atMentionLine(opts.allowedUsers)),
    },
    { tag: 'hr' },
    {
      tag: 'markdown',
      content: m.accessAllowedChats(
        opts.allowedChats.length,
        chatList(opts.allowedChats, opts.knownChats),
      ),
    },
    { tag: 'hr' },
    {
      tag: 'markdown',
      content: m.accessMentionOverrides(
        Object.keys(opts.chatRequireMention ?? {}).length,
        mentionOverrideList(opts.chatRequireMention ?? {}, opts.knownChats),
      ),
    },
    { tag: 'hr' },
    {
      tag: 'markdown',
      content: m.accessAdmins(opts.admins.length, atMentionLine(opts.admins)),
    },
  ];

  return {
    schema: '2.0',
    config: { summary: { content: m.configSummary } },
    body: {
      elements: [
        {
          tag: 'markdown',
          content: m.configIntro,
        },
        ...(opts.consoleUrl
          ? [
              {
                tag: 'markdown',
                content:
                  `🖥️ **Web 控制台**（本机 127.0.0.1，可管理所有 profile 的启动/停止与配置）\n` +
                  `[${opts.consoleUrl}](${opts.consoleUrl})`,
              },
            ]
          : []),
        { tag: 'hr' },
        {
          tag: 'form',
          name: 'config_form',
          elements: [
            // Hidden for now: the message-reply-mode selector is commented out
            // so users can't switch away from the default. submitConfig()
            // preserves the stored value when this field is absent, so hiding
            // the UI here does not reset it. Re-add the block below to re-expose.
            // {
            //   tag: 'markdown',
            //   content: m.messageReplyHeading,
            // },
            // {
            //   tag: 'select_static',
            //   name: 'message_reply',
            //   initial_option: opts.messageReply,
            //   options: [
            //     { text: { tag: 'plain_text', content: m.optText }, value: 'text' },
            //     { text: { tag: 'plain_text', content: m.optMarkdown }, value: 'markdown' },
            //     { text: { tag: 'plain_text', content: m.optCard }, value: 'card' },
            //   ],
            // },
            {
              tag: 'markdown',
              content:
                '**运行模式**\n' +
                '_个人版(默认):Bot 是你一个人的助手,只有你和白名单用户能用,可携带你的个人授权访问文档/日历等_\n' +
                '_团队版:Bot 是团队共用的助手,任何人 @ 即可使用(不做白名单校验);为避免他人借 Bot 动用你的个人权限,此模式下 CLI 强制只用应用(bot)身份,不使用个人授权_',
            },
            {
              tag: 'select_static',
              name: 'deploy_mode',
              initial_option: opts.mode,
              options: [
                { text: { tag: 'plain_text', content: '个人版(默认)' }, value: 'personal' },
                { text: { tag: 'plain_text', content: '团队版' }, value: 'team' },
              ],
            },
            { tag: 'hr' },
            {
              tag: 'markdown',
              content: m.modelHeading,
            },
            {
              tag: 'select_static',
              name: 'model',
              initial_option: opts.model,
              options: supportedModels(opts.agentKind).map((opt) => ({
                text: { tag: 'plain_text', content: opt.label },
                value: opt.value,
              })),
            },
            { tag: 'hr' },
            {
              tag: 'markdown',
              content: m.toolCallsHeading,
            },
            {
              tag: 'select_static',
              name: 'show_tool_calls',
              initial_option: opts.showToolCalls ? 'show' : 'hide',
              options: [
                { text: { tag: 'plain_text', content: m.optShow }, value: 'show' },
                { text: { tag: 'plain_text', content: m.optHide }, value: 'hide' },
              ],
            },
            {
              tag: 'markdown',
              content: m.cotHeading,
            },
            {
              tag: 'select_static',
              name: 'cot_messages',
              initial_option: opts.cotMessages,
              options: [
                { text: { tag: 'plain_text', content: m.optCotOff }, value: 'off' },
                { text: { tag: 'plain_text', content: m.optCotBrief }, value: 'brief' },
                { text: { tag: 'plain_text', content: m.optCotDetailed }, value: 'detailed' },
              ],
            },
            {
              tag: 'markdown',
              content: m.effortHeading,
            },
            {
              tag: 'select_static',
              name: 'effort',
              initial_option: opts.effort ?? 'default',
              options: [
                { text: { tag: 'plain_text', content: m.optEffortDefault }, value: 'default' },
                { text: { tag: 'plain_text', content: 'low' }, value: 'low' },
                { text: { tag: 'plain_text', content: 'medium' }, value: 'medium' },
                { text: { tag: 'plain_text', content: 'high' }, value: 'high' },
                { text: { tag: 'plain_text', content: 'xhigh' }, value: 'xhigh' },
                { text: { tag: 'plain_text', content: 'max' }, value: 'max' },
              ],
            },
            {
              tag: 'markdown',
              content: m.concurrencyHeading,
            },
            {
              tag: 'input',
              name: 'max_concurrent_runs',
              default_value: String(opts.maxConcurrentRuns),
              placeholder: { tag: 'plain_text', content: '10' },
              input_type: 'text',
            },
            {
              tag: 'markdown',
              content: m.idleTimeoutHeading,
            },
            {
              tag: 'input',
              name: 'run_idle_timeout_minutes',
              default_value: String(opts.runIdleTimeoutMinutes),
              placeholder: { tag: 'plain_text', content: '0' },
              input_type: 'text',
            },
            {
              tag: 'markdown',
              content: m.mentionHeading,
            },
            {
              tag: 'select_static',
              name: 'require_mention_in_group',
              placeholder: { tag: 'plain_text', content: m.mentionPlaceholder },
              initial_option: opts.requireMentionInGroup ? 'yes' : 'no',
              options: [
                { text: { tag: 'plain_text', content: m.optMentionYes }, value: 'yes' },
                { text: { tag: 'plain_text', content: m.optMentionNo }, value: 'no' },
              ],
            },
            {
              tag: 'markdown',
              content: m.mentionNote,
            },
            {
              tag: 'markdown',
              content: m.identityHeading + (teamMode ? teamOverrideNote : ''),
            },
            {
              tag: 'select_static',
              name: 'lark_cli_identity',
              initial_option: opts.larkCliIdentity,
              options: [
                { text: { tag: 'plain_text', content: m.optIdentityBot }, value: 'bot-only' },
                { text: { tag: 'plain_text', content: m.optIdentityUser }, value: 'user-default' },
              ],
            },
            {
              tag: 'markdown',
              content: m.languageHeading,
            },
            {
              tag: 'select_static',
              name: 'language',
              initial_option: opts.language ?? activeLocale(),
              options: [
                { text: { tag: 'plain_text', content: m.langOptionZh }, value: 'zh-CN' },
                { text: { tag: 'plain_text', content: m.langOptionEn }, value: 'en-US' },
                { text: { tag: 'plain_text', content: m.langOptionJa }, value: 'ja-JP' },
              ],
            },
            { tag: 'hr' },
            collapsedAccessPanel(m.accessPanelTitle, accessElements),
            {
              tag: 'column_set',
              flex_mode: 'flow',
              horizontal_spacing: 'small',
              columns: [
                {
                  tag: 'column',
                  width: 'auto',
                  elements: [
                    {
                      tag: 'button',
                      name: 'submit_btn',
                      text: { tag: 'plain_text', content: m.submit },
                      type: 'primary',
                      form_action_type: 'submit',
                      behaviors: [{ type: 'callback', value: { cmd: 'config.submit' } }],
                    },
                  ],
                },
                {
                  tag: 'column',
                  width: 'auto',
                  elements: [
                    {
                      tag: 'button',
                      name: 'cancel_btn',
                      text: { tag: 'plain_text', content: m.cancel },
                      behaviors: [{ type: 'callback', value: { cmd: 'config.cancel' } }],
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
  };
}

export function configSavedCard(opts: ConfigFormOpts): object {
  const m = msgs().cards;
  const replyLabel =
    opts.messageReply === 'card'
      ? m.optCard
      : opts.messageReply === 'markdown'
        ? m.labelMarkdown
        : m.optText;
  const summarize = (list: string[]): string =>
    list.length === 0 ? m.emptyList : m.itemsCount(list.length);
  return {
    schema: '2.0',
    config: { summary: { content: m.configSavedSummary } },
    body: {
      elements: [
        {
          tag: 'markdown',
          content: m.configSavedBody({
            mode: opts.mode,
            replyLabel,
            showToolCalls: opts.showToolCalls,
            model: opts.model,
            effort: opts.effort,
            maxConcurrentRuns: opts.maxConcurrentRuns,
            runIdleTimeoutMinutes: opts.runIdleTimeoutMinutes,
            requireMentionInGroup: opts.requireMentionInGroup,
            mentionOverridesSummary: summarize(Object.keys(opts.chatRequireMention ?? {})),
            allowUserIdentity: opts.larkCliIdentity === 'user-default',
            allowedUsersSummary: summarize(opts.allowedUsers),
            allowedChatsSummary: summarize(opts.allowedChats),
            adminsSummary: summarize(opts.admins),
          }),
        },
      ],
    },
  };
}

/**
 * Shown after `/config` saves "群里不需要 @ bot" but the app is missing the
 * `im:message.group_msg` scope. Guides the user through one-click incremental
 * authorization via the link from `requestScopeGrantLink`.
 */
export function groupMsgScopeGrantCard(url: string, expireMins: number): object {
  const m = msgs().cards;
  return {
    schema: '2.0',
    config: { summary: { content: m.scopeGrantSummary } },
    body: {
      elements: [
        {
          tag: 'markdown',
          content: m.scopeGrantBody(url, expireMins),
        },
      ],
    },
  };
}

/** Replaces {@link groupMsgScopeGrantCard} in place once authorization completes. */
export function groupMsgScopeGrantedCard(): object {
  const m = msgs().cards;
  return {
    schema: '2.0',
    config: { summary: { content: m.scopeGrantedSummary } },
    body: {
      elements: [
        {
          tag: 'markdown',
          content: m.scopeGrantedBody,
        },
      ],
    },
  };
}

export function configCancelledCard(): object {
  const m = msgs().cards;
  return {
    schema: '2.0',
    config: { summary: { content: m.cancelledSummary } },
    body: {
      elements: [{ tag: 'markdown', content: m.configCancelledBody }],
    },
  };
}

export function configFailedCard(reason: string): object {
  const m = msgs().cards;
  return {
    schema: '2.0',
    config: { summary: { content: m.configFailedSummary } },
    body: {
      elements: [{ tag: 'markdown', content: m.configFailedBody(reason) }],
    },
  };
}
