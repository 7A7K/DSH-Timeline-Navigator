import test from 'node:test'
import assert from 'node:assert/strict'

import { createAppStore, createBookmarkStore, loadPreferences } from '../src/client/storage.js'

function memoryStorage() {
  const values = new Map()
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, String(value)),
  }
}

test('persists timeline preferences and clamps width', () => {
  const storage = memoryStorage()
  const store = createAppStore(storage)
  store.setWidth(999)
  store.toggleSmooth()
  store.toggleFilterMode()
  assert.equal(store.getWidth(), 420)
  assert.equal(store.isSmooth(), false)
  assert.equal(store.getFilterMode(), 'all')
  assert.equal(loadPreferences(storage).width, 420)
  assert.equal(loadPreferences(storage).filterMode, 'all')
})

test('persists enabled state and bookmark toggles', () => {
  const storage = memoryStorage()
  const store = createAppStore(storage)
  store.setEnabled(false)
  assert.equal(createAppStore(storage).isEnabled(), false)

  const bookmarks = createBookmarkStore(storage)
  const point = { key: 'node-1', title: 'First message', anchorSeq: 1 }
  assert.equal(bookmarks.toggle('session-1', point).length, 1)
  assert.equal(createBookmarkStore(storage).list('session-1').length, 1)
  assert.equal(bookmarks.toggle('session-1', point).length, 0)
})

