<div align="center">

# Discord Game History Cleaner

Clear the game entries in your Discord Recent Activity without clicking through every confirmation by hand.

[![License](https://img.shields.io/github/license/aboveproof/discord-game-history-cleaner?style=flat-square)](./LICENSE)
[![Last commit](https://img.shields.io/github/last-commit/aboveproof/discord-game-history-cleaner?style=flat-square)](https://github.com/aboveproof/discord-game-history-cleaner/commits/main)
![Runtime](https://img.shields.io/badge/runtime-Discord%20%7C%20Equicord%20%7C%20Vencord%20%7C%20Equibop-5865F2?style=flat-square)

**One file. No dependencies. No token handling.**

</div>

## What this is

Discord exposes a **Clear Game History** action for each entry in your profile's Activity tab. It does not provide a clear-all button. This script repeats Discord's existing UI flow: open an entry's menu, choose **Clear Game History**, confirm **Clear**, wait for Discord to finish, then move to the next entry.

The removal is account-side because the script clicks Discord's real confirmation button. It does not merely hide cards with CSS or remove elements from the page.

> [!IMPORTANT]
> Read [`clear-game-history.js`](./clear-game-history.js) before running it. Anything pasted into Discord's console executes inside your signed-in client. Do not use a copy from a random paste site or shortened link.

## Requirements

- Discord web, Discord desktop, Equicord, Vencord, or Equibop
- Discord displayed in English
- Developer Tools access
- Your Discord account already signed in

The script uses Discord's visible interface rather than mod-specific modules. Vanilla Discord desktop is supported when its Developer Tools console is available. If the desktop console is disabled in your installation, use [Discord in a browser](https://discord.com/app).

## Quick start

1. Open [`clear-game-history.js`](./clear-game-history.js) on GitHub.
2. Read the file, then copy its complete contents.
3. Open Developer Tools with `Ctrl+Shift+I` in a desktop client or `Ctrl+Shift+J` in most browsers.
4. Select the **Console** tab.
5. Paste the script and press Enter.
6. Read the permanent-removal prompt and select **OK** if you want to continue.
7. Leave Discord open until the console prints `Finished`.

You do not need to open your profile first. If your own Activity tab is already open, the script keeps it open. Otherwise, it opens your full profile and selects Activity. If that view is closed while cleanup is running, it reopens the view and continues.

## What happens after you run it

1. A native confirmation prompt asks whether to begin.
2. It reuses an open **Your full profile** Activity view when one is already present.
3. Otherwise, it clicks **Manage profile and status**, opens **Your full profile**, and selects **Activity**.
4. The script waits for the exact **Recent activity** heading.
5. It considers only menu controls that appear after and below that heading.
6. It opens one menu and requires an exact **Clear Game History** item.
7. It requires a dialog containing both **Clear Game History** and a **Clear** button.
8. It clicks **Clear** and waits for the dialog to close.
9. It pauses for 1.2 to 1.8 seconds before processing another entry.
10. It scrolls the Activity view and repeats until no more entries are available.

If the profile is closed, the Activity tab disappears, or a confirmation is interrupted, the script rebuilds its page references and resumes. If a removal appears stuck, it waits five seconds before retrying instead of clicking faster.

## What the script can access

Like every console script, it runs in the page you paste it into. This script uses that access for a small set of operations:

- Read visible Discord interface elements.
- Click the existing game-history menu and confirmation controls.
- Open the current user's profile through Discord's visible account-panel controls.
- Close and reopen the full-profile dialog when recovery is needed.
- Write progress and warnings to the console.
- Set one stop flag on `window`.

## What the script does not do

- It does not read, print, copy, or upload your Discord token.
- It does not use `fetch`, `XMLHttpRequest`, `WebSocket`, or an external server.
- It does not ask for a password, API key, webhook, or bot token.
- It does not send messages, join servers, change settings, or modify Rich Presence.
- It does not call Discord's private deletion endpoint directly.
- It does not depend on Equicord, Vencord, or Equibop internals.
- It does not bypass rate limits or remove Discord's confirmation step.
- It does not install a plugin or remain active after the page reloads.

You can verify the network claim yourself: search [`clear-game-history.js`](./clear-game-history.js) for `fetch`, `XMLHttpRequest`, `WebSocket`, `Authorization`, and `token`. None are used.

## Scope protection

The active RPC or current-status card sits outside the Recent Activity list. The script requires each candidate control to be both later in the document and visually below the exact **Recent activity** heading. A menu is ignored unless it contains the exact text **Clear Game History**.

The final confirmation has another independent check. The script only accepts a visible dialog that contains **Clear Game History** and an exact **Clear** button. Missing or unexpected UI triggers recovery instead of a blind click.

These checks reduce the chance of clicking the wrong control, but Discord can change its interface at any time. Stop the run if the client behaves unexpectedly.

## Stop a running cleanup

Paste this into the console:

```js
window.__stopClearGameHistory = true
```

The running script checks this flag while waiting for interface changes and between entries. Reloading Discord also ends the script.

## Expected console output

```text
Opening your profile Activity tab…
Clearing Recent activity only. Run window.__stopClearGameHistory = true to stop.
Cleared 1 history entry.
Cleared 2 history entries.
Finished. Cleared 2 history entries.
```

Recovery messages are not necessarily failures. For example, closing the profile produces a reopen message and the cleanup continues.

## Troubleshooting

### Activity keeps reopening

Keep Discord in English and avoid switching profile tabs during the run. If Discord changed the Activity label or profile structure, stop the script and open an issue with the console message and your Discord client version. Do not include your email address, token, or unrelated console logs.

### Confirmation was interrupted

The menu or modal disappeared before the expected control was found. The script closes the incomplete UI, reopens Activity, and retries after rebuilding its references.

### Removal did not finish

Discord did not close the confirmation within seven seconds. The script waits five seconds before recovery. This prevents a slow client or temporary rate limit from turning into rapid repeated clicks.

### Discord prints unrelated 404, CORS, or stream errors

Discord and installed plugins produce their own console messages. A stream-preview `404` or third-party plugin CORS error is not generated by this script. Progress messages from this project begin with `Opening`, `Clearing`, `Cleared`, `Confirmation`, `Removal`, `Stopped`, or `Finished`.

## Limits

- Discord describes Recent Activity as activity from the last 30 days. The script can only remove entries Discord displays there.
- The selectors currently target Discord's English labels.
- Vanilla Discord desktop must have Developer Tools available; Discord web works without client modifications.
- Discord interface updates can break the workflow without notice.
- The randomized delay is conservative, but no unofficial automation can promise zero account risk.
- The script cannot restore an entry after Discord removes it.

This project does not claim affiliation with Discord, Equicord, Vencord, or Equibop. Use it at your own risk. Do not modify it to bypass rate limits.

Discord documents the manual removal flow in its [Activity Sharing FAQ](https://support.discord.com/hc/en-us/articles/7931156448919-Activity-Sharing-on-Discord-FAQ).

## Project layout

```text
discord-game-history-cleaner/
├── clear-game-history.js    # Complete pasteable script
├── README.md                # Usage, behavior, and audit notes
└── LICENSE                  # MIT license
```

## Reporting a problem

Open a [GitHub issue](https://github.com/aboveproof/discord-game-history-cleaner/issues) with:

- The progress or warning message printed by this script.
- Whether the profile or confirmation was visible.
- Your Discord client version and, if applicable, your Equicord, Vencord, or Equibop version.

Remove account identifiers and unrelated logs before posting. Never publish your token, email address, or full console dump.

## License

[MIT](./LICENSE). Review the code, change it if needed, and keep the license with redistributed copies.
