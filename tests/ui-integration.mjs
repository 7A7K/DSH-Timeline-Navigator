import test from 'node:test'
import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { chromium } from 'playwright'

const root = resolve(fileURLToPath(new URL('..', import.meta.url)))

const fixtureHtml = String.raw`<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <title>Simulated Harness host</title>
    <style>
      html, body { margin: 0; min-height: 100%; font-family: sans-serif; }
      body { background: #f5f8ff; }
      [data-conversation-scroll] { height: 520px; overflow: auto; padding: 24px; }
      [data-chat-anchor-key] { height: 90px; margin: 12px 0; padding: 16px; background: white; border-radius: 12px; }
      #timeline-mount { position: fixed; inset: 0; pointer-events: none; }
      #timeline-mount > * { pointer-events: auto; }
      #settings-mount { position: fixed; left: 12px; bottom: 12px; width: 360px; }
    </style>
    <script src="/react.js"></script>
    <script src="/react-dom.js"></script>
    <script>
      window.__fixture = { settingsEnabled: [], languageToggles: 0 }
      const modules = new Map()
      function defineStore(config) {
        let state = config.init()
        const listeners = new Set()
        const store = {
          subscribe(listener) {
            listeners.add(listener)
            return () => listeners.delete(listener)
          },
        }
        for (const [name, action] of Object.entries(config.actions || {})) {
          store[name] = (...args) => {
            const draft = { ...state }
            action(draft, ...args)
            state = draft
            for (const listener of listeners) listener()
          }
        }
        return store
      }
      modules.set('react', window.React)
      modules.set('@deepseek-ai/dsh-client-runtime/client', { defineStore })
      window.__ModuleLoader__ = {
        modules,
        load(payload) {
          modules.set(payload.id, payload.factory((name) => modules.get(name)))
        },
      }
    </script>
  </head>
  <body>
    <main data-conversation-scroll>
      <div data-chat-anchor-key="u1">User message one</div>
      <div data-chat-anchor-key="a1">Assistant response one</div>
      <div data-chat-anchor-key="u2">User message two</div>
      <div data-chat-anchor-key="a2">Assistant response two</div>
    </main>
    <div id="timeline-mount"></div>
    <div id="settings-mount"></div>
    <script src="/client.js"></script>
    <script>
      const plugin = window.__ModuleLoader__.modules.get('@deepseek-ai/dsh-client-ui-timeline-navigator')
      const nodeMap = new Map([
        ['u1', { kind: 'user', anchorSeq: 1, visibility: 'visible', location: { kind: 'turn', turn: { turn: 1 } }, data: { text: 'User message one' } }],
        ['a1', { kind: 'assistant-step', anchorSeq: 2, visibility: 'visible', location: { kind: 'step', turn: { turn: 1 }, step: { step: 1 } }, data: { text: 'Assistant response one' } }],
        ['u2', { kind: 'user', anchorSeq: 3, visibility: 'visible', location: { kind: 'turn', turn: { turn: 2 } }, data: { text: 'User message two' } }],
        ['a2', { kind: 'assistant-step', anchorSeq: 4, visibility: 'visible', location: { kind: 'step', turn: { turn: 2 }, step: { step: 1 } }, data: { text: 'Assistant response two' } }],
      ])
      const snapshot = () => ({
        chat: { order: ['u1', 'a1', 'u2', 'a2'], nodes: { get: (key) => nodeMap.get(key) } },
        blank: false,
        running: false,
        hasMore: false,
        loadingOlder: false,
      })
      const session = {
        getSnapshot: snapshot,
        subscribe: () => () => {},
        loadOlder: async () => {},
      }
      const registrations = {}
      const slots = {
        inject(name, factory) { registrations[name] = factory() },
        register(meta, component) { return { meta, component } },
      }
      const locale = {
        getSnapshot: () => ({ locale: 'en' }),
        subscribe: () => () => {},
        register: () => {},
      }
      plugin.apply({
        sessions: { binding: () => ({ session }) },
        slots,
        locale,
        effect: () => {},
      })

      const useSessions = (selector) => selector({ current: 'session-1' })
      const overlay = registrations['shell.overlay'].component({ useSessions })
      ReactDOM.createRoot(document.querySelector('#timeline-mount')).render(overlay)

      const settingsState = { enabled: true, language: 'en' }
      const settings = registrations['settings.plugin.item'].component
      ReactDOM.createRoot(document.querySelector('#settings-mount')).render(
        React.createElement(settings, {
          useStore: (selector) => selector(settingsState),
          t: (key) => key,
          setEnabled: (value) => window.__fixture.settingsEnabled.push(value),
          toggleLanguage: () => { window.__fixture.languageToggles += 1 },
        }),
      )
    </script>
  </body>
</html>`

