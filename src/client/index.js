import React from 'react'
import { defineStore } from '@deepseek-ai/dsh-client-runtime/client'

import {
  filterNavPoints,
  groupNavPoints,
  projectNavPoints,
} from './model.js'
import {
  createAppStore,
  createBookmarkStore,
  MIN_PANEL_WIDTH,
  safeStorage,
} from './storage.js'
import {
  findScrollport,
  locate,
  throttle,
} from './dom.js'
import {
  panelDictionaries,
  readLanguage,
  SETTINGS_NAMESPACE,
  settingsEn,
  settingsZh,
} from './locale.js'
import { CSS as TIMELINE_CSS } from './styles.js'

const PLUGIN_ID = '@deepseek-ai/dsh-client-ui-timeline-navigator'

// DSH uses this export to resolve the host objects before calling apply().
export const inject = ['sessions', 'slots', 'locale']

function escapeAttributeValue(value) {
  return String(value).replace(/[\\\"]/g, '\\\\$&')
}

const selectChat = (state) => state?.chat
const selectBlank = (state) => Boolean(state?.blank)
const selectRunning = (state) => Boolean(state?.running)

function useStoreValue(store, selector) {
  const [value, setValue] = React.useState(() => selector(store))
  React.useEffect(() => store.subscribe(() => setValue(selector(store))), [store, selector])
  return value
}

function useBindingSelection(session, selector) {
  const [value, setValue] = React.useState(() => (session ? selector(session.getSnapshot()) : undefined))
  React.useEffect(() => {
    if (!session) {
      setValue(undefined)
      return undefined
    }
    setValue(selector(session.getSnapshot()))
    return session.subscribe(() => setValue(selector(session.getSnapshot())))
  }, [session, selector])
  return value
}

function resolveLanguage(locale, store) {
  const preference = store?.getLanguage?.()
  return preference === 'zh' || preference === 'en' ? preference : readLanguage(locale)
}

function useLanguage(locale, store) {
  const [language, setLanguage] = React.useState(() => resolveLanguage(locale, store))
  React.useEffect(() => {
    const update = () => setLanguage(resolveLanguage(locale, store))
    update()
    const unsubscribeLocale = typeof locale?.subscribe === 'function' ? locale.subscribe(update) : undefined
    const unsubscribeStore = typeof store?.subscribe === 'function' ? store.subscribe(update) : undefined
    return () => {
      if (typeof unsubscribeLocale === 'function') unsubscribeLocale()
      if (typeof unsubscribeStore === 'function') unsubscribeStore()
    }
  }, [locale, store])
  return language
}

function localizeNavTitle(nav, t) {
  const titleKeys = {
    user: 'user',
    'assistant-step': 'assistant',
    context: 'context',
    compaction: 'compaction',
    'manual-compaction': 'compaction',
    retry: 'retry',
    'model-retry': 'retry',
    steering: 'steering',
    'turn-error': 'error',
    'turn-max-tokens': 'maxTokens',
    'workflow-run': 'workflow',
    'turn-tail': 'turn',
    unknown: 'unknown',
  }
  const key = titleKeys[nav.kind]
  if (key) return t(key)
  if (nav.kind === 'tool-call') return nav.title === 'Tool' ? t('tool') : nav.title
  if (nav.kind === 'command' || nav.kind === 'command-input') return nav.title?.startsWith('/') ? nav.title : t('command')
  return nav.title || t('node')
}

function SettingsCard(props) {
  const enabled = props.useStore((state) => state.enabled)
  const languagePreference = props.useStore((state) => state.language)
  const language = languagePreference === 'zh' || languagePreference === 'en'
    ? languagePreference
    : undefined
  const t = language
    ? (key) => (language === 'zh' ? settingsZh : settingsEn)[key] || props.t(key)
    : props.t
  return React.createElement(
    'li',
    { className: 'tlnav-card' },
    React.createElement(
      'div',
      { className: 'tlnav-card-text' },
      React.createElement('div', { className: 'tlnav-card-title' }, t('timeline.title')),
      React.createElement('div', { className: 'tlnav-card-desc' }, t('timeline.description')),
    ),
    React.createElement(
      'div',
      { className: 'tlnav-card-actions' },
      React.createElement(
        'button',
        {
          type: 'button',
          className: 'tlnav-card-language',
          'aria-label': language === 'zh' ? t('timeline.switchToEnglish') : t('timeline.switchToChinese'),
          title: language === 'zh' ? t('timeline.switchToEnglish') : t('timeline.switchToChinese'),
          onClick: props.toggleLanguage,
        },
        React.createElement('span', { 'data-active': language === 'zh' ? 'true' : 'false' }, '中'),
        React.createElement('span', { 'aria-hidden': 'true' }, '/'),
        React.createElement('span', { 'data-active': language === 'en' ? 'true' : 'false' }, 'EN'),
      ),
      React.createElement(
        'button',
        {
          type: 'button',
          className: 'tlnav-card-toggle',
          'aria-pressed': enabled,
          'aria-label': `${t('timeline.title')}: ${enabled ? t('timeline.enable') : t('timeline.disable')}`,
          onClick: () => props.setEnabled(!enabled),
        },
        React.createElement('span', { className: 'tlnav-card-check', 'aria-hidden': 'true' }, enabled ? '✓' : ''),
        enabled ? t('timeline.enable') : t('timeline.disable'),
      ),
    ),
  )
}

function MarkerRow({ nav, active, bookmarked, onNavigate, onToggleBookmark, onHover, onLeave, t }) {
  const longTimer = React.useRef(null)
  const longTriggered = React.useRef(false)
  const title = localizeNavTitle(nav, t)

  function startPress(event) {
    event.stopPropagation()
    longTriggered.current = false
    if (event.pointerType === 'mouse') return
    longTimer.current = setTimeout(() => {
      longTriggered.current = true
      onToggleBookmark(nav)
    }, 520)
  }

  function endPress() {
    if (longTimer.current) clearTimeout(longTimer.current)
    longTimer.current = null
  }

  React.useEffect(() => () => {
    if (longTimer.current) clearTimeout(longTimer.current)
  }, [])

  return React.createElement(
    'div',
    {
      className: 'tlnav-marker',
      'data-key': nav.key,
      'data-active': active ? 'true' : 'false',
      'data-role': nav.role,
      onMouseEnter: (event) => onHover(nav, event.currentTarget.getBoundingClientRect()),
      onMouseLeave: onLeave,
      onFocus: (event) => onHover(nav, event.currentTarget.getBoundingClientRect()),
      onBlur: onLeave,
    },
    React.createElement(
      'button',
      {
        className: 'tlnav-marker-main',
        type: 'button',
        'aria-label': `${nav.turn != null ? `${t('turnLabel')} ${nav.turn} · ` : ''}${title}`,
        'aria-current': active ? 'location' : undefined,
        title: nav.preview || title,
        onPointerDown: startPress,
        onPointerUp: endPress,
        onPointerLeave: endPress,
        onPointerCancel: endPress,
        onClick: (event) => {
          event.stopPropagation()
          if (longTriggered.current) {
            longTriggered.current = false
            return
          }
          onNavigate(nav)
        },
      },
      React.createElement('span', { className: 'tlnav-dot', 'data-role': nav.role, 'aria-hidden': 'true' }),
      nav.step != null ? React.createElement('span', { className: 'tlnav-step', 'aria-hidden': 'true' }, String(nav.step)) : null,
      React.createElement('span', { className: 'tlnav-label' }, title),
    ),
    React.createElement(
      'button',
      {
        className: 'tlnav-star-button',
        type: 'button',
        'aria-pressed': bookmarked,
        'aria-label': bookmarked ? t('removeBookmark') : t('bookmark'),
        title: bookmarked ? t('removeBookmark') : t('bookmark'),
        onClick: (event) => {
          event.stopPropagation()
          onToggleBookmark(nav)
        },
      },
      React.createElement('span', { className: 'tlnav-star', 'data-on': bookmarked ? 'true' : 'false', 'aria-hidden': 'true' }, bookmarked ? '★' : '☆'),
    ),
  )
}

function PreviewCard({ preview, t }) {
  if (!preview) return null
  const width = 280
  const height = typeof window === 'undefined' ? 800 : window.innerHeight
  const left = Math.max(8, preview.rect.left - width - 10)
  const top = Math.max(8, Math.min(preview.rect.top, height - 240))
  return React.createElement(
    'div',
    {
      className: 'tlnav-preview-fixed',
      style: { position: 'fixed', left, top, width, maxWidth: '70vw', zIndex: 70, pointerEvents: 'none' },
      role: 'tooltip',
    },
    React.createElement('div', { className: 'tlnav-preview-title' }, localizeNavTitle(preview.nav, t)),
    preview.nav.preview ? React.createElement('div', { className: 'tlnav-preview-text' }, preview.nav.preview) : null,
    preview.nav.turn != null
      ? React.createElement('div', { className: 'tlnav-preview-meta' }, `${t('turnLabel')} ${preview.nav.turn}${preview.nav.step != null ? ` · ${t('step')} ${preview.nav.step}` : ''}`)
      : null,
  )
}

function GroupHeader({ group, collapsed, onToggle, onHover, onLeave, t }) {
  const firstPoint = group.items.find((point) => point.role === 'user') || group.items[0]
  const activate = (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      onToggle(group.turn)
    }
  }
  return React.createElement(
    'div',
    {
      className: 'tlnav-turn',
      role: 'button',
      tabIndex: 0,
      'aria-expanded': !collapsed,
      onClick: () => onToggle(group.turn),
      onKeyDown: activate,
      onMouseEnter: (event) => firstPoint && onHover(firstPoint, event.currentTarget.getBoundingClientRect()),
      onMouseLeave: onLeave,
      onFocus: (event) => firstPoint && onHover(firstPoint, event.currentTarget.getBoundingClientRect()),
      onBlur: onLeave,
    },
    React.createElement('span', { className: 'tlnav-turn-caret', 'aria-hidden': 'true' }, collapsed ? '▸' : '▾'),
    React.createElement('span', null, `${t('turnLabel')} ${group.turn}`),
    React.createElement('span', { className: 'tlnav-turn-count' }, `${group.items.length} ${t('messages')}`),
  )
}

function initialCollapsedTurns(points) {
  const collapsed = {}
  for (const point of points) {
    if (point.turn != null) collapsed[point.turn] = true
  }
  return collapsed
}

function RailPanel({ sessions, locale, useSessions, store }) {
  const storage = React.useMemo(() => safeStorage(), [])
  const bookmarks = React.useMemo(() => createBookmarkStore(storage), [storage])
  const lang = useLanguage(locale, store)
  const t = React.useCallback((key) => panelDictionaries[lang]?.[key] || key, [lang])
  const width = useStoreValue(store, store.getWidth)
  const smooth = useStoreValue(store, store.isSmooth)
  const mode = useStoreValue(store, store.getFilterMode)
  const enabled = useStoreValue(store, store.isEnabled)
  const hintSeen = useStoreValue(store, store.isHintSeen)

  const sessionId = useSessions((state) => state?.current)
  const binding = sessionId ? sessions.binding(sessionId) : undefined
  const session = binding?.session
  const chat = useBindingSelection(session, selectChat)
  const blank = useBindingSelection(session, selectBlank)
  const running = useBindingSelection(session, selectRunning)
  const navPoints = React.useMemo(() => projectNavPoints(chat), [chat])

  const [open, setOpen] = React.useState(false)
  const [pinned, setPinned] = React.useState(false)
  const [activeKey, setActiveKey] = React.useState(null)
  const [cursor, setCursor] = React.useState(null)
  const [preview, setPreview] = React.useState(null)
  const [status, setStatus] = React.useState('')
  const [toast, setToast] = React.useState('')
  const [collapsed, setCollapsed] = React.useState({})
  const [bookmarkList, setBookmarkList] = React.useState(() => (sessionId ? bookmarks.list(sessionId) : []))
  const [railTop, setRailTop] = React.useState(0)
  const initialCollapseApplied = React.useRef(navPoints.length > 0)
  const listRef = React.useRef(null)
  const closeTimer = React.useRef(null)
  const toastTimer = React.useRef(null)
  const dragging = React.useRef(false)
  const loadingOlder = React.useRef(false)

  const visiblePoints = React.useMemo(() => filterNavPoints(navPoints, mode), [navPoints, mode])
  const groups = React.useMemo(() => groupNavPoints(visiblePoints), [visiblePoints])

  React.useEffect(() => {
    if (!sessionId) return undefined
    setBookmarkList(bookmarks.list(sessionId))
    setCursor(null)
    setActiveKey(null)
    setStatus('')
    initialCollapseApplied.current = false
    setCollapsed(initialCollapsedTurns(navPoints))
    setOpen(false)
    setPinned(false)
    setPreview(null)
    return undefined
  }, [sessionId, bookmarks])

  React.useEffect(() => {
    if (!navPoints.length || initialCollapseApplied.current) return
    initialCollapseApplied.current = true
    setCollapsed(initialCollapsedTurns(navPoints))
  }, [navPoints])

  React.useEffect(() => {
    const measure = () => {
      const scrollport = findScrollport()
      if (scrollport) setRailTop(Math.max(0, scrollport.getBoundingClientRect().top))
    }
    measure()
    const timer = setTimeout(measure, 250)
    window.addEventListener('resize', measure)
    return () => {
      clearTimeout(timer)
      window.removeEventListener('resize', measure)
    }
  }, [])

  React.useEffect(() => () => {
    if (closeTimer.current) clearTimeout(closeTimer.current)
    if (toastTimer.current) clearTimeout(toastTimer.current)
  }, [])

  React.useEffect(() => {
    if (!open) return undefined
    const scrollport = findScrollport()
    if (!scrollport) return undefined
    const compute = () => {
      const top = scrollport.getBoundingClientRect().top
      const line = top + Math.min(180, scrollport.clientHeight * 0.35)
      const rows = scrollport.querySelectorAll('[data-chat-anchor-key]')
      let current = null
      for (const row of rows) {
        const rect = row.getBoundingClientRect()
        if (rect.top <= line && rect.bottom > top) current = row.dataset.chatAnchorKey
      }
      setActiveKey(current)
      if (current && listRef.current) {
        const item = listRef.current.querySelector(`[data-key="${escapeAttributeValue(current)}"]`)
        item?.scrollIntoView?.({ block: 'nearest' })
      }
    }
    const onScroll = throttle(compute, 120)
    compute()
    scrollport.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    const observer = new MutationObserver(onScroll)
    observer.observe(scrollport, { childList: true, subtree: true })
    return () => {
      scrollport.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      onScroll.cancel?.()
      observer.disconnect()
    }
  }, [open, navPoints])

  const navigate = React.useCallback((point) => {
    if (!session) return
    setCursor(point.key)
    setStatus('')
    locate(session, point.key, smooth).then((found) => {
      if (!found) setStatus(t('notFound'))
    })
  }, [session, smooth, t])

  React.useEffect(() => {
    if (!open) return undefined
    const onKey = (event) => {
      if (event.key !== 'Escape') return
      event.preventDefault()
      closeNow()
    }
    document.addEventListener('keydown', onKey, true)
    return () => document.removeEventListener('keydown', onKey, true)
  }, [open])

  function openPanel() {
    if (closeTimer.current) clearTimeout(closeTimer.current)
    setOpen(true)
    if (!hintSeen) setTimeout(() => store.markHintSeen(), 4000)
  }

  function togglePanel() {
    if (open) closeNow()
    else openPanel()
  }

  function scheduleClose() {
    if (dragging.current || pinned) return
    if (closeTimer.current) clearTimeout(closeTimer.current)
    closeTimer.current = setTimeout(() => {
      setOpen(false)
      setPreview(null)
    }, 260)
  }

  function closeNow() {
    if (closeTimer.current) clearTimeout(closeTimer.current)
    setOpen(false)
    setPinned(false)
    setPreview(null)
  }

  function showToast(message) {
    setToast(message)
    if (toastTimer.current) clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(''), 1600)
  }

  function toggleBookmark(point) {
    if (!sessionId) return
    const list = bookmarks.toggle(sessionId, point)
    setBookmarkList(list)
    showToast(list.some((bookmark) => bookmark.chatKey === point.key) ? t('bookmarked') : t('unbookmarked'))
  }

  function toggleCollapse(turn) {
    setCollapsed((previous) => ({ ...previous, [turn]: !previous[turn] }))
  }

  function setAllTurnsCollapsed(value) {
    const next = {}
    for (const point of navPoints) {
      if (point.turn != null) next[point.turn] = value
    }
    setCollapsed(next)
  }

  function startResize(event) {
    event.preventDefault()
    dragging.current = true
    const startX = event.clientX
    const startWidth = width
    const onMove = (moveEvent) => store.setWidth(startWidth + startX - moveEvent.clientX)
    const onUp = () => {
      dragging.current = false
      document.removeEventListener('pointermove', onMove)
      document.removeEventListener('pointerup', onUp)
    }
    document.addEventListener('pointermove', onMove)
    document.addEventListener('pointerup', onUp)
  }

  async function jumpToEarliest() {
    if (!session) return
    let targetKey = navPoints.at(0)?.key
    const initialSnapshot = session.getSnapshot?.()
    if (navPoints.at(0)?.turn === 1 || !initialSnapshot?.hasMore) {
      if (targetKey) navigate({ key: targetKey })
      return
    }

    setStatus(t('loading'))
    try {
      for (let attempts = 0; attempts < 40; attempts += 1) {
        const snapshot = session.getSnapshot?.()
        targetKey = snapshot?.chat?.order?.[0] || targetKey
        if (!snapshot?.hasMore) break
        if (snapshot.loadingOlder) {
          await new Promise((resolve) => setTimeout(resolve, 120))
          continue
        }
        await session.loadOlder()
        await new Promise((resolve) => setTimeout(resolve, 90))
      }
      const finalSnapshot = session.getSnapshot?.()
      targetKey = finalSnapshot?.chat?.order?.[0] || targetKey
      if (targetKey) navigate({ key: targetKey })
      else setStatus(t('top'))
    } catch {
      setStatus(t('loadFailed'))
    }
  }

  function jumpToLatest() {
    const point = navPoints.at(-1)
    if (!point) return
    navigate(point)
  }

  if (!enabled || !sessionId || !session || blank || navPoints.length === 0) return null

  const bookmarkKeys = new Set(bookmarkList.map((bookmark) => bookmark.chatKey))
  const rows = []
  for (const group of groups) {
    const isCollapsed = group.turn != null && collapsed[group.turn]
    if (group.turn != null) {
      rows.push(React.createElement(GroupHeader, {
        key: `turn-${group.turn}`,
        group,
        collapsed: isCollapsed,
        onToggle: toggleCollapse,
        onHover: (point, rect) => setPreview({ nav: point, rect }),
        onLeave: () => setPreview(null),
        t,
      }))
    }
    if (!isCollapsed) {
      for (const point of group.items) {
        rows.push(React.createElement(MarkerRow, {
          key: point.key,
          nav: point,
          active: activeKey === point.key || cursor === point.key,
          bookmarked: bookmarkKeys.has(point.key),
          onNavigate: navigate,
          onToggleBookmark: toggleBookmark,
          onHover: (pointValue, rect) => setPreview({ nav: pointValue, rect }),
          onLeave: () => setPreview(null),
          t,
        }))
      }
    }
  }

  const bookmarkRows = bookmarkList.map((bookmark) => {
    const point = navPoints.find((item) => item.key === bookmark.chatKey) || {
      key: bookmark.chatKey,
      title: bookmark.title || bookmark.chatKey,
      role: 'other',
      anchorSeq: bookmark.anchorSeq,
      preview: '',
    }
    return React.createElement(MarkerRow, {
      key: `bookmark-${bookmark.chatKey}`,
      nav: point,
      active: false,
      bookmarked: true,
      onNavigate: navigate,
      onToggleBookmark: toggleBookmark,
      onHover: (pointValue, rect) => setPreview({ nav: pointValue, rect }),
      onLeave: () => setPreview(null),
      t,
    })
  })

  const listContent = navPoints.length === 0
    ? React.createElement('div', { className: 'tlnav-empty' }, t('empty'))
    : visiblePoints.length === 0
      ? React.createElement('div', { className: 'tlnav-empty' }, t('noNodes'))
      : rows

  return React.createElement(
    React.Fragment,
    null,
    React.createElement(
      'button',
      {
        className: 'tlnav-trigger',
        type: 'button',
        'aria-label': t('open'),
        'aria-expanded': open,
        title: t('open'),
        onMouseEnter: openPanel,
        onMouseLeave: scheduleClose,
        onClick: togglePanel,
        onFocus: openPanel,
        onBlur: scheduleClose,
      },
      '‹',
    ),
    React.createElement(
      'aside',
      {
        className: 'tlnav-panel',
        'data-open': open ? 'true' : 'false',
        style: { width: `${Math.max(MIN_PANEL_WIDTH, width)}px`, '--tlnav-top': `${railTop}px` },
        role: 'complementary',
        'aria-label': t('title'),
        'aria-hidden': open ? undefined : 'true',
        inert: !open ? '' : undefined,
        onMouseEnter: openPanel,
        onMouseLeave: scheduleClose,
        onFocus: openPanel,
        onBlur: scheduleClose,
      },
      React.createElement('div', { className: 'tlnav-resizer', onPointerDown: startResize, 'aria-hidden': 'true' }),
      React.createElement(
        'div',
        { className: 'tlnav-header' },
        running ? React.createElement('span', { className: 'tlnav-running', title: t('running'), 'aria-label': t('running') }) : null,
        React.createElement(
          'button',
          {
            type: 'button',
            className: 'tlnav-btn tlnav-language',
            'data-language': lang,
            onClick: () => store.toggleLanguage(lang),
            title: lang === 'zh' ? t('switchToEnglish') : t('switchToChinese'),
            'aria-label': lang === 'zh' ? t('switchToEnglish') : t('switchToChinese'),
            'data-tooltip': lang === 'zh' ? t('switchToEnglish') : t('switchToChinese'),
          },
          React.createElement('span', { 'data-active': lang === 'zh' ? 'true' : 'false' }, '中'),
          React.createElement('span', { 'aria-hidden': 'true' }, '/'),
          React.createElement('span', { 'data-active': lang === 'en' ? 'true' : 'false' }, 'EN'),
        ),
        React.createElement('button', { type: 'button', className: 'tlnav-btn tlnav-pin', 'aria-pressed': pinned, onClick: () => setPinned((value) => !value), title: t('pin'), 'aria-label': t('pin'), 'data-tooltip': t('pin') }, '📌'),
        React.createElement('button', { type: 'button', className: 'tlnav-btn tlnav-filter', 'aria-pressed': mode === 'all', onClick: () => store.toggleFilterMode(), title: mode === 'messages' ? t('showAll') : t('showMessages'), 'aria-label': mode === 'messages' ? t('showAll') : t('showMessages'), 'data-tooltip': mode === 'messages' ? t('showAll') : t('showMessages') }, mode === 'messages' ? t('messages') : t('all')),
        React.createElement('button', { type: 'button', className: 'tlnav-btn tlnav-scroll-mode', 'aria-pressed': smooth, onClick: () => store.toggleSmooth(), title: smooth ? t('smooth') : t('jump'), 'aria-label': smooth ? t('smooth') : t('jump'), 'data-tooltip': smooth ? t('smooth') : t('jump') }, smooth ? '↝' : '↣'),
        React.createElement('button', { type: 'button', className: 'tlnav-btn tlnav-boundary', onClick: jumpToEarliest, title: t('earliest'), 'aria-label': t('earliest'), 'data-tooltip': t('earliest'), 'data-action': 'jump-earliest' }, '↑'),
        React.createElement('button', { type: 'button', className: 'tlnav-btn tlnav-boundary', onClick: jumpToLatest, title: t('latest'), 'aria-label': t('latest'), 'data-tooltip': t('latest'), 'data-action': 'jump-latest' }, '↓'),
      ),
      React.createElement('div', { className: 'tlnav-spacer', 'aria-hidden': 'true' }),
      groups.some((group) => group.turn != null)
        ? React.createElement(
          'div',
          { className: 'tlnav-turn-actions', role: 'toolbar', 'aria-label': t('turnActions') },
          React.createElement('button', { type: 'button', className: 'tlnav-turn-action', onClick: () => setAllTurnsCollapsed(false), title: t('expandAll'), 'aria-label': t('expandAll'), 'data-action': 'expand-all' }, t('expandAll')),
          React.createElement('button', { type: 'button', className: 'tlnav-turn-action', onClick: () => setAllTurnsCollapsed(true), title: t('collapseAll'), 'aria-label': t('collapseAll'), 'data-action': 'collapse-all' }, t('collapseAll')),
        )
        : null,
      React.createElement(
        'div',
        {
          className: 'tlnav-list',
          ref: listRef,
          onWheel: (event) => {
            const list = listRef.current
            if (!list || !session || !(event.deltaY < 0 && list.scrollTop <= 0)) return
            const snapshot = session.getSnapshot()
            if (navPoints.length && navPoints[0].turn === 1) { setStatus(t('top')); return }
            if (!snapshot?.hasMore) { setStatus(t('top')); return }
            if (snapshot.loadingOlder || loadingOlder.current) return
            loadingOlder.current = true
            setStatus(t('loading'))
            Promise.resolve(session.loadOlder())
              .then(() => setStatus(''))
              .catch(() => setStatus(t('loadFailed')))
              .finally(() => { loadingOlder.current = false })
          },
        },
        listContent,
      ),
      status ? React.createElement('div', { className: 'tlnav-status', role: 'status' }, status) : null,
      React.createElement(
        'div',
        { className: 'tlnav-bookmarks' },
        React.createElement('div', { className: 'tlnav-bookmarks-title' }, `★ ${t('bookmarks')} ${bookmarkList.length}`),
        bookmarkList.length
          ? React.createElement('div', { className: 'tlnav-bookmarks-list' }, bookmarkRows)
          : React.createElement(
            'div',
            { className: 'tlnav-empty' },
            React.createElement('div', null, t('noBookmarks')),
            React.createElement('div', { className: 'tlnav-empty-hint' }, t('noBookmarksHint')),
          ),
      ),
      !hintSeen ? React.createElement('div', { className: 'tlnav-hint', role: 'note' }, t('hint')) : null,
      toast ? React.createElement('div', { className: 'tlnav-toast', role: 'status' }, toast) : null,
    ),
    React.createElement(PreviewCard, { preview, t }),
  )
}

