# Windows issue triage (upstream zarazhangrui/lark-coding-agent-bridge)

Snapshot of the open upstream issues that touch Windows, checked against this
fork on 2026-10-23. Upstream is unmaintained, so fixes land here. Status
values:

- **fixed**: current code no longer has the bug. Evidence names the file or commit.
- **fixed here**: fixed by this fork's Windows work (see "Fork commits" below).
- **needs-fix**: still broken. The proposal says what to change.
- **wont-fix**: not a bridge bug, out of scope, or needs reporter info.

Fork commits referenced:

- `1370160` fix(windows): survive CJK codepages and localized schtasks
- `495ec99` feat(i18n): follow the OS locale and translate the remaining CLI text
- `e81b6bf` fix(windows): fix triaged upstream Windows issues

## Table

| # | Summary | Status | Evidence | Next step |
|---|---|---|---|---|
| 274 | After SIGTERM the claude process survives on Windows | fixed here | `killProcessTree` (`src/platform/spawn.ts`) now runs `taskkill /PID <pid> /T /F` on win32. `child.kill()` only ended cmd.exe, the `.cmd` shim's process. Test: `tests/unit/platform/kill-tree.test.ts` (Windows CI only). | Close upstream once CI on Windows is green. |
| 273 | Standard users get "Access is denied" from `start`; black console window | partly fixed here | `installTask` (`src/daemon/schtasks.ts`) registers the task from XML with a `LogonTrigger` scoped to the current user and `LeastPrivilege`. The `/SC ONLOGON` flag form needs admin. The XML also removes the schtasks defaults that stopped the daemon after 72 hours or on battery. The visible console window is not fixed. | Window: a hidden launcher (VBScript, which Microsoft is deprecating, or `conhost --headless`). Needs a test on real Windows before it ships. |
| 272 | Localized schtasks output breaks status, PID, and stop | fixed here (`1370160`) | Running is detected from Last Result `267009`. The PID comes from a PID file the service writes. `stop` kills the tree with `taskkill /T /F`. A lock whose holder PID is dead is reclaimed at once (`src/runtime/locks.ts`). | None. |
| 241 | "could not resolve bot identity" at startup | wont-fix | Logs show `getaddrinfo ENOTFOUND open.feishu.cn`, a DNS or network fault. The SDK throws it after its own retries. | Optional: print a proxy/VPN hint on ENOTFOUND. |
| 201 | `--resume` session ID changes every time | wont-fix (needs info) | No Windows-specific code touches the session ID. The prompt now goes via stdin (e641bbf). The reporter uses a third-party gateway. | Ask for a re-test on 0.7.x. |
| 165 | exec provider "exit status 1"; stale `processes.json` after `kill` | bug 1 needs-fix (#126); bug 2 fixed here | Bug 2: the stale entry kept its lock "held" for 30 s, which blocked `start`. A dead holder is now reclaimed at once, and the next registry write prunes the entry. | See #126. |
| 153 | Audit failure; non-JSON stdout dropped | bug 1 needs-fix (#126); bug 2 wont-fix | `claude/adapter.ts` drops non-JSON lines, which come from non-Anthropic gateway models. | Optional: log dropped lines at warn. |
| 142 | Text messages reply "(no content)" | fixed | e641bbf sends the prompt via stdin; cmd.exe no longer eats `<bridge_context>`. | Close upstream. |
| 140, 126, 117, 91, 88, 87 | `secrets-getter.cmd` fails the lark-cli "world-writable (mode 0666)" audit | needs-fix | Go's `os.Stat` reports 0666 for any writable file on NTFS, so lark-cli's exec-provider audit always fails on Windows. A read-only wrapper breaks the bridge's atomic rewrite. lark-cli 1.0.89 contains `LARKSUITE_CLI_APP_ID` / `LARKSUITE_CLI_APP_SECRET`; the #87 reporter verified that both set skip the exec provider. | Inject both vars on win32 where `buildLarkChannelEnv` builds lark-cli and agent env. Not done here: it is unverified whether env credentials override the `lark-channel` source binding and its bot identity policy. Verify on Windows first. Workaround: `--skip-check-lark-cli` or WSL2. |
| 131 | Win11 quick-start notes | fixed (doc) | The `claude.exe` swap is no longer needed (cross-spawn + stdin prompt). | README troubleshooting covers the rest. |
| 128 | Windows deployment lessons | partly fixed | "(no content)": fixed (e641bbf). Stale locks after restart: fixed here. `start` without admin: fixed here (#273). Black window: open (#273). World-writable audit: open (#126). | README troubleshooting. |
| 119 | Wizard "Invalid URL" | wont-fix (needs info) | Reporter is on macOS, with a WSL "+1". | Ask for a stack trace. |
| 118 | WSL2 workaround | wont-fix (info) | Reporter closed it as resolved. | Mentioned in README troubleshooting. |
| 82 | "(no content)" | partly fixed | The cmd.exe cause is fixed (e641bbf). Later reports are #126. | See #126. |
| 69 | Claude CLI invocation broken | fixed | cross-spawn (`src/platform/spawn.ts`) plus stdin prompt (e641bbf). | Close upstream. |
| 51 | Black console window flashes for every spawn | fixed here | `spawnProcess` / `spawnProcessSync` default to `windowsHide: true`. | None. |
| 49, 33, 17, 16, 13 | `spawn claude ENOENT`, `.cmd` not found | fixed | cross-spawn resolves `claude.cmd` via PATHEXT (`src/platform/spawn.ts`). | Close upstream. #13's hang outside the claude dir points at the reporter's machine. |
| 70 | `/resume` empty when cwd has spaces or CJK | fixed | `src/session/history.ts` maps every non-alphanumeric char to `-`, as Claude Code does. | Close upstream. |
| 245, 146 | lark-cli "does not match detected Agent environment (hermes)" | wont-fix | `HERMES_HOME` in the user's env makes lark-cli detect another agent. | Optional: drop `HERMES_HOME` from lark-cli's env. |
| 339 | Codex `unelevated` sandbox: lark-cli DPAPI unprotect fails | wont-fix | Fails inside lark-cli under Codex's restricted token, not in bridge code. | Keep Codex `elevated`, or use the #126 env route. |
| 53 | Node 20.11 `styleText` error | wont-fix | `engines.node` is `>=20.12.0`. | README states the Node version. |
| — | Mojibake in schtasks / npm / lark-cli errors on CJK Windows | fixed here (`1370160`) | Shared decoder `src/platform/console-decode.ts` decodes non-UTF-8 lines with the OEM codepage. | None. |
| — | Non-ASCII user path (`C:\Users\田中`) breaks generated `.cmd` files | fixed here (`1370160`) | `src/platform/windows-batch.ts` writes ASCII bodies with `%USERPROFILE%`-style references. | None. |
| — | Japanese Windows shows Chinese UI on first run | fixed here (`495ec99`) | `detectOsLocale()` falls back to Intl's ICU locale; Windows sets no `LANG`. | None. |

Not Windows-specific, not triaged here: #290 (`ps` lists dead processes; the
read path is read-only by design), #259, #228, #154, #141, #130, #27, #307.

## Verification limits

The fixes were developed on macOS. The Windows-only tests
(`tests/unit/platform/windows-batch.test.ts`, `kill-tree.test.ts`,
`tests/unit/daemon/schtasks-xml.test.ts`) run on the `windows-latest` CI job.
That runner is an English install with OEM codepage 437 and an admin account.
It proves ASCII-safe `.cmd` handling and XML registration. It does not prove
CP932 console behavior or the non-admin path for #273. The Japanese schtasks
fixtures are synthesized from the field layout, and the check keys on the
numeric `267009` only.