const assets = new Map([
  ['/fixture.html', { body: fixtureHtml, type: 'text/html; charset=utf-8' }],
  ['/react.js', { body: await readFile(resolve(root, 'node_modules/react/umd/react.development.js')), type: 'text/javascript' }],
  ['/react-dom.js', { body: await readFile(resolve(root, 'node_modules/react-dom/umd/react-dom.development.js')), type: 'text/javascript' }],
  ['/client.js', { body: await readFile(resolve(root, 'lib/client.js')), type: 'text/javascript' }],
])

function startFixtureServer() {
  const server = createServer((request, response) => {
    const asset = assets.get(new URL(request.url, 'http://127.0.0.1').pathname)
    if (!asset) {
      response.writeHead(404)
      response.end('Not found')
      return
    }
    response.writeHead(200, { 'Content-Type': asset.type })
    response.end(asset.body)
  })
  return new Promise((resolveServer, reject) => {
    server.once('error', reject)
    server.listen(0, '127.0.0.1', () => resolveServer(server))
  })
}

test('runs core timeline interactions in a simulated Harness page', async () => {
  const server = await startFixtureServer()
  const port = server.address().port
  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
  const pageErrors = []
  page.on('pageerror', (error) => pageErrors.push(error.message))

  try {
    await page.goto(`http://127.0.0.1:${port}/fixture.html`, { waitUntil: 'load' })

    const trigger = page.locator('.tlnav-trigger')
    await trigger.waitFor({ state: 'visible' })
    await trigger.click()

    const panel = page.locator('.tlnav-panel[data-open="true"]')
    await panel.waitFor({ state: 'visible' })
    await panel.locator('.tlnav-pin').click()

    assert.equal(await panel.locator('.tlnav-turn').count(), 2)
    assert.equal(await panel.locator('.tlnav-spacer').count(), 1)
    assert.equal(await panel.locator('.tlnav-search, .tlnav-turn-jump').count(), 0)
    assert.deepEqual(await panel.locator('.tlnav-turn').evaluateAll((nodes) => nodes.map((node) => node.getAttribute('aria-expanded'))), ['false', 'false'])

    await panel.locator('[data-action="expand-all"]').click()
    assert.deepEqual(await panel.locator('.tlnav-turn').evaluateAll((nodes) => nodes.map((node) => node.getAttribute('aria-expanded'))), ['true', 'true'])

    const star = panel.locator('.tlnav-star-button').first()
    assert.equal(await star.getAttribute('aria-pressed'), 'false')
    await star.click()
    assert.equal(await star.getAttribute('aria-pressed'), 'true')

    const language = panel.locator('.tlnav-language')
    await language.click()
    await page.waitForTimeout(40)
    assert.equal(await language.getAttribute('data-language'), 'zh')
    assert.match(await panel.innerText(), /回合/)

    await panel.locator('[data-action="collapse-all"]').click()
    assert.deepEqual(await panel.locator('.tlnav-turn').evaluateAll((nodes) => nodes.map((node) => node.getAttribute('aria-expanded'))), ['false', 'false'])
    await panel.locator('[data-action="jump-latest"]').click()

    const settingsCard = page.locator('.tlnav-card')
    assert.equal(await settingsCard.count(), 1)
    await settingsCard.locator('.tlnav-card-toggle').click()
    assert.equal(await page.evaluate(() => window.__fixture.settingsEnabled.at(-1)), false)
    await settingsCard.locator('.tlnav-card-language').click()
    assert.equal(await page.evaluate(() => window.__fixture.languageToggles), 1)

    await page.keyboard.press('Escape')
    await page.waitForFunction(() => !document.querySelector('.tlnav-panel[data-open="true"]'))
    assert.deepEqual(pageErrors, [])
  } finally {
    await browser.close()
    await new Promise((resolveServer) => server.close(resolveServer))
  }
})