export function apply(ctx) {
  const { sessions, slots, locale } = ctx
  const style = document.createElement('style')
  style.dataset.plugin = PLUGIN_ID
  style.textContent = TIMELINE_CSS
  document.head.appendChild(style)
  ctx.effect(() => () => style.remove())

  const store = createAppStore()
  const settingsStore = defineStore({
    init: () => ({ enabled: true, language: 'auto', revision: -1 }),
    actions: {
      sync: (draft, enabled, language, revision) => {
        if (revision <= draft.revision) return
        draft.enabled = enabled
        draft.language = language
        draft.revision = revision
      },
    },
  })
  let bound = null
  let revision = 0
  const syncSettings = (enabled) => {
    bound?.sync(enabled, resolveLanguage(locale, store), revision)
    revision += 1
  }
  const injectSettings = (actions) => {
    bound = actions
    syncSettings(store.isEnabled())
    return {
      setEnabled: (enabled) => { store.setEnabled(enabled); syncSettings(enabled) },
      toggleLanguage: () => { store.toggleLanguage(resolveLanguage(locale, store)); syncSettings(store.isEnabled()) },
    }
  }

  ctx.effect(() => {
    if (typeof locale?.subscribe !== 'function') return undefined
    return locale.subscribe(() => syncSettings(store.isEnabled()))
  })

  locale.register(SETTINGS_NAMESPACE, { zh: settingsZh, en: settingsEn })

  slots.inject('shell.overlay', () => slots.register(
    { name: 'shell.overlay', id: 'timeline-navigator-rail', order: 10 },
    (props) => React.createElement(RailPanel, { sessions, locale, useSessions: props.useSessions, store }),
  ))

  slots.inject('settings.plugin.item', () => slots.register(
    { name: 'settings.plugin.item', id: 'timeline-navigator', order: 6, store: settingsStore, locale: SETTINGS_NAMESPACE, inject: injectSettings },
    SettingsCard,
  ))
}
