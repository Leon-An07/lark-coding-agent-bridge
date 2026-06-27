import { askFieldName, type AskCardSpec, type AskMapEntry } from './agent-card';

interface ButtonSpec {
  text: string;
  value: Record<string, unknown>;
  style?: 'primary' | 'danger' | 'default';
}

function button(spec: ButtonSpec): object {
  return {
    tag: 'button',
    text: { tag: 'plain_text', content: spec.text },
    type: spec.style ?? 'default',
    value: spec.value,
  };
}

function divMd(content: string): object {
  return { tag: 'div', text: { tag: 'lark_md', content } };
}

function actions(buttons: ButtonSpec[]): object {
  return { tag: 'action', actions: buttons.map(button) };
}

const HR: object = { tag: 'hr' };

function shell(title: string, elements: object[]): object {
  return {
    config: { wide_screen_mode: true, update_multi: true },
    header: { title: { tag: 'plain_text', content: title } },
    elements,
  };
}

/**
 * Signs an agent callback for a specific clicker ('*' = anyone). Provided by the
 * bridge, which holds the app secret — the agent never sees it. Returns a
 * bridge_token (HMAC) bound to scope/chat/operator/action + nonce + expiry.
 */
export type AgentCardSigner = (operatorOpenId: string) => string;

/** Who may click, per `restrict`: 'me' → the asker, 'anyone' → '*' (wildcard
 * operator), or a specific open_id. Falls back to '*' if the asker is unknown. */
function restrictOperator(spec: AskCardSpec, askerOpenId?: string): string {
  const restrict = spec.restrict ?? 'me';
  if (restrict === 'anyone') return '*';
  if (restrict === 'me') return askerOpenId ?? '*';
  return String(restrict);
}

/**
 * A callback button value = the agent's fields + the bridge's signature. The
 * `bridge_token` is added LAST so the agent's own fields can never override it.
 * Operator binding, single-use and expiry all live inside the signed token.
 */
function callbackValue(
  fields: Record<string, unknown>,
  token?: string,
): Record<string, unknown> {
  const value: Record<string, unknown> = { __bridge_cb: true, ...fields };
  if (token) value.bridge_token = token;
  return value;
}

/**
 * The card a clicked/submitted agent card is replaced with: a green "✅ 已完成"
 * card that tucks what the user submitted into a collapsed "查看提交内容" panel
 * (click to expand). No buttons, so it can't be answered again.
 */
export function lockedCard(result?: string): object {
  const elements: object[] = result
    ? [
        {
          tag: 'collapsible_panel',
          expanded: false,
          header: {
            title: { tag: 'markdown', content: '查看提交内容' },
            vertical_align: 'center',
            icon: { tag: 'standard_icon', token: 'down-small-ccm_outlined', size: '16px 16px' },
            icon_position: 'follow_text',
            icon_expanded_angle: -180,
          },
          border: { color: 'green', corner_radius: '5px' },
          padding: '8px 8px 8px 8px',
          elements: [{ tag: 'markdown', content: result }],
        },
      ]
    : [{ tag: 'markdown', content: '已收到你的操作,这张卡已完成。' }];
  return {
    schema: '2.0',
    config: { summary: { content: '已完成' } },
    header: { title: { tag: 'plain_text', content: '✅ 已完成' }, template: 'green' },
    body: { elements },
  };
}

/**
 * A copy of a sent agent card with every button disabled (and its callback
 * stripped) plus a note prepended. Used to auto-close a card the user
 * superseded by replying with text instead of clicking — the options stay
 * visible (greyed) but can no longer be clicked.
 */
export function disabledCard(card: object): object {
  const clone = JSON.parse(JSON.stringify(card)) as {
    header?: { template?: string };
    body?: { elements?: unknown[] };
  };
  disableButtons(clone);
  if (clone.header) clone.header.template = 'grey'; // grey header signals "closed"
  const body = (clone.body ??= {});
  (body.elements ??= []).unshift({ tag: 'markdown', content: '_已改用文字回复,此卡已关闭_' });
  return clone;
}

/** Recursively grey out every button and strip its callback so it's inert. */
function disableButtons(node: unknown): void {
  if (Array.isArray(node)) {
    for (const child of node) disableButtons(child);
    return;
  }
  if (!node || typeof node !== 'object') return;
  const obj = node as Record<string, unknown>;
  if (obj.tag === 'button') {
    obj.disabled = true;
    delete obj.behaviors;
    delete obj.value;
  }
  for (const key of Object.keys(obj)) disableButtons(obj[key]);
}

/**
 * The card an expired agent card is greyed into when someone clicks it after
 * the token expiry — a grey, button-less "⏰ 已过期" card. Generic (the
 * original spec isn't available at click time), which is fine: it's dead.
 */
