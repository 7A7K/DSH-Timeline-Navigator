/** DOM integration stays isolated from the projection model. */

function getDocument() {
  return typeof document === 'undefined' ? null : document
}

export function findScrollport() {
  return getDocument()?.querySelector('[data-conversation-scroll]') ?? null
}

export function findRow(key) {
  const scrollport = findScrollport()
  if (!scrollport || !key) return null
  const rows = scrollport.querySelectorAll('[data-chat-anchor-key]')
  for (const row of rows) {
    if (row.dataset?.chatAnchorKey === key) return row
  }
  return null
}

export function prefersReducedMotion() {
  try {
    return typeof globalThis.matchMedia === 'function'
      && globalThis.matchMedia('(prefers-reduced-motion: reduce)').matches
  } catch {
    return false
  }
}

export function scrollToKey(key, smooth) {
  const row = findRow(key)
  if (!row) return false
  const behavior = smooth && !prefersReducedMotion() ? 'smooth' : 'auto'
  try {
    row.scrollIntoView({ block: 'center', behavior })
  } catch {
    try { row.scrollIntoView(true) } catch {}
  }
  return true
}

export function throttle(callback, delay) {
  let last = 0
  let timer = null
  function run() {
    timer = null
    last = Date.now()
    callback()
  }
  function throttled() {
    const now = Date.now()
    const remaining = delay - (now - last)
    if (remaining <= 0) {
      if (timer) clearTimeout(timer)
      timer = null
      last = now
      callback()
    } else if (!timer) {
      timer = setTimeout(run, remaining)
    }
  }
  throttled.cancel = () => {
    if (timer) clearTimeout(timer)
    timer = null
  }
  return throttled
}

export async function locate(session, targetKey, smooth, delay = wait) {
  function inSnapshot() {
    const snapshot = session?.getSnapshot?.()
    return Boolean(snapshot?.chat?.order?.includes(targetKey))
  }

  // The row can exist in the snapshot before React has painted it.
  for (let attempt = 0; attempt < 8; attempt += 1) {
    if (!inSnapshot()) break
    if (scrollToKey(targetKey, smooth)) return true
    await delay(50)
  }

  // Ask the host for older pages only when the target is not in the snapshot.
  for (let attempt = 0; attempt < 40; attempt += 1) {
    const snapshot = session?.getSnapshot?.()
    if (inSnapshot()) {
      if (scrollToKey(targetKey, smooth)) return true
      await delay(70)
      continue
    }
    if (!snapshot?.hasMore || snapshot.loadingOlder) {
      if (snapshot?.loadingOlder) await delay(120)
      else break
      continue
    }
    try {
      await session.loadOlder()
    } catch {
      break
    }
    await delay(90)
  }
  return scrollToKey(targetKey, smooth)
}

function wait(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds))
}
