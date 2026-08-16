# Contributing

Thanks for improving Timeline Navigator.

## Before opening a change

1. Confirm the behavior against a current DeepSeek Harness Web client.
2. Keep host integration in `src/client/dom.js` and `src/client/index.js`; keep projection and persistence logic framework-independent.
3. Add or update a `node:test` case for model, filtering, persistence, or navigation edge cases.
4. Do not edit generated files manually.

## Local checks

```powershell
npm ci
npm run check
npm run bundle
npm run smoke
```

Run `npm run smoke` with a non-empty conversation selected in the local Harness. For a fresh browser
context, set `DSH_SESSION_TEXT` to the visible session title and `DSH_WORKSPACE_TEXT` to its workspace
first. It exercises the real rendered panel, turn controls, bookmarks, boundary jumps, tooltips, and
Escape close behavior.

The generated `lib/client.js` must begin with `window.__ModuleLoader__.load` and must load through the DSH client module system.

## Pull requests

Please describe:

- the user-facing behavior that changed;
- keyboard, touch, and reduced-motion behavior;
- any DSH runtime contract or compatibility assumption;
- how the change was tested.