export function expiredCard(): object {
  return {
    schema: '2.0',
    config: { summary: { content: '已过期' } },
    header: { title: { tag: 'plain_text', content: '⏰ 已过期' }, template: 'grey' },
    body: { elements: [{ tag: 'markdown', content: '这张卡片已过期,请重新发送你的需求。' }] },
  };
}

/**
 * Build an interactive "ask" card from an agent-authored spec. The bridge signs
 * the card (via `sign`) so clicks are cryptographically bound — the agent never
 * touches the secret.
 *
 * ONE token is signed per card and shared by every button, so its single-use
 * nonce makes the WHOLE card answered-once: the first valid click consumes it,
 * any later click (even on a different option) is rejected.
 *
 * Both shapes are schema-2.0 cards sent as managed card entities, so a click
 * can reliably update them in place (cardkit) — the same lifecycle /config uses.
 *  - `questions[]` (AskUserQuestion model) → a `form` with select / multi-select
 *    / checkbox / date / person / text-input, answered in one submit.
 *  - `buttons[]` (quick one-click) → 2.0 buttons (callback via `behaviors`).
 */
export function askCard(spec: AskCardSpec, askerOpenId?: string, sign?: AgentCardSigner): object {
  const operator = restrictOperator(spec, askerOpenId);
  const token = sign?.(operator);

  if (Array.isArray(spec.questions) && spec.questions.length > 0) {
    return buildQuestionsForm(spec, token);
  }

  const header = spec.header ? String(spec.header) : '请选择';
  const elements: object[] = [];
  if (spec.text) elements.push({ tag: 'markdown', content: String(spec.text) });
  const buttons = Array.isArray(spec.buttons) ? spec.buttons.slice(0, 12) : [];
  if (buttons.length > 0) {
    elements.push({
      tag: 'column_set',
      flex_mode: 'flow',
      horizontal_spacing: 'small',
      columns: buttons.map((b) => ({
        tag: 'column',
        width: 'auto',
        elements: [
          {
            tag: 'button',
            text: { tag: 'plain_text', content: String(b?.text ?? 'OK') },
            type: b?.style === 'danger' ? 'danger' : b?.style === 'primary' ? 'primary' : 'default',
            behaviors: [
              {
                type: 'callback',
                value: callbackValue(
                  b?.value && typeof b.value === 'object' && !Array.isArray(b.value)
                    ? (b.value as Record<string, unknown>)
                    : { value: b?.value ?? b?.text ?? null },
                  token,
                ),
              },
            ],
          },
        ],
      })),
    });
  }
  return {
    schema: '2.0',
    config: { summary: { content: header } },
    header: { title: { tag: 'plain_text', content: header }, template: 'blue' },
    body: { elements },
  };
}

/**
 * Build a schema-2.0 form card from the `questions` model — faithful to the
 * official AskUserQuestion card: a single `form` container holding one
 * select_static / multi_select_static / input per question, plus a submit
 * button. select/multi/input need NO value (they cache locally); only the
 * submit button carries a value (Lark rejects a value-less button: code
 * 200340). The `__ask` map lets the bridge turn form_value back into clean
 * `{question: answer}` for the agent.
 */
