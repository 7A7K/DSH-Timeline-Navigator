/** Persistent, defensive storage for user preferences and bookmarks. */

export const STORAGE_PREFIX = 'dsh-timeline-navigator'
export const ENABLED_KEY = `${STORAGE_PREFIX}:enabled:v2`
export const PREFERENCES_KEY = `${STORAGE_PREFIX}:preferences:v1`
export const BOOKMARKS_KEY = `${STORAGE_PREFIX}:bookmarks:v1:`

export function safeStorage() {
  try {
    const storage = globalThis.localStorage
    if (storage && typeof storage.getItem === 'function' && typeof storage.setItem === 'function') {
      return storage
    }
  } catch {}
  return null
}

function readJson(storage, key, fallback) {
  if (!storage) return fallback
  try {
    const value = storage.getItem(key)
    return value ? JSON.parse(value) : fallback
  } catch {
    return fallback
  }
}

function writeJson(storage, key, value) {
  if (!storage) return
  try {
    storage.setItem(key, JSON.stringify(value))
  } catch {}
}

const DEFAULT_PREFERENCES = Object.freeze({
  width: 240,
  smooth: true,
  filterMode: 'messages',
  hintSeen: false,
})

export function loadPreferences(storage = safeStorage()) {
  const raw = readJson(storage, PREFERENCES_KEY, {})
  return {
    width: clampNumber(raw?.width, 180, 420, DEFAULT_PREFERENCES.width),
    smooth: raw?.smooth !== false,
    filterMode: raw?.filterMode === 'all' ? 'all' : DEFAULT_PREFERENCES.filterMode,
    hintSeen: raw?.hintSeen === true,
  }
}

export function createAppStore(storage = safeStorage()) {
  const saved = loadPreferences(storage)
  const enabledRaw = readStorageValue(storage, ENABLED_KEY)
  let width = saved.width
  let smooth = saved.smooth
  let filterMode = saved.filterMode
  let hintSeen = saved.hintSeen
  let enabled = enabledRaw == null ? true : enabledRaw !== 'false'
  const listeners = new Set()

  function emit() {
    for (const listener of listeners) listener()
  }

  function persist() {
    writeJson(storage, PREFERENCES_KEY, { width, smooth, filterMode, hintSeen })
  }

  return {
    getWidth: () => width,
    isSmooth: () => smooth,
    getFilterMode: () => filterMode,
    isEnabled: () => enabled,
    isHintSeen: () => hintSeen,
    setWidth(value) {
      const next = clampNumber(value, 180, 420, width)
      if (next !== width) {
        width = next
        persist()
        emit()
      }
    },
    toggleSmooth() {
      smooth = !smooth
      persist()
      emit()
    },
    toggleFilterMode() {
      filterMode = filterMode === 'messages' ? 'all' : 'messages'
      persist()
      emit()
    },
    markHintSeen() {
      if (hintSeen) return
      hintSeen = true
      persist()
      emit()
    },
    setEnabled(value) {
      const next = Boolean(value)
      if (enabled === next) return
      enabled = next
      try { storage?.setItem(ENABLED_KEY, next ? 'true' : 'false') } catch {}
      emit()
    },
    subscribe(listener) {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
  }
}

export function createBookmarkStore(storage = safeStorage()) {
  const memory = new Map()

  function read(sessionId) {
    const fallback = memory.get(sessionId) || []
    const value = readJson(storage, BOOKMARKS_KEY + sessionId, fallback)
    if (!Array.isArray(value)) return []
    return value.filter((bookmark) => bookmark && typeof bookmark.chatKey === 'string')
  }

  function write(sessionId, list) {
    memory.set(sessionId, list)
    writeJson(storage, BOOKMARKS_KEY + sessionId, list)
  }

  return {
    list: (sessionId) => read(sessionId),
    toggle(sessionId, point) {
      const list = read(sessionId).slice()
      const index = list.findIndex((bookmark) => bookmark.chatKey === point.key)
      if (index >= 0) list.splice(index, 1)
      else list.push({
        sessionId,
        chatKey: point.key,
        anchorSeq: point.anchorSeq,
        title: point.title,
        createdAt: Date.now(),
      })
      write(sessionId, list)
      return list
    },
  }
}

function clampNumber(value, min, max, fallback) {
  const number = Number(value)
  if (!Number.isFinite(number)) return fallback
  return Math.max(min, Math.min(max, Math.round(number)))
}

function readStorageValue(storage, key) {
  try { return storage?.getItem(key) ?? null } catch { return null }
}
