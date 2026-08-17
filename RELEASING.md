# Release guide

This project uses version tags to create GitHub Releases. The release workflow validates the
bundle, packages the plugin, and attaches the `.tgz` artifact to the release. It is safe to rerun:
if a release with the same tag already exists, the workflow uploads the package again with
`--clobber` instead of failing on duplicate release creation.

## First-time GitHub setup

Create an empty GitHub repository, then connect this local plugin directory:

```powershell
git init -b main
git add .
git commit -m "chore: initial timeline navigator release"
git remote add origin <your-repository-url>
git push -u origin main
```

Do not commit `node_modules/` or `.tmp/`; they are already ignored.

## Cut a release

Update `CHANGELOG.md`, then run the checks and create a version tag:

```powershell
npm version patch --no-git-tag-version
npm run bundle
npm run check
git add package.json package-lock.json CHANGELOG.md lib/client.js src README.md README.zh-CN.md demo-timeline.svg
git commit -m "release: v<version>"
git tag v<version>
git push origin main --follow-tags
```

If you use GitHub Desktop, select all tracked and new files, commit the release preparation,
and then click **Push origin**. `node_modules/` and `.tmp/` remain ignored.

The package version, lockfile version, top `CHANGELOG.md` entry, and tag must match. The quality
and release workflows check this automatically. For the current pending release, that means
publishing tag `v0.3.5` from the commit containing the latest hardening changes. Pushing the tag starts
`.github/workflows/release.yml`; the resulting GitHub Release includes generated notes and the
installable plugin package.

Before publishing, run both the deterministic fixture test and the core check:

```powershell
npm run check
npm run test:ui
```

`npm run test:ui` uses a simulated Harness page and is safe for CI. `npm run smoke` remains the
manual check against a real, non-empty Harness conversation and is not forced into ordinary CI.

## UI smoke test before release

Open a non-empty conversation in the local Harness first, then run:

```powershell
npm run smoke
```

The test checks the initial collapsed state, Expand all / Collapse all, bookmark toggling, earliest
and latest controls, tooltip labels, and `Escape` close behavior. If a fresh browser has no selected
conversation, set `DSH_SESSION_TEXT` to a visible session title:

```powershell
$env:DSH_SESSION_TEXT = '修复书签显示与回合点击问题'
$env:DSH_WORKSPACE_TEXT = 'some tool'
npm run smoke
```

If Playwright browsers are not installed yet, run `npx playwright install chromium` once. Set
`DSH_URL` for a different local Harness URL or `DSH_HEADFUL=1` to watch the test.
