# lark-channel-bridge

Lark のメッセンジャーとローカルの Claude Code または Codex CLI をつなぐ軽量な bot です。コマンドを 1 つ実行し、QR コードをスキャンして PersonalAgent アプリを紐づけると、チャットからローカルのコーディングエージェントと対話できます。

[English README](./README.md) · [中文 README](./README.zh.md)

機能の全体像は [Feishu ドキュメント](https://larkcommunity.feishu.cn/docx/OaRIdFIRFoLM3xxTmKwcetHqn5e)を参照してください。

## できること

- Lark のメッセージをローカルの Claude Code または Codex CLI に転送します。DM で直接送るか、グループで `@bot` を付けて送ります。
- **ストリーミングカード**: テキストの返信とツール呼び出しが、1 枚の Lark カード上でリアルタイムに更新されます。
- **COT 経過メッセージ**: エージェントの進行状況のテキストとツール呼び出しを経過メッセージとして先に送り、最終回答を別のメッセージで送ることもできます（任意）。
- **セッションの継続**: チャット、トピック、ドキュメントのコメントスレッドごとに独立したセッションを保持します。
- **キューイングとまとめ処理**: 短時間に連続して送られたメッセージはまとめて処理されます。実行中に送られたメッセージは次のターンに回されます。`/new`、`/cd`、`/ws use`、`/stop` などのコマンドは実行中のタスクを中断できます。
- **複数ワークスペース**: `/cd` で現在のプロジェクトを切り替え、`/ws` でよく使うプロジェクトディレクトリを保存して再利用できます。
- **画像とファイル**: bot に直接送ると、bridge がローカルにダウンロードしてエージェントに渡します。
- **インタラクティブカード**: `/help`、`/ws list`、`/status` はクリックできるボタン付きのカードを返します。

## 前提条件

- Node.js **>= 20.12.0**
- ローカルにインストールしてログイン済みのエージェントが 1 つ以上あること:
  - Claude Code: `claude`、https://docs.anthropic.com/en/docs/claude-code/quickstart を参照
  - Codex CLI: `codex`、https://developers.openai.com/codex/cli を参照
- Lark の **PersonalAgent** アプリ。初回起動時の QR ウィザードで作成と紐づけができます。

## インストール

この fork は npm ではなく、[GitHub Releases](https://github.com/Leon-An07/lark-coding-agent-bridge/releases) に添付したパッケージで配布しています。`npm i -g lark-channel-bridge` では上流のパッケージがインストールされ、この fork の修正は含まれません。

```bash
npm i -g https://github.com/Leon-An07/lark-coding-agent-bridge/releases/latest/download/lark-channel-bridge.tgz
```

アップグレードするときは同じコマンドをもう一度実行します。バージョンを固定したい場合は、`latest/download` を `download/<tag>` に置き換えてください（例: `download/v0.7.1`）。

## 初回起動

```bash
lark-channel-bridge run
```

初回起動時は QR コードのウィザードが開きます。

1. ターミナルに QR コードが表示されます。
2. Lark アプリでスキャンします。
3. PersonalAgent アプリを選択するか、新しく作成します。
4. 確認が表示されたら、初期化するエージェントを選びます。
5. 設定が `~/.lark-channel/config.json` に書き込まれます。

最初にプロジェクトディレクトリを指定する必要はありません。bridge は profile が管理する既定の作業ディレクトリを作成します。起動後、Lark で `/cd <path>` を送ると実際のプロジェクトに切り替わります。

すでに PersonalAgent アプリがある場合は、初期化時に `--app-id` を渡すとアプリの作成を省略できます。コマンドが App Secret の入力を求めます。

```bash
lark-channel-bridge run --app-id cli_xxx
# or initialize and start the background service directly
lark-channel-bridge start --app-id cli_xxx
```

Lark のグローバル版アプリの場合は `--tenant lark` を追加してください。

## バックグラウンドサービス

初回設定とフォアグラウンドでのデバッグには `run` を使います。bot がメッセージを送受信できることを確認したら、`Ctrl-C` でフォアグラウンドのプロセスを止め、OS が管理するサービスとしてバックグラウンドで動かします。

```bash
lark-channel-bridge start
lark-channel-bridge status
lark-channel-bridge stop
```

サービス系のコマンドを使う前に、グローバルにインストールしてください。daemon の launchd plist / systemd unit / Windows タスクは bridge CLI のパスを記録します。そのパスが `npx` 経由の npm 一時キャッシュを指していると、キャッシュが消去されたときに daemon が動かなくなります。`run` は単発のフォアグラウンドプロセスなので、`npx` 経由でも問題ありません。

サービス系のコマンドは profile ごとにサービスを登録します。

```bash
lark-channel-bridge start [--profile <name>]
lark-channel-bridge stop [--profile <name>]
lark-channel-bridge restart [--profile <name>]
lark-channel-bridge status [--profile <name>]
lark-channel-bridge unregister [--profile <name>]
```

プラットフォームごとの対応:
- **macOS**: launchd のユーザーエージェント `ai.lark-channel-bridge.bot.<profile>`
- **Linux**: systemd のユーザーユニット `lark-channel-bridge.bot.<profile>.service`
- **Windows**: タスクスケジューラのタスク `LarkChannelBridge.Bot.<profile>`。`.cmd` ラッパー経由で起動します

daemon のログは `~/.lark-channel/profiles/<profile>/logs/daemon/` にあります。

### 複数の profile: Claude と Codex

既定では、bridge は現在選択されている profile で起動します。`profile use <name>` で切り替えます。profile ごとにアプリの認証情報、セッション、作業ディレクトリ、ログを個別に保持します。複数の profile を作るのは、複数の PersonalAgent アプリを接続する場合や、Claude と Codex を別々の bot として動かす場合だけにしてください。

```bash
lark-channel-bridge start --profile claude --agent claude
lark-channel-bridge start --profile codex --agent codex
```

たとえば Codex の bot だけを再起動するには、次のようにします。

```bash
lark-channel-bridge restart --profile codex
lark-channel-bridge status --profile codex
```

## コマンド

### ホスト CLI

```text
lark-channel-bridge run [--profile <name>] [--agent claude|codex] [--workspace <path>] [-c <config>]
lark-channel-bridge migrate [--profile <name>] [--agent claude|codex]
lark-channel-bridge ps
lark-channel-bridge kill <id|#>
lark-channel-bridge skills install [--agent claude|codex] [--dest <dir>] [--force]
lark-channel-bridge --help
```

`skills install` は、パッケージに同梱された skills（`skills/`）を PATH 上で見つかった各エージェントにコピーします。Claude Code には `~/.claude/skills`、Codex には `~/.codex/skills` にコピーします（`$CLAUDE_CONFIG_DIR` / `$CODEX_HOME` を尊重します）。同じ名前の skill がすでにある場合は、`--force` を付けない限りそのまま残します。

`profile use <name>` は、以降の既定の起動で使う profile を変更します。Claude / Codex の bot を別々に動かす場合、複数の PersonalAgent アプリを接続する場合、スクリプトでデプロイする場合は、次の profile 管理コマンドを使います。

```bash
lark-channel-bridge profile create claude --agent claude
lark-channel-bridge profile create codex --agent codex
lark-channel-bridge profile list
lark-channel-bridge profile use <name>
lark-channel-bridge profile remove <name>
lark-channel-bridge profile remove <name> --purge --yes
lark-channel-bridge profile export <name> [--output ./profile.json] [--force]
lark-channel-bridge profile export <name> --include-secrets --yes
```

`profile remove` は既定でローカルの状態をアーカイブします。アクティブな profile も削除できます。他の profile が残っていれば、bridge は次の profile に切り替えます。最後の profile だった場合は root config が初期化され、同じ名前で再作成できます。`--purge --yes` を付けるとローカルの状態を完全に削除します。`profile export` は既定で app secret をマスクします。`--include-secrets --yes` を付けると機密の設定も含めます。

profile を誤ったエージェント種別で作成してしまった場合は、まず対応するバックグラウンドサービスを stop または unregister し、次に `profile remove <name>` を実行し、正しい `--agent` で作り直してください。

### Lark 内のスラッシュコマンド

| コマンド | 効果 |
|---|---|
| `/new`, `/reset` | 現在のセッションをクリアする |
| `/cd <path>` | 作業ディレクトリを切り替えてセッションをリセットする |
| `/ws list` | 名前付きワークスペースを一覧表示する |
| `/ws save <name>` | 現在の作業ディレクトリを名前付きワークスペースとして保存する |
| `/ws use <name>` | 名前付きワークスペースに切り替える |
| `/ws remove <name>` | 名前付きワークスペースを削除する |
| `/resume` | 同じエージェント、作業ディレクトリ、権限モードと互換性のある履歴を再開する |
| `/status` | profile、エージェント、作業ディレクトリ、セッション、lark-cli の identity、実行状態を表示する |
| `/config` | 表示の設定、アクセス設定、lark-cli の identity ポリシーを変更する |
| `/mention group on` | 現在のグループで `@bot` を必須にする |
| `/mention group off` | 現在のグループを専用のメンション不要モードにする（通常のメッセージで起動する。複数 bot がいるグループでは非推奨） |
| `/mention group default` | 現在のグループを `/config` のグローバルなメンション設定に従わせる |
| `/invite user @name` | ユーザーに DM での bot 利用を許可する |
| `/invite admin @name` | アクセス制御の admin を追加する |
| `/invite group` | 現在のグループに bot の利用を許可する |
| `/invite all group` | bot が参加しているすべてのグループに利用を許可する |
| `/remove user @name`, `/remove admin @name`, `/remove group` | アクセス制御のエントリを削除する |
| `/stop` | 現在の実行を停止する。カードの停止ボタンでも可 |
| `/timeout [N\|off\|default]` | 現在のセッションの idle watchdog を設定または解除する |
| `/ps` | ローカルの bridge プロセスを一覧表示する |
| `/exit <id\|#>` | bridge プロセスを停止する |
| `/reconnect` | WebSocket を強制的に再接続する |
| `/doctor [description]` | 低機密の診断を実行する |
| `/help` | ヘルプカード |

DM では @ メンションは不要です。グループとトピックグループでは、既定で `@bot` が必要です。owner / admin は対象のグループで `/mention group off` を実行すると、そのグループを専用のメンション不要モードにできます。`/mention group on` でメンション必須に戻し、`/mention group default` で `/config` のグローバル設定に再び従わせます。メンション不要モードは、この bot の専用とみなせるグループ向けです。複数の bot がいるグループではメンション必須のままにしてください。そうしないと、通常のメッセージで複数の bot が同時に起動することがあります。`@all` は無視されます。対応しているドキュメント種別のクラウドドキュメントのコメントでは、bot をメンションすると実行されます。

## 返信の表示と COT

`/config` では次の 3 つの表示設定を変更できます。

- **メッセージ返信モード**: `message card` は最終回答をストリーミングで更新します。`plain text` は実行完了後に 1 回だけ送信します。
- **ツール呼び出しの表示**: 最終のカード / markdown の返信にツールブロックを表示するかどうかを制御します。
- **COT 経過メッセージ**: `off` は最終回答だけを送ります。`brief` はエージェントの進行状況のテキストとツールの概要を含む COT メッセージを先に送ります。`detailed` はさらにツールの引数と切り詰めた出力も含めます。

COT を有効にすると、bridge は経過の表示と最終回答を 2 つのメッセージに分けます。COT メッセージはエージェントが何をしたかを追跡するためのものです。最終回答は引き続きエージェントの生のテキストから生成され、bridge 側で発見的なフィルタリングは行いません。エージェントが最終回答のテキストを通常のストリームテキストとして出力した場合、そのテキストは COT 経過メッセージにも表示されることがあります。

## lark-cli の identity ポリシー

各 profile は profile 専用の lark-cli ディレクトリ `~/.lark-channel/profiles/<profile>/lark-cli` を使います。エージェントのプロセスはこのディレクトリを指す `LARKSUITE_CLI_CONFIG_DIR` を受け取るため、ある profile での個人の認可は別の profile とは共有されません。

既定のポリシーは `bot-only` です。lark-cli はアプリ / bot の identity を使い、個人のリソースにはアクセスしません。ユーザーがカレンダー、メール、ドライブなどの個人リソースを認可すると、現在の profile は `user-default` に切り替えられます。このモードではアプリの identity を使えるまま、認可済みのユーザー identity も許可します。owner / admin ユーザーは `/config` でこのポリシーを確認または変更できます。`/status` は現在の概要を `lark-cli: app` または `lark-cli: user-ready` として表示します。

## 作業ディレクトリ

各 profile は `workspaces.default` で既定の作業ディレクトリを定義できます。新しい profile は `--workspace <path>` を付けて作成できます。省略した場合、bridge は profile が管理する既定の作業ディレクトリを作成します。

これは profile のフィールドの抜粋です。`config.json` 全体をこれで置き換えないでください。該当する profile の `workspaces` フィールドを編集してください。

```json
{
  "workspaces": {
    "default": "/Users/me/.lark-channel-workspaces/claude/default"
  }
}
```

bridge は、選択されたディレクトリが存在すること、ディレクトリであること、`/`、ホームのルート、システムディレクトリ、一時ディレクトリのルートのような範囲の広すぎる場所でないことを確認します。作業ディレクトリは、エージェント実行時のカレントディレクトリにすぎません。ファイルシステムのサンドボックスではありません。実際のファイルアクセスは、ローカルのエージェントプロセスとその権限モードに依存します。

## 権限モード

ユーザー向けに推奨する profile の設定は `permissions.defaultAccess` と `permissions.maxAccess` です。新しい profile では両方とも既定で `full` になり、bridge はローカルツール、認可フロー、ファイル書き込みなどのエージェント機能を制限なく使えます。profile を厳しくするには、どちらか一方または両方を `workspace` か `read-only` に設定します。厳しいモードでは、ローカルツールの実行、ログイン / 認可フロー、ファイル書き込みなどの機能が制限されることがあります。

これは profile のフィールドの抜粋です。`config.json` 全体をこれで置き換えないでください。該当する profile の `permissions` フィールドを編集してください。

```json
{
  "permissions": {
    "defaultAccess": "full",
    "maxAccess": "full"
  }
}
```

モードの対応:

| Bridge access | Claude permission mode | Codex mode |
|---|---|---|
| `full` | `bypassPermissions` | `danger-full-access` |
| `workspace` | `acceptEdits` | `workspace-write` |
| `read-only` | `plan` | `read-only` |

旧形式の `sandbox` フィールドは、古い設定のために引き続き読み取れます。bridge は profile を保存するときに、その設定を正規の `permissions` に移行します。

## データディレクトリ

| パス | 内容 |
|---|---|
| `~/.lark-channel/config.json` | profile 一覧とアクティブな profile を含む root config |
| `~/.lark-channel/active-profile` | 最後に選択した profile |
| `~/.lark-channel/profiles/<profile>/sessions.json` | セッションの状態 |
| `~/.lark-channel/profiles/<profile>/sessions.json.catalog.json` | エージェントを区別するセッションカタログ |
| `~/.lark-channel/profiles/<profile>/workspaces.json` | 現在のワークスペースと名前付きワークスペースの紐づけ |
| `~/.lark-channel/profiles/<profile>/secrets.enc` | profile 専用の暗号化された secret |
| `~/.lark-channel/profiles/<profile>/lark-cli/` | profile 専用の lark-cli ディレクトリ |
| `~/.lark-channel/profiles/<profile>/media/` | 添付ファイルのキャッシュ |
| `~/.lark-channel/profiles/<profile>/logs/` | 構造化された実行ログ |
| `~/.lark-channel/registry/processes.json` | ローカルのプロセスレジストリ |
| `~/.lark-channel/registry/locks/` | profile と app のロック |

`LARK_CHANNEL_HOME=/path/to/state` を設定すると、bridge のローカルの状態をすべて移動できます。`LARK_CHANNEL_LOG_DAYS` はログの保持期間を上書きします。

## アクセス制御

**チャットのアクセスは既定で非公開です。初期状態では、DM でもグループでも bot を使えるのは *あなた* だけです。**「あなた」とは、Feishu / Lark アプリを作成した人、つまり所有者（QR コードをスキャンしてセットアップした人）です。bot はアプリの所有者を Lark から自動で判定するため、**1 人でチャットから使う場合は設定が一切不要です**。DM を送ることも、どのグループでも `@` メンションすることもできます。他の人のチャットメッセージは黙って無視されます（「権限がありません」という返信はしません。返信すると bot の存在が分かってしまうためです）。クラウドドキュメントのコメントはドキュメント単位で判定します。後述を参照してください。

他の人やグループに利用を許可するには、次の 3 つのリストのいずれかに追加します。

| リスト | 制御する対象 | 追加 | 削除 |
|------|----------|-----|--------|
| **許可ユーザー** | bot に DM を送れる人 | `/invite user @them` | `/remove user @them` |
| **許可チャット** | bot が応答するグループ（そのグループの **全員** に応答する） | `/invite group`（現在のグループ）/ `/invite all group`（bot が参加している全グループ） | `/remove group`（現在のグループ） |
| **Admin** | 設定を変更でき、どのグループでも bot を使える人 | `/invite admin @them` | `/remove admin @them` |

> `/invite` と `/remove` を実行できるのは **あなた（作成者）と admin** だけです。コマンド内の `@` は *対象の人* を指します（bot ではありません）。bot がメンションをその人の identity に解決するため、生の ID を扱う必要はありません。

### すべてのリストを通過する 2 つの identity

- **あなた（作成者）**: どのリストの制限も受けません。DM、どのグループ、すべてのコマンドが使えます。**自分自身を締め出すことはできません**。リストの設定が壊れても、bot に DM で `/config` を送れば戻れます。Feishu / Lark の管理コンソールでアプリの所有権を移すと、bot は自動で新しい所有者に従います。
- **Admin**: DM を送れ、`/config` などの管理コマンドを実行でき、**許可チャットのリストを通過します**。リストに載っていてもいなくても、bot はどのグループでも admin に応答します。bot を一緒に保守するチームメイトに向いています。

### よくある設定

- **自分だけで使う** → 何もしなくてよい。これが既定です。
- **チームメイトに bot への DM を許可する** → `/invite user @them`
- **業務グループの全員に開放する** → そのグループ内で `/invite group` を送る
- **初回セットアップで、bot がすでに参加している全グループをまとめて登録する** → `/invite all group` で一度にリストへ取り込み、あとから `/remove group` で不要なものを外す
- **共同の admin を追加する** → `/invite admin @them`

### 知っておくとよいこと

- 変更は **次のメッセージ** から有効になります。再起動は不要です。
- **グループでは先に bot を `@` する必要があります**（DM では不要です）。これは上記のリストとは独立した別のトグルです（`/config` → 「グループで @bot を必須にする」）。
- 知らない人には完全に沈黙します。返信は一切ありません。唯一の例外として、まだ開放されていないグループで誰かが bot を `@` メンションすると、bot は「admin が `/invite group` を実行すると有効にできます」という短い案内を返します。
- クラウドドキュメントのコメントはドキュメント単位で判定します。対応しているドキュメントでコメントでき、bot をメンションできる人は誰でも返信を起動できます。

### 上級: 設定ファイルを直接編集する

Lark 内で操作したくない場合は、`/invite` と `/config` が書き込む `~/.lark-channel/config.json` の該当 profile の `access` フィールドを直接編集します。空のリストは「そのリストに誰もいない」という意味で、全員に開放という意味ではありません。これは profile のフィールドの抜粋です。`config.json` 全体をこれで置き換えないでください。

```json
{
  "schemaVersion": 2,
  "profiles": {
    "claude": {
      "agentKind": "claude",
      "access": {
        "allowedUsers": ["ou_xxxxxxxxxxxxx"],
        "allowedChats": ["oc_xxxxxxxxxxxxx"],
        "admins": ["ou_xxxxxxxxxxxxx"],
        "requireMentionInGroup": true,
        "requireMentionInGroupOverrides": {
          "oc_group_without_at": false,
          "oc_group_with_at": true
        }
      }
    }
  }
}
```

`allowedUsers` / `admins` にはユーザーの `open_id` を入れます。`allowedChats` と `requireMentionInGroupOverrides` のキーにはグループの `chat_id` を入れます。override の値が `false` ならそのグループは専用のメンション不要モード、`true` なら `@bot` が必須です。ID を手動で調べる最も簡単な方法は、その人に bot へメッセージを送ってもらい（グループなら `@` してもらい）、アクティブな profile のログを確認することです。

```bash
grep '"event":"enter"' ~/.lark-channel/profiles/<profile>/logs/bridge-$(date +%Y%m%d).jsonl | tail -5
```

各行には `chatId`（グループ / DM の ID）と `senderId`（ユーザーの `open_id`）が含まれます。手動で編集した後は、**bridge を再起動する** か、許可された admin のコンテキストから `/reconnect` を送って反映してください。日常的な変更には `/invite` / `/config` のほうが簡単です。直接編集は、主にアクセス設定をあらかじめ投入するデプロイスクリプト向けです。

## クラウドドキュメントのコメント

クラウドドキュメントのコメントには、個別のワークスペースの紐づけやドキュメントの許可リストは不要です。対応しているドキュメントのコメントで bot をメンションすると、bridge は同じスレッド内で返信します。コメントからの実行はドキュメントのセッションキーを再利用し、ドキュメントの cwd が記録されていない場合はユーザーのホームディレクトリにフォールバックします。

## FAQ

**bot が沈黙したまま、またはローカル CLI が返信しない。** 多くの場合、ローカルの `claude` または `codex` CLI がログインしていないか、現在のセッションが存在しなくなった作業ディレクトリを指しています。`/status` を送って確認してください。`/new` で新しいセッションを開始すると直ることが多いです。

**エージェントのサブプロセスが固まったように見える（カードが最後のフレームで止まる）。** bridge は idle watchdog に対応しています。エージェントが N 分間なにも出力しないと、プロセスは強制終了され、カードに自動終了の理由が記録されます。既定では無効です。`/config` でグローバルに有効化するか、`/timeout 10` で現在のセッションだけ有効にします。`/timeout off` はそのセッションで無効にします。`/timeout default` はセッションの上書きを解除します。

**送った画像がエージェントに見えないと言われる。** 最新版に更新してください。0.1.0 より前のリリースにはファイル名の重複排除のバグがありました。

## Windows のトラブルシューティング

上流に寄せられた Windows の報告（#128 と #131 を参照）の多くは、少数の原因に行き着きます。この fork ではそのうちいくつかを修正しています。全リストは [docs/maintenance/windows-issue-triage.md](./docs/maintenance/windows-issue-triage.md) にあります。

**インストールと実行。**

- Node 20.12 以降を使ってください。それより古いバージョンは起動時に `styleText` エラーで失敗します。
- `start` を使う前に、[インストール](#インストール)の手順でグローバルにインストールしてください。`npx` 経由で起動したサービスは、npm がキャッシュを消去すると動かなくなります。
- サービスがどうしても動かない場合は、ターミナルで `lark-channel-bridge run` を実行してください。そのターミナルを閉じると bot は停止します。

**日本語または中国語の Windows。**

- `/config` で言語が設定されていない場合、CLI は Windows の表示言語に従います。以前のバージョンでは、`LANG` 変数がないすべてのユーザーに中国語を表示していました。
- 非 ASCII の名前を持つユーザーフォルダー（たとえば `C:\Users\田中`）でも動作します。生成される `.cmd` ファイルは、このパスを `%USERPROFILE%` で参照するようになりました。以前は `cmd.exe` が UTF-8 のパスをシステムのコードページ（CP932 または GBK）で読み取り、見つけられませんでした。
- `schtasks`、`npm`、`lark-cli` のエラー出力はシステムのコードページでデコードされるため、文字化けせずに読めます。
- `start`、`stop`、`status` は英語の `schtasks` 出力に依存しなくなりました。

**バックグラウンドサービス（`start`）。**

- `start` は自分のアカウントだけを対象にタスクスケジューラのタスクを登録するため、管理者のシェルは不要になるはずです（標準アカウントでは未検証です。失敗した場合は、管理者が必要な従来の登録方法を試します）。`start` は毎回タスクを登録し直すため、既存のインストールにも反映されます。タスクには 72 時間の制限がなく、バッテリー駆動時も実行されます。
- `stop` は bridge のプロセスツリー全体を終了するようになりました。以前は `schtasks /End` が `node.exe` を残し、次の `start` が「既に別の bridge プロセスが使用中です」と表示していました。
- サービスのタスクは引き続きコンソールウィンドウを開きます。そのウィンドウを閉じると bot は停止します。
- 再起動しても「既に別の bridge プロセスが使用中です」と表示される場合は、`lark-channel-bridge ps` と `lark-channel-bridge kill <id>` を実行してください。タスクマネージャーからプロセスを終了しないでください。

**`lark-cli configuration failed ... is world-writable (mode 0666)`。** bot は接続して返信しますが、エージェントからのカード送信と Feishu / Lark API の呼び出しが失敗します。lark-cli は secret のラッパーファイルを Unix の権限ビットで検査しますが、Windows は書き込み可能なファイルをすべて 0666 として報告します。この問題はまだ修正されていません。回避策:

- `lark-channel-bridge run --skip-check-lark-cli` で起動する。
- または、bridge を WSL2 で実行する。

**すべてのメッセージに「(no content)」が返る。** 現在のバージョンに更新してください。古いバージョンは prompt を `cmd.exe` 経由で渡していたため、一部が欠落していました。

## テストと CI

ローカルでのチェック:

```bash
pnpm test
pnpm typecheck
pnpm build
```

`pnpm test` には unit、integration、process-level adapter のテストが含まれます。CI は macOS、Ubuntu、Windows 上で `pnpm install --frozen-lockfile`、`pnpm test`、`pnpm typecheck`、`pnpm build` を実行します。

リリースの公開:

```bash
pnpm install --frozen-lockfile
pnpm build
npm pack   # lark-channel-bridge-<version>.tgz を生成
```

`v<version>` タグの GitHub Release を作成し、tarball を `lark-channel-bridge.tgz` にリネームして添付します。こうすると[インストール](#インストール)の `latest/download` のリンクが常に最新版を指します。パッチ済みの `@larksuite/channel` は `dist/` にバンドルされているため、npm でインストールしても pnpm のチェックアウトと同じ修正が入ります。

## 任意のテレメトリー

既定では、bridge は **何も** 報告しません。メトリクスもログもマシンの外に出ず、テレメトリーの依存関係も一切取り込みません。以下のフックは、明示的に有効にしない限り何もしません。

独自の監視を接続するには、`AdapterFactory` を default export する（または `createAdapter` として export する）モジュールを環境変数で指定します。

```bash
LARK_CHANNEL_TELEMETRY_MODULE=your-telemetry-package lark-channel-bridge start
```

そのモジュールはすべての `log.*` イベントと、エラー / メトリクスのフックを受け取り、任意の場所に転送できます。インターフェースはパッケージのルートから export されています。

```ts
import type { AdapterFactory, TelemetryAdapter, TelemetryEvent } from 'lark-channel-bridge';

const createAdapter: AdapterFactory = (meta) => ({
  emit(event) {/* イベントを送信する */},
  recordError(err, ctx) {/* 例外を送信する */},
  recordMetric(name, value, tags) {/* メトリクスを送信する */},
  flush(timeoutMs) {/* バッファ済みのイベントを送り切る */},
});
export default createAdapter;
```

モジュールがない、factory が不正、adapter が例外を投げる、のいずれの場合も noop に縮退します。テレメトリーが bridge の起動を妨げたり、ログを壊したりすることはありません。

## ライセンス

[MIT](./LICENSE)

<img src="./assets/feedback-group-qr.png" alt="フィードバックグループの QR コード" width="360">
