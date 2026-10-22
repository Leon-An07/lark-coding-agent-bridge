---
name: lark-channel-bridge-basics
description: Use when you run inside lark-channel-bridge (the LARK_CHANNEL env var is set, or the prompt has a bridge_context block) and need to reply with a card, send a file, or check the bridge's own state from the shell.
---

# lark-channel-bridge basics

This is an example skill bundled with lark-channel-bridge. It works with any
agent the bridge runs (Claude Code, Codex). Copy this folder as a template
for your own skills.

## How to tell you are in the bridge

- `LARK_CHANNEL=1` is set in your environment.
- `LARK_CHANNEL_PROFILE` names the bridge profile you run under.
- The user message starts with a `<bridge_context>` block. It holds the chat
  ID (`chatId`) and, in topic chats, the thread ID (`threadId`).

## Send an interactive card that calls you back

1. Write the card JSON (Lark Card JSON 2.0) to a file.
2. Run:

   ```sh
   lark-channel-bridge send-card --chat-id <chatId> --file card.json
   ```

3. In a topic chat, also pass `--thread-id <threadId>` from
   `bridge_context`. Without it, every click is rejected.
4. Add `--dry-run` to print the signed card without sending it.

## Check the bridge

- `lark-channel-bridge ps` lists running bridge processes.
- `lark-channel-bridge status` shows the background service state and log paths.

Do not run `stop`, `restart`, or `kill` on the bridge that runs you. That
ends your own session.
