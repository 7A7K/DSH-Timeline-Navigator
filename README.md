# DeepSeek Harness Timeline Navigator

An accessible conversation timeline for the DeepSeek Harness Web UI. It keeps long conversations navigable without changing the host application.

## What it does

- Opens from a visible right-edge handle; also works with keyboard focus and touch.
- Groups messages by turn and highlights the message currently visible in the chat.
- Searches titles and previews, with a one-click clear action.
- Jumps to a message even when older history has not been loaded yet.
- Starts with every turn group collapsed so the overall conversation structure is visible first.
- Provides one-click Expand all / Collapse all controls for turn groups.
- Saves bookmarks per conversation with a dedicated star button on every message; long-press remains available as a touch fallback.
- Keeps the main actions visible and direct: click a message to jump, click its star to bookmark, and press `Escape` to close.
- Remembers enabled state, width, filter mode, scroll mode, and first-use hint state.
- Provides a mobile bottom sheet and respects `prefers-reduced-motion`.
- Uses the host's `ChatSnapshot` and `data-chat-anchor-key` contract rather than scraping raw session events.

## Project layout

```text
src/
  index.js                 # host-side entry point
  client/
    index.js               # React surface and DSH slot registration
    model.js               # pure snapshot projection and filtering
    storage.js             # preferences and bookmarks
    dom.js                 # scrollport, anchor, and history integration
    locale.js              # settings and panel copy
    styles.js              # isolated theme-token CSS
lib/                       # generated DSH-loadable artifacts
tests/                     # node:test coverage for pure behavior
scripts/build.mjs          # esbuild -> __ModuleLoader__.load bundle
install.ps1
uninstall.ps1
```

`lib/` is generated. Make changes under `src/`, then run `npm run bundle`.

## Local development

Requirements: Node.js 18 or newer.

```powershell
npm install
npm run check
npm run bundle
```

The bundle is emitted in the same `window.__ModuleLoader__.load` format used by first-party DSH plugins. Runtime dependencies such as React and DSH client packages remain external.

## Installation into Harness

From a local checkout:

```powershell
.\install.ps1 -Source (Get-Location).Path
```

For a GitHub checkout, pass the repository URL to the installer. The installer creates the profile junction and adds an idempotent row to `cordis.patch.yml`.

After installation, reload `http://127.0.0.1:3080/`. If the web process is already running with an old bundle, restart it once.

## Interaction guide

| Action | Result |
| --- | --- |
| Hover/focus the right edge | Open the timeline |
| Click a message | Center that message in chat |
| Click the star on a message | Add/remove that bookmark |
| Click a turn header | Collapse/expand that turn |
| Expand all / Collapse all | Change every turn group at once |
| ↑ button | Jump to the earliest message |
| ↓ button | Jump to the latest message |
| Long-press a message on touch | Add/remove a bookmark (fallback) |
| `Escape` | Close the timeline |
| Drag the left rail edge | Resize the panel |

## Compatibility

The plugin targets the DSH Web client plugin contracts used by the `rc.6` client runtime line and newer. It only owns its overlay and settings slots, so disabling or uninstalling it does not modify host source files.