function buildQuestionsForm(spec: AskCardSpec, token?: string): object {
  const questions = (spec.questions ?? []).slice(0, 10);
  const formElements: object[] = [];
  const askMap: AskMapEntry[] = [];

  questions.forEach((q, i) => {
    if (i > 0) formElements.push({ tag: 'hr' });
    const header = String(q?.header ?? q?.question ?? `问题 ${i + 1}`);
    formElements.push({ tag: 'markdown', content: `**${header}**` });
    if (q?.question && q.question !== header) {
      formElements.push({ tag: 'markdown', content: String(q.question), text_size: 'notation' });
    }
    const field = askFieldName(i);
    const qText = String(q?.question ?? header);
    const opts = Array.isArray(q?.options) ? q.options : [];
    const multi = Boolean(q?.multiSelect);
    const type = q?.type ?? (opts.length > 0 ? 'select' : 'input');

    if (type === 'date') {
      formElements.push({
        tag: 'date_picker',
        name: field,
        placeholder: { tag: 'plain_text', content: '选择日期…' },
      });
      askMap.push({ f: field, q: qText, k: 'date' });
    } else if (type === 'person') {
      formElements.push({
        tag: multi ? 'multi_select_person' : 'select_person',
        name: field,
        placeholder: { tag: 'plain_text', content: multi ? '选择人员（可多选）…' : '选择人员…' },
      });
      askMap.push({ f: field, q: qText, k: multi ? 'persons' : 'person' });
    } else if (type === 'input' || opts.length === 0) {
      formElements.push({
        tag: 'input',
        name: field,
        placeholder: { tag: 'plain_text', content: '请输入…' },
      });
      askMap.push({ f: field, q: qText, k: 'input' });
    } else if (multi && q?.selectStyle === 'checkbox') {
      // Checkbox style: one `checker` per option (all visible at once). Each
      // checker needs a `value` to pass Lark's client validation (code 200340).
      const optEntries = opts.map((o, j) => ({ f: `${field}_o${j}`, label: String(o.label) }));
      optEntries.forEach((oe) => {
        formElements.push({
          tag: 'checker',
          name: oe.f,
          checked: false,
          text: { tag: 'plain_text', content: oe.label },
          value: { option: oe.label },
        });
      });
      askMap.push({ f: field, q: qText, k: 'checker', opts: optEntries });
    } else {
      formElements.push({
        tag: multi ? 'multi_select_static' : 'select_static',
        name: field,
        placeholder: { tag: 'plain_text', content: multi ? '请选择（可多选）…' : '请选择…' },
        options: opts.map((o) => ({
          text: { tag: 'plain_text', content: String(o.label) },
          value: String(o.label),
        })),
      });
      askMap.push({ f: field, q: qText, k: multi ? 'multi' : 'select' });
    }

    const desc = opts.filter((o) => o.description).map((o) => `• **${o.label}**：${o.description}`);
    if (desc.length > 0) {
      formElements.push({ tag: 'markdown', content: desc.join('\n'), text_size: 'notation' });
    }
  });

  formElements.push({ tag: 'hr' });
  const submitValue = callbackValue({ __ask: askMap }, token);
  formElements.push({
    tag: 'button',
    name: 'ask_submit',
    text: { tag: 'plain_text', content: '📮 提交' },
    type: 'primary',
    form_action_type: 'submit',
    // Callback fires via `behaviors` only (the schema-2.0 way, exactly like the
    // /config submit button). A top-level `value` here would make Feishu also
    // treat it as a v1 action and re-render the form, reverting our lock.
    behaviors: [{ type: 'callback', value: submitValue }],
  });

  return {
    schema: '2.0',
    config: { summary: { content: spec.header ? String(spec.header) : '需要你的确认' } },
    header: {
      title: { tag: 'plain_text', content: spec.header ? String(spec.header) : '需要你的确认' },
      template: 'blue',
    },
    body: { elements: [{ tag: 'form', name: 'ask_form', elements: formElements }] },
  };
}

export function workspacesCard(current: string | undefined, named: Record<string, string>): object {
  const entries = Object.entries(named);
  const elements: object[] = [];

  elements.push(divMd(`当前 cwd：\`${escapeCode(current ?? '(未设置)')}\``));

  if (entries.length === 0) {
    elements.push(HR);
    elements.push(divMd('暂无命名工作目录。'));
    elements.push(
      divMd('💡 发送 `/ws save <name>` 把当前 cwd 存为命名工作目录'),
    );
  } else {
    elements.push(HR);
    entries.forEach(([name, path], i) => {
      const marker = path === current ? '  ← 当前' : '';
      elements.push(divMd(`**${escapeMd(name)}** → \`${escapeCode(path)}\`${marker}`));
      elements.push(
        actions([
          { text: '切换到此处', value: { cmd: 'ws.use', name }, style: 'primary' },
          { text: '删除', value: { cmd: 'ws.remove', name }, style: 'danger' },
        ]),
      );
      if (i < entries.length - 1) elements.push(HR);
    });
  }

  return shell('📂 工作目录', elements);
}

export interface StatusInfo {
  profileName: string;
  cwd?: string;
  sessionId?: string;
  emptySessionText?: string;
  sessionStale: boolean;
  agentName: string;
  runtimeAccess: {
    label: string;
    value: string;
  };
  larkCliStatus?: 'app' | 'user-ready' | 'user-missing' | 'check-failed';
  activeRun: boolean;
  activeCommentScopes?: string[];
  queue?: { active: number; waiting: number; cap: number };
  ownerState: string;
  /** Session scope (= chatId or chatId:threadId in topic groups). */
  scope: string;
  /** Chat mode — used to label scope. */
  chatMode: 'p2p' | 'group' | 'topic';
}

