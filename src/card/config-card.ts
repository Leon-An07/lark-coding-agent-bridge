import type { KnownChat } from '../bot/lark-info';
import type { LarkCliIdentityPreset } from '../config/profile-schema';
import type { CotMessagesMode, MessageReplyMode } from '../config/schema';
import { activeLocale, msgs, type Locale } from '../i18n';

export interface ConfigFormOpts {
  messageReply: MessageReplyMode;
  showToolCalls: boolean;
  cotMessages: CotMessagesMode;
  maxConcurrentRuns: number;
  /** 0 means "disabled". */
  runIdleTimeoutMinutes: number;
  requireMentionInGroup: boolean;
  requireMentionInGroupOverrides: Record<string, boolean>;
  larkCliIdentity: LarkCliIdentityPreset;
  /** Current UI language (caller passes `getLanguage(cfg)`). Falls back to
   * the ambient active locale, which is set from the same preference. */
  language?: Locale;
  allowedUsers: string[];
  allowedChats: string[];
  admins: string[];
  knownChats: KnownChat[];
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
  const accessElements: object[] = [
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
        Object.keys(opts.requireMentionInGroupOverrides).length,
        mentionOverrideList(opts.requireMentionInGroupOverrides, opts.knownChats),
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
        { tag: 'hr' },
        {
          tag: 'form',
          name: 'config_form',
          elements: [
            {
              tag: 'markdown',
              content: m.messageReplyHeading,
            },
            {
              tag: 'select_static',
              name: 'message_reply',
              initial_option: opts.messageReply,
              options: [
                { text: { tag: 'plain_text', content: m.optText }, value: 'text' },
                { text: { tag: 'plain_text', content: m.optMarkdown }, value: 'markdown' },
                { text: { tag: 'plain_text', content: m.optCard }, value: 'card' },
              ],
            },
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
              content: m.identityHeading,
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
            replyLabel,
            showToolCalls: opts.showToolCalls,
            maxConcurrentRuns: opts.maxConcurrentRuns,
            runIdleTimeoutMinutes: opts.runIdleTimeoutMinutes,
            requireMentionInGroup: opts.requireMentionInGroup,
            mentionOverridesSummary: summarize(Object.keys(opts.requireMentionInGroupOverrides)),
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
