# Changelog

All notable changes to `@deepseek-ai/dsh-client-ui-timeline-navigator`.

## [0.3.4] - 2026-08-16

### Added
- Added a persistent `中 / EN` language toggle in the timeline panel.
- Added the same language switcher to the Settings → Plugins card so both surfaces stay in sync.
- Localized timeline controls, status messages, tool labels, previews, and accessibility labels.

### Fixed
- Removed the visible panel title so the top controls have enough room.
- Set a shared minimum panel width and fixed top-button sizes so Chinese and English labels remain fully usable.

## [0.3.3] - 2026-08-16

### Added
- Added the `dsh.bundle.patch` manifest and `cordis.patch.yml` so Harness can install the plugin with `dsh plugin --profile web add github:7A7K/DSH-Timeline-Navigator`.
- Documented Harness-native installation first, with the PowerShell installer retained as a fallback.

## [0.3.2] - 2026-08-16

### Improved
- Made GitHub installation work with branches, version tags, and the latest release.
- Made the release workflow safe to rerun and attach the generated `.tgz` package to an existing release.
- Added repository metadata and a Chinese-first bilingual project guide.

## [0.3.1] - 2026-08-16

### Fixed
- Connected the Settings → Plugins enable switch to the live timeline overlay store, so disabling the plugin immediately removes the right-side trigger and panel.
- Added a regression test for live enabled-state subscribers.

## [0.3.0] - 2026-08-16

### Added
- Expand all / Collapse all controls for turn groups.
- Visible hover/focus tooltips for icon-only header actions.
- A repeatable Playwright-based Harness UI smoke test.
- GitHub tag-based release workflow and release instructions.

## [0.2.2] - 2026-08-16

### Changed
- Start each conversation with all turn groups collapsed for a clearer overview.
- Removed the ineffective close button from the panel header.
- Replaced that header position with “Jump to latest”; the former latest position now jumps to the earliest message.

## [0.2.1] - 2026-08-16

### Changed
- Made the star at the right side of each message the primary bookmark control.
- Kept long-press bookmarking only as a touch-device fallback.
- Removed the hard-to-discover `j` / `k` / `gg` / `G` / `?` shortcuts; `Escape` remains available to close the panel.
- Added a clear empty-bookmarks hint explaining how to save the first item.

## [0.2.0] - 2026-08-16

### Added
- Standard source layout under `src/client/` with a reproducible esbuild bundle.
- Persistent width, scroll mode, filter mode, and first-use hint preferences.
- Clear-search action and a keyboard-help popover.
- More discoverable trigger handle and a first-use usage hint.
- Keyboard support for turn group expand/collapse and focus-visible styling.
- `inert` handling for the closed panel so hidden controls are not tabbable.
- Shared pure-model and storage tests, plus `npm run check`.
- Bilingual README, MIT license, package metadata, and generated-artifact workflow.

### Fixed
- Removed the malformed hand-edited bundle path that previously caused plugin registration syntax failures.
- Fixed long-press handling so touch bookmarking does not also navigate.
- Avoided selector collisions when active anchor keys contain CSS-special characters.

## [0.1.0-rc.7] - 2026-08-15

### Added
- Pin toggle: keep the rail open after the pointer leaves (📌 in the header).
- Jump-to-latest button (↓) that scrolls the chat to the newest message.
- Search box: filter the rail by message title/preview text.
- Auto-follow: the rail scrolls the active (currently visible) message into view.
- Long-press bookmark toast feedback (bookmarked / removed).
- Streaming indicator (pulsing dot) while the assistant is writing.
- `Escape` closes the rail; the trigger is now tappable (mobile).
- Mobile bottom sheet layout below 720px.
- Installer / uninstaller scripts (`install.ps1`, `uninstall.ps1`).
- Unit tests for the pure projection logic (`tests/`).

### Changed
- Trigger handle is now a small rounded pill on the right edge (no longer a full-height strip, so it does not cover the chat scrollbar).
- Panel styling aligned with the sidebar/workspace theme (sidebar fill, 16px left radius, theme shadow, 8px row radius, eased motion).
- Preview popover moved outside the transformed panel so `position: fixed` coordinates are viewport-correct.

## [0.1.0-rc.6] - 2026-08-15

### Added
- Persistent installation (plugins dir + junction + cordis.patch.yml).
- Settings → Plugins card with enable/disable toggle.
- Right-edge hover flyout (replaced the header button).
- Messages-only filter (user + assistant) with an "all" toggle.

## [0.1.0-rc.5] - 2026-08-15

### Added
- Initial dynamic-plugin prototype: Voyager-style chat rail, nav points from ChatSnapshot, anchor via data-chat-anchor-key, bookmarks, j/k/gg/GG, width drag.
