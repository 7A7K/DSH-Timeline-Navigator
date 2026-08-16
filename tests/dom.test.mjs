import test, { afterEach } from 'node:test'
import assert from 'node:assert/strict'

import { findRow, findScrollport, locate, prefersReducedMotion, scrollToKey } from '../src/client/dom.js'

const originalDocument = globalThis.document
const originalMatchMedia = globalThis.matchMedia

function makeRow(key) {
  return {
    dataset: { chatAnchorKey: key },
    scrollCalls: [],
    scrollIntoView(options) {
      this.scrollCalls.push(options)
    },
  }
}

function installHostDom(rows = []) {
  const scrollport = {
    querySelectorAll(selector) {
      assert.equal(selector, '[data-chat-anchor-key]')
      return rows
    },
  }
  globalThis.document = {
    querySelector(selector) {
      return selector === '[data-conversation-scroll]' ? scrollport : null
    },
  }
  return scrollport
}

afterEach(() => {
  if (originalDocument === undefined) delete globalThis.document
  else globalThis.document = originalDocument
  if (originalMatchMedia === undefined) delete globalThis.matchMedia
  else globalThis.matchMedia = originalMatchMedia
})

test('finds the Harness conversation scrollport and keyed message rows', () => {
  const first = makeRow('message-1')
  const second = makeRow('message-2')
  const scrollport = installHostDom([first, second])

  assert.equal(findScrollport(), scrollport)
  assert.equal(findRow('message-2'), second)
  assert.equal(findRow('missing'), null)
  assert.equal(findRow(''), null)
})

test('scrolls through the host contract and respects reduced motion', () => {
  const row = makeRow('message-1')
  installHostDom([row])
  globalThis.matchMedia = (query) => ({ matches: query.includes('prefers-reduced-motion') })

  assert.equal(prefersReducedMotion(), true)
  assert.equal(scrollToKey('message-1', true), true)
  assert.deepEqual(row.scrollCalls, [{ block: 'center', behavior: 'auto' }])
  assert.equal(scrollToKey('missing', true), false)
})

test('loads older host pages before locating an unloaded message', async () => {
  const row = makeRow('older-message')
  installHostDom([row])
  let snapshot = { chat: { order: [] }, hasMore: true, loadingOlder: false }
  let loadCount = 0
  const session = {
    getSnapshot: () => snapshot,
    async loadOlder() {
      loadCount += 1
      snapshot = { chat: { order: ['older-message'] }, hasMore: false, loadingOlder: false }
    },
  }

  assert.equal(await locate(session, 'older-message', false, async () => {}), true)
  assert.equal(loadCount, 1)
  assert.deepEqual(row.scrollCalls, [{ block: 'center', behavior: 'auto' }])
})

test('fails safely when the host DOM is unavailable', () => {
  delete globalThis.document
  assert.equal(findScrollport(), null)
  assert.equal(findRow('message-1'), null)
  assert.equal(scrollToKey('message-1', false), false)
})
