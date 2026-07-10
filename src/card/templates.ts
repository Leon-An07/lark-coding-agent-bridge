import { msgs } from '../i18n';

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
 * The card a clicked/submitted agent card is replaced with: a green "✅ 已完成"
 * card that tucks what the user submitted into a collapsed "查看提交内容" panel
 * (click to expand). No buttons, so it can't be answered again.
 */
export function lockedCard(result?: string): object {
  const m = msgs().cards;
  const elements: object[] = result
    ? [
        {
          tag: 'collapsible_panel',
          expanded: false,
          header: {
            title: { tag: 'markdown', content: m.lockedPanelTitle },
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
    : [{ tag: 'markdown', content: m.lockedBody }];
  return {
    schema: '2.0',
    config: { summary: { content: m.doneLabel } },
    header: { title: { tag: 'plain_text', content: m.lockedHeader }, template: 'green' },
    body: { elements },
  };
}

/**
 * The card an expired agent card is greyed into when someone clicks it after
 * the token expiry — a grey, button-less "⏰ 已过期" card. Generic (the
 * original spec isn't available at click time), which is fine: it's dead.
 */
export function expiredCard(): object {
  const m = msgs().cards;
  return {
    schema: '2.0',
    config: { summary: { content: m.expiredSummary } },
    header: { title: { tag: 'plain_text', content: m.expiredHeader }, template: 'grey' },
    body: { elements: [{ tag: 'markdown', content: m.expiredBody }] },
  };
}

/**
 * Grey out a still-open interactive card after the user answered with a text
 * reply instead of a click: grey header, every button disabled + its callback
 * value stripped, and a closed-note prepended. Options stay visible but inert.
 */
export function disabledCard(card: object): object {
  const clone = JSON.parse(JSON.stringify(card)) as {
    header?: { template?: string };
    body?: { elements?: unknown[] };
  };
  disableButtons(clone);
  if (clone.header) clone.header.template = 'grey'; // grey header signals "closed"
  const body = (clone.body ??= {});
  (body.elements ??= []).unshift({ tag: 'markdown', content: msgs().cards.disabledNote });
  return clone;
}

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

export function workspacesCard(current: string | undefined, named: Record<string, string>): object {
  const m = msgs().cards;
  const entries = Object.entries(named);
  const elements: object[] = [];

  elements.push(divMd(m.cwdLine(escapeCode(current ?? m.notSet))));

  if (entries.length === 0) {
    elements.push(HR);
    elements.push(divMd(m.noNamedWorkspaces));
    elements.push(divMd(m.wsSaveHint));
  } else {
    elements.push(HR);
    entries.forEach(([name, path], i) => {
      const marker = path === current ? m.currentMarker : '';
      elements.push(divMd(`**${escapeMd(name)}** → \`${escapeCode(path)}\`${marker}`));
      elements.push(
        actions([
          { text: m.switchHere, value: { cmd: 'ws.use', name }, style: 'primary' },
          { text: m.deleteLabel, value: { cmd: 'ws.remove', name }, style: 'danger' },
        ]),
      );
      if (i < entries.length - 1) elements.push(HR);
    });
  }

  return shell(m.workspacesLabel, elements);
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
  const m = msgs().cards;
  const sessionLine = info.sessionId
    ? `\`${info.sessionId}\`${info.sessionStale ? m.sessionStaleSuffix : ''}`
    : (info.emptySessionText ?? m.noSession);
  // For thread-scoped conversations (topic groups, or a thread reply in a
  // regular group), surface that the scope is per-thread so the user knows
  // /cd / /new only affect this thread. A `chatId:threadId` scope carries a
  // ':' that a plain chatId never does.
  const scopeLine = info.scope.includes(':')
    ? m.topicScopeLine(escapeCode(info.scope))
    : `\`${escapeCode(info.scope)}\``;
  const cwdLine = info.cwd ? `\`${escapeCode(info.cwd)}\`` : m.notSet;
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
  return shell(m.statusTitle, [
    divMd(lines.join('\n')),
    HR,
    actions([
      { text: m.btnNewSession, value: { cmd: 'new' }, style: 'primary' },
      { text: m.btnResume, value: { cmd: 'resume' } },
      { text: m.workspacesLabel, value: { cmd: 'ws.list' } },
      { text: m.btnHelp, value: { cmd: 'help' } },
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
  const m = msgs().cards;
  const elements: object[] = [];
  elements.push(divMd(m.cwdLine(escapeCode(cwd))));

  if (entries.length === 0) {
    elements.push(HR);
    elements.push(divMd(m.noHistorySessions));
    return shell(m.resumeTitle, elements);
  }

  elements.push(HR);
  entries.forEach((e, i) => {
    const marker = e.current ? m.currentMarker : '';
    const detail = e.detail ?? m.lineCount(e.lineCount ?? 0);
    const displayId = e.displayId ?? e.sessionId;
    elements.push(
      divMd(
        `**${i + 1}.** ${escapeMd(e.preview)}${marker}\n\`${displayId.slice(0, 8)}…\` · ${e.relTime} · ${escapeMd(detail)}`,
      ),
    );
    elements.push(
      actions([
        {
          text: e.current ? m.alreadyCurrentSession : m.resumeThisSession,
          value: { cmd: 'resume.use', arg: e.sessionId },
          style: e.current ? 'default' : 'primary',
        },
      ]),
    );
    if (i < entries.length - 1) elements.push(HR);
  });

  return shell(m.resumeTitle, elements);
}

export function helpCard(agentName = 'Agent'): object {
  const m = msgs().cards;
  const escapedAgentName = escapeMd(agentName);
  return shell(m.helpTitle, [
    divMd(m.helpBody(escapedAgentName)),
    HR,
    actions([
      { text: m.btnStatus, value: { cmd: 'status' }, style: 'primary' },
      { text: m.btnResume, value: { cmd: 'resume' } },
      { text: m.workspacesLabel, value: { cmd: 'ws.list' } },
      { text: m.btnNewSession, value: { cmd: 'new' } },
    ]),
  ]);
}

function escapeMd(s: string): string {
  return s.replace(/([*_`\\])/g, '\\$1');
}

function escapeCode(s: string): string {
  return s.replace(/`/g, "'");
}
