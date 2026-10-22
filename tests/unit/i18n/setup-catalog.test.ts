import { afterEach, describe, expect, it } from 'vitest';
import { DEFAULT_LOCALE, jaJP, setActiveLocale, zhCN } from '../../../src/i18n/index.js';
import { MEETING_REQUIRED_SCOPES, classifyPreflight } from '../../../src/meeting/preflight.js';
import { addBotToChat, type LarkCliExec } from '../../../src/lark-cli/user-im.js';

afterEach(() => setActiveLocale(DEFAULT_LOCALE));

describe('setup messages follow the locale active at call time', () => {
  it('meeting scope purposes are not frozen at import', () => {
    setActiveLocale('ja-JP');
    expect(MEETING_REQUIRED_SCOPES[0]?.purpose).toBe(jaJP.setup.meetingScopeJoin);
    expect(JSON.stringify(MEETING_REQUIRED_SCOPES)).toContain(jaJP.setup.meetingScopeEvent);
    setActiveLocale('zh-CN');
    expect(MEETING_REQUIRED_SCOPES[0]?.purpose).toBe(zhCN.setup.meetingScopeJoin);
  });

  it('meeting preflight diagnosis renders in Japanese', () => {
    setActiveLocale('ja-JP');
    expect(classifyPreflight({ ok: true }).message).toBe(jaJP.setup.meetingPreflightOk);
    expect(classifyPreflight({ ok: false, error: { code: 20017 } }).message).toBe(jaJP.setup.meetingNotInBeta);
  });

  it('user-im errors render in Japanese', async () => {
    setActiveLocale('ja-JP');
    const timedOut: LarkCliExec = async () => ({ code: null, stdout: '', stderr: '', timedOut: true });
    const r = await addBotToChat({ profile: 'p' }, 'oc_1', 'cli_bot', timedOut);
    expect(r.message).toBe(`${jaJP.setup.addBotFailed}: ${jaJP.setup.commandTimedOut}`);
  });
});
