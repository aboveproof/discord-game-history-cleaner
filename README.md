# Discord Game History Cleaner

A console script for clearing every entry Discord exposes under Recent activity.

## What this is

Discord only provides a per-entry Clear Game History action. This script operates that same interface repeatedly, confirms each removal, and scrolls through the list until no entries remain.

It does not extract your token, call undocumented API endpoints, or hide entries only on your device. Each removal uses Discord's normal account-side confirmation flow.

## Repository structure

```text
discord-game-history-cleaner/
├── clear-game-history.js    # Pasteable console script
├── README.md
└── LICENSE
```

## Quick start

1. Open Discord in English through the desktop or web client.
2. Open your full profile and select **Activity** so **Recent activity** is visible.
3. Open Developer Tools and select the **Console** tab.
4. Review and copy all of [`clear-game-history.js`](./clear-game-history.js).
5. Paste it into the console, press Enter, and accept the confirmation.
6. Leave the Activity page open until the console reports that it finished.

Equicord and Vencord desktop users can usually open Developer Tools with `Ctrl+Shift+I` on Windows or Linux. Browser users can use their browser's standard Developer Tools shortcut.

## What it does

- Restricts clicks to controls positioned after the **Recent activity** heading.
- Ignores the active RPC and current-status area above that heading.
- Requires the exact **Clear Game History** menu item and confirmation dialog.
- Waits for each removal to finish before continuing.
- Adds a short randomized pause between removals.
- Stops if Discord does not show or close the expected confirmation.

## Stop a running cleanup

Run this in the console:

```js
window.__stopClearGameHistory = true
```

## Limits and safety

Discord currently describes Recent Activity as activity from the last 30 days. The script can only remove entries Discord exposes in that view.

The script depends on Discord's current English interface and may need an update if Discord changes its labels or page structure. Inspect the source before pasting it. Console scripts run with access to your open Discord session.

The pacing is deliberately conservative, but no unofficial automation can guarantee that Discord will never rate-limit an action or take account-related measures. Use it at your own risk and do not modify it to bypass rate limits.

See Discord's [Activity Sharing FAQ](https://support.discord.com/hc/en-us/articles/7931156448919-Activity-Sharing-on-Discord-FAQ) for the manual Clear Game History flow.

## License

MIT. Use freely, modify carefully.
