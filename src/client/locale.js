export const SETTINGS_NAMESPACE = 'settings.timeline-navigator'

export const settingsZh = {
  'timeline.title': '时间线导航',
  'timeline.description': '从聊天右侧快速定位消息、收藏重点，并支持搜索；打开时默认合拢各回合',
  'timeline.enable': '已开启',
  'timeline.disable': '已关闭',
}

export const settingsEn = {
  'timeline.title': 'Timeline Navigator',
  'timeline.description': 'Find, bookmark, and search messages from the right edge; turns start collapsed',
  'timeline.enable': 'On',
  'timeline.disable': 'Off',
}

export const panelDictionaries = {
  en: {
    title: 'Timeline',
    open: 'Open timeline',
    bookmarks: 'Bookmarks',
    noBookmarks: 'No bookmarks yet',
    empty: 'No conversation yet',
    notFound: 'This message is not loaded yet',
    smooth: 'Smooth scroll',
    jump: 'Direct jump',
    turnLabel: 'Turn',
    turnActions: 'Turn group actions',
    expandAll: 'Expand all turns',
    collapseAll: 'Collapse all turns',
    messages: 'Messages',
    all: 'All',
    noNodes: 'No messages in this view',
    pin: 'Keep timeline open',
    latest: 'Jump to latest',
    earliest: 'Jump to earliest',
    search: 'Search messages',
    clearSearch: 'Clear search',
    bookmark: 'Add bookmark',
    removeBookmark: 'Remove bookmark',
    bookmarked: 'Added to bookmarks',
    unbookmarked: 'Removed from bookmarks',
    running: 'Streaming',
    noSearch: 'No matching messages',
    top: 'Already at the oldest message',
    loading: 'Loading earlier messages…',
    loadFailed: 'Could not load earlier messages',
    hint: 'Hover the right edge to reopen this timeline',
    noBookmarksHint: 'Click the star on a message to save it here',
    showAll: 'Show tools and system events',
    showMessages: 'Show user and assistant messages only',
  },
  zh: {
    title: '时间线',
    open: '打开时间线',
    bookmarks: '星标',
    noBookmarks: '暂无星标',
    empty: '暂无对话内容',
    notFound: '这条消息尚未加载',
    smooth: '平滑滚动',
    jump: '直接跳转',
    turnLabel: '回合',
    turnActions: '回合操作',
    expandAll: '展开全部',
    collapseAll: '折叠全部',
    messages: '消息',
    all: '全部',
    noNodes: '当前视图没有消息',
    pin: '固定时间线',
    latest: '跳到最新消息',
    earliest: '跳到最早消息',
    search: '搜索消息',
    clearSearch: '清空搜索',
    bookmark: '添加到星标',
    removeBookmark: '取消星标',
    bookmarked: '已加入星标',
    unbookmarked: '已取消星标',
    running: '输出中',
    noSearch: '没有匹配的消息',
    top: '已经到最早消息',
    loading: '正在加载更早消息…',
    loadFailed: '更早消息加载失败',
    hint: '将鼠标移到右侧边缘，可以再次打开时间线',
    noBookmarksHint: '点击消息右侧的星标，可以收藏到这里',
    showAll: '显示工具调用和系统事件',
    showMessages: '仅显示用户和助手消息',
  },
}

export function readLanguage(locale) {
  try {
    const snapshot = locale?.getSnapshot?.()
    const id = typeof snapshot === 'string'
      ? snapshot
      : snapshot?.locale || snapshot?.id || snapshot?.current
    return typeof id === 'string' && id.startsWith('zh') ? 'zh' : 'en'
  } catch {
    return 'en'
  }
}