export function statusCard(info: StatusInfo): object {
  const sessionLine = info.sessionId
    ? `\`${info.sessionId.slice(0, 8)}…\`${info.sessionStale ? ' ⚠️ 旧 cwd，下一条会新建' : ''}`
    : (info.emptySessionText ?? '(无)');
  // For topic groups, surface that the scope is per-topic so the user
  // knows /cd / /new only affect this topic.
  const scopeLine =
    info.chatMode === 'topic'
      ? `\`${escapeCode(info.scope)}\` _（话题独立 session）_`
      : `\`${escapeCode(info.scope)}\``;
  const cwdLine = info.cwd ? `\`${escapeCode(info.cwd)}\`` : '(未设置)';
  const queueLine = info.queue
    ? `${info.queue.active}/${info.queue.cap} active, ${info.queue.waiting} waiting`
    : 'unknown';
  const lines = [
    `🧭 **scope**: ${scopeLine}`,
    `🧩 **profile**: ${escapeMd(info.profileName)}`,
    `📁 **cwd**: ${cwdLine}`,
    `🔗 **session**: ${sessionLine}`,
    `🤖 **agent**: ${escapeMd(info.agentName)}`,
    `🛡 **${escapeMd(info.runtimeAccess.label)}**: ${escapeMd(info.runtimeAccess.value)}`,
    ...(info.larkCliStatus ? [`🔐 **lark-cli**: ${info.larkCliStatus}`] : []),
    `🏃 **active run**: ${info.activeRun ? 'yes' : 'no'}`,
    ...(info.activeCommentScopes && info.activeCommentScopes.length > 0
      ? [
          `📝 **comment runs**: ${info.activeCommentScopes.map((scope) => `\`${escapeCode(scope)}\``).join(', ')}`,
        ]
      : []),
    `🚦 **queue**: ${queueLine}`,
    `👤 **owner API**: ${escapeMd(info.ownerState)}`,
  ];
  return shell('📊 当前状态', [
    divMd(lines.join('\n')),
    HR,
    actions([
      { text: '🆕 新会话', value: { cmd: 'new' }, style: 'primary' },
      { text: '🔁 恢复会话', value: { cmd: 'resume' } },
      { text: '📂 工作目录', value: { cmd: 'ws.list' } },
      { text: '💡 帮助', value: { cmd: 'help' } },
    ]),
  ]);
}

export interface ResumeEntry {
  sessionId: string;
  displayId?: string;
  preview: string;
  relTime: string;
  lineCount?: number;
  detail?: string;
  current?: boolean;
}

export function resumeCard(cwd: string, entries: ResumeEntry[]): object {
  const elements: object[] = [];
  elements.push(divMd(`当前 cwd：\`${escapeCode(cwd)}\``));

  if (entries.length === 0) {
    elements.push(HR);
    elements.push(divMd('此 cwd 下没有历史会话。'));
    return shell('🔁 恢复历史会话', elements);
  }

  elements.push(HR);
  entries.forEach((e, i) => {
    const marker = e.current ? '  ← 当前' : '';
    const detail = e.detail ?? `${e.lineCount ?? 0} 条`;
    const displayId = e.displayId ?? e.sessionId;
    elements.push(
      divMd(
        `**${i + 1}.** ${escapeMd(e.preview)}${marker}\n\`${displayId.slice(0, 8)}…\` · ${e.relTime} · ${escapeMd(detail)}`,
      ),
    );
    elements.push(
      actions([
        {
          text: e.current ? '已是当前会话' : '▸ 恢复此会话',
          value: { cmd: 'resume.use', arg: e.sessionId },
          style: e.current ? 'default' : 'primary',
        },
      ]),
    );
    if (i < entries.length - 1) elements.push(HR);
  });

  return shell('🔁 恢复历史会话', elements);
}

export function helpCard(agentName = 'Agent'): object {
  const escapedAgentName = escapeMd(agentName);
  return shell('💡 使用帮助', [
    divMd(
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
        '- `/status` — 当前状态',
        '- `/stop` — 结束当前正在跑的任务（也可点卡片底部 ⏹ 终止 按钮）',
        '- `/stop comment:<scopeHash>` — 管理员停止云文档评论任务',
        '- `/timeout [N|off|default]` — 当前 session 的探活分钟数,`/config` 改全局默认',
        '- `/timeout comment:<scopeHash> N` — 管理员设置云文档评论任务探活',
        '- `/ps` — 列出本机所有 bot,标识当前正在回复的那个',
        '- `/exit <id|#>` — 关掉指定 bot(用 `/ps` 看 id/序号)',
        '- `/reconnect` — 强制重连 WebSocket(网络抖动后 bot 没反应时用)',
        `- \`/doctor [描述]\` — 把日志和描述交给 ${escapedAgentName} 自助诊断`,
        '- `/help` — 本帮助',
        '',
        `其他内容直接交给 ${escapedAgentName}。`,
      ].join('\n'),
    ),
    HR,
    actions([
      { text: '📊 状态', value: { cmd: 'status' }, style: 'primary' },
      { text: '🔁 恢复会话', value: { cmd: 'resume' } },
      { text: '📂 工作目录', value: { cmd: 'ws.list' } },
      { text: '🆕 新会话', value: { cmd: 'new' } },
    ]),
  ]);
}

function escapeMd(s: string): string {
  return s.replace(/([*_`\\])/g, '\\$1');
}

function escapeCode(s: string): string {
  return s.replace(/`/g, "'");
}
