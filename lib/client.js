window.__ModuleLoader__.load({
  id: "@deepseek-ai/dsh-client-ui-timeline-navigator",
  factory: (require) => {
    var module = { exports: {} };
    var exports = module.exports;
    var __create = Object.create;
    var __defProp = Object.defineProperty;
    var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
    var __getOwnPropNames = Object.getOwnPropertyNames;
    var __getProtoOf = Object.getPrototypeOf;
    var __hasOwnProp = Object.prototype.hasOwnProperty;
    var __export = (target, all) => {
      for (var name in all)
        __defProp(target, name, { get: all[name], enumerable: true });
    };
    var __copyProps = (to, from, except, desc) => {
      if (from && typeof from === "object" || typeof from === "function") {
        for (let key of __getOwnPropNames(from))
          if (!__hasOwnProp.call(to, key) && key !== except)
            __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
      }
      return to;
    };
    var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
      // If the importer is in node compatibility mode or this is not an ESM
      // file that has been converted to a CommonJS file using a Babel-
      // compatible transform (i.e. "__esModule" has not been set), then set
      // "default" to the CommonJS "module.exports" for node compatibility.
      isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
      mod
    ));
    var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
    
    // src/client/index.js
    var index_exports = {};
    __export(index_exports, {
      apply: () => apply,
      inject: () => inject
    });
    module.exports = __toCommonJS(index_exports);
    var import_react = __toESM(require("react"), 1);
    var import_client = require("@deepseek-ai/dsh-client-runtime/client");
    
    // src/client/model.js
    function clip(value, maxLength) {
      if (value == null) return "";
      const text = String(value).replace(/\s+/g, " ").trim();
      if (text.length <= maxLength) return text;
      return `${text.slice(0, Math.max(0, maxLength - 1))}\u2026`;
    }
    function blockText(block) {
      if (block == null) return "";
      if (typeof block === "string") return block;
      if (typeof block.text === "string" && block.text) return block.text;
      if (typeof block.content === "string" && block.content) return block.content;
      return "";
    }
    function extractText(value, maxLength = 220) {
      if (value == null) return "";
      if (typeof value === "string") return clip(value, maxLength);
      if (typeof value === "number" || typeof value === "boolean") return String(value);
      if (typeof value.text === "string" && value.text) return clip(value.text, maxLength);
      if (typeof value.summary === "string" && value.summary) return clip(value.summary, maxLength);
      if (typeof value.message === "string" && value.message) return clip(value.message, maxLength);
      if (typeof value.preview === "string" && value.preview) return clip(value.preview, maxLength);
      if (Array.isArray(value.blocks)) {
        const parts = [];
        for (const block of value.blocks) {
          if (!block || typeof block !== "object") continue;
          if ((block.kind === "text" || block.kind === "reasoning") && block.text) {
            parts.push(block.text);
          } else if (block.kind === "tool-call") {
            parts.push(`${block.name || "tool"}${block.argsRaw ? ` ${block.argsRaw}` : ""}`);
          }
        }
        const text = parts.join(" ").trim();
        if (text) return clip(text, maxLength);
      }
      if (Array.isArray(value.content)) {
        const text = value.content.map(blockText).filter(Boolean).join(" ").trim();
        if (text) return clip(text, maxLength);
      }
      if (typeof value.name === "string" && value.name) {
        return clip(`${value.name}${value.argsRaw ? ` ${value.argsRaw}` : ""}`, maxLength);
      }
      return "";
    }
    function kindTitle(kind, data) {
      switch (kind) {
        case "user":
          return "User";
        case "assistant-step":
          return "Assistant";
        case "tool-call":
          return data?.name || "Tool";
        case "context":
          return "Context";
        case "compaction":
        case "manual-compaction":
          return "Compaction";
        case "command":
        case "command-input":
          return data?.name ? `/${data.name}` : "Command";
        case "model-retry":
          return "Retry";
        case "steering":
          return "Steering";
        case "turn-error":
          return "Error";
        case "turn-max-tokens":
          return "Max tokens";
        case "workflow-run":
          return "Workflow";
        case "turn-tail":
          return "Turn";
        case "unknown":
          return "Unknown";
        default:
          return kind || "Node";
      }
    }
    function kindRole(kind) {
      if (kind === "user" || kind === "command-input") return "user";
      if (kind === "assistant-step") return "assistant";
      if (kind === "tool-call") return "tool";
      if (kind === "turn-error" || kind === "turn-max-tokens") return "error";
      return "other";
    }
    function isMessageRole(role) {
      return role === "user" || role === "assistant";
    }
    function locationOf(node) {
      const location = node?.location;
      if (!location) return {};
      if (location.kind === "turn" && location.turn) return { turn: location.turn.turn };
      if (location.kind === "step" && location.turn) {
        return { turn: location.turn.turn, step: location.step?.step };
      }
      return {};
    }
    function projectNavPoints(chat) {
      if (!chat || !Array.isArray(chat.order) || !chat.nodes) return [];
      const points = [];
      for (const key of chat.order) {
        const node = chat.nodes.get(key);
        if (!node || node.visibility && node.visibility !== "visible") continue;
        const location = locationOf(node);
        points.push({
          id: key,
          key,
          kind: node.kind,
          role: kindRole(node.kind),
          anchorSeq: typeof node.anchorSeq === "number" ? node.anchorSeq : 0,
          turn: location.turn,
          step: location.step,
          title: kindTitle(node.kind, node.data),
          preview: extractText(node.data),
          flags: node.kind === "turn-error" || node.kind === "turn-max-tokens" ? ["error"] : []
        });
      }
      return points;
    }
    function filterNavPoints(points, mode, query) {
      const visible = mode === "all" ? points : points.filter((point) => isMessageRole(point.role));
      const normalizedQuery = String(query || "").trim().toLocaleLowerCase();
      if (!normalizedQuery) return visible;
      return visible.filter(
        (point) => [point.title, point.preview].some((value) => String(value || "").toLocaleLowerCase().includes(normalizedQuery))
      );
    }
    function groupNavPoints(points) {
      const groups = [];
      let current = null;
      for (const point of points) {
        if (!current || current.turn !== point.turn) {
          current = { turn: point.turn, items: [] };
          groups.push(current);
        }
        current.items.push(point);
      }
      return groups;
    }
    
    // src/client/storage.js
    var STORAGE_PREFIX = "dsh-timeline-navigator";
    var ENABLED_KEY = `${STORAGE_PREFIX}:enabled:v2`;
    var PREFERENCES_KEY = `${STORAGE_PREFIX}:preferences:v1`;
    var BOOKMARKS_KEY = `${STORAGE_PREFIX}:bookmarks:v1:`;
    var MIN_PANEL_WIDTH = 280;
    var MAX_PANEL_WIDTH = 420;
    function safeStorage() {
      try {
        const storage = globalThis.localStorage;
        if (storage && typeof storage.getItem === "function" && typeof storage.setItem === "function") {
          return storage;
        }
      } catch {
      }
      return null;
    }
    function readJson(storage, key, fallback) {
      if (!storage) return fallback;
      try {
        const value = storage.getItem(key);
        return value ? JSON.parse(value) : fallback;
      } catch {
        return fallback;
      }
    }
    function writeJson(storage, key, value) {
      if (!storage) return;
      try {
        storage.setItem(key, JSON.stringify(value));
      } catch {
      }
    }
    var DEFAULT_PREFERENCES = Object.freeze({
      width: MIN_PANEL_WIDTH,
      smooth: true,
      filterMode: "messages",
      hintSeen: false,
      language: "auto"
    });
    function loadPreferences(storage = safeStorage()) {
      const raw = readJson(storage, PREFERENCES_KEY, {});
      return {
        width: clampNumber(raw?.width, MIN_PANEL_WIDTH, MAX_PANEL_WIDTH, DEFAULT_PREFERENCES.width),
        smooth: raw?.smooth !== false,
        filterMode: raw?.filterMode === "all" ? "all" : DEFAULT_PREFERENCES.filterMode,
        hintSeen: raw?.hintSeen === true,
        language: raw?.language === "zh" || raw?.language === "en" ? raw.language : DEFAULT_PREFERENCES.language
      };
    }
    function createAppStore(storage = safeStorage()) {
      const saved = loadPreferences(storage);
      const enabledRaw = readStorageValue(storage, ENABLED_KEY);
      let width = saved.width;
      let smooth = saved.smooth;
      let filterMode = saved.filterMode;
      let hintSeen = saved.hintSeen;
      let language = saved.language;
      let enabled = enabledRaw == null ? true : enabledRaw !== "false";
      const listeners = /* @__PURE__ */ new Set();
      function emit() {
        for (const listener of listeners) listener();
      }
      function persist() {
        writeJson(storage, PREFERENCES_KEY, { width, smooth, filterMode, hintSeen, language });
      }
      return {
        getWidth: () => width,
        isSmooth: () => smooth,
        getFilterMode: () => filterMode,
        getLanguage: () => language,
        isEnabled: () => enabled,
        isHintSeen: () => hintSeen,
        setWidth(value) {
          const next = clampNumber(value, MIN_PANEL_WIDTH, MAX_PANEL_WIDTH, width);
          if (next !== width) {
            width = next;
            persist();
            emit();
          }
        },
        toggleSmooth() {
          smooth = !smooth;
          persist();
          emit();
        },
        toggleFilterMode() {
          filterMode = filterMode === "messages" ? "all" : "messages";
          persist();
          emit();
        },
        toggleLanguage(currentLanguage = "en") {
          const effective = language === "zh" || language === "en" ? language : currentLanguage === "zh" ? "zh" : "en";
          const next = effective === "zh" ? "en" : "zh";
          if (language === next) return;
          language = next;
          persist();
          emit();
        },
        markHintSeen() {
          if (hintSeen) return;
          hintSeen = true;
          persist();
          emit();
        },
        setEnabled(value) {
          const next = Boolean(value);
          if (enabled === next) return;
          enabled = next;
          try {
            storage?.setItem(ENABLED_KEY, next ? "true" : "false");
          } catch {
          }
          emit();
        },
        subscribe(listener) {
          listeners.add(listener);
          return () => listeners.delete(listener);
        }
      };
    }
    function createBookmarkStore(storage = safeStorage()) {
      const memory = /* @__PURE__ */ new Map();
      function read(sessionId) {
        const fallback = memory.get(sessionId) || [];
        const value = readJson(storage, BOOKMARKS_KEY + sessionId, fallback);
        if (!Array.isArray(value)) return [];
        return value.filter((bookmark) => bookmark && typeof bookmark.chatKey === "string");
      }
      function write(sessionId, list) {
        memory.set(sessionId, list);
        writeJson(storage, BOOKMARKS_KEY + sessionId, list);
      }
      return {
        list: (sessionId) => read(sessionId),
        toggle(sessionId, point) {
          const list = read(sessionId).slice();
          const index = list.findIndex((bookmark) => bookmark.chatKey === point.key);
          if (index >= 0) list.splice(index, 1);
          else list.push({
            sessionId,
            chatKey: point.key,
            anchorSeq: point.anchorSeq,
            title: point.title,
            createdAt: Date.now()
          });
          write(sessionId, list);
          return list;
        }
      };
    }
    function clampNumber(value, min, max, fallback) {
      const number = Number(value);
      if (!Number.isFinite(number)) return fallback;
      return Math.max(min, Math.min(max, Math.round(number)));
    }
    function readStorageValue(storage, key) {
      try {
        return storage?.getItem(key) ?? null;
      } catch {
        return null;
      }
    }
    
    // src/client/dom.js
    function findScrollport() {
      return document.querySelector("[data-conversation-scroll]");
    }
    function findRow(key) {
      const scrollport = findScrollport();
      if (!scrollport || !key) return null;
      const rows = scrollport.querySelectorAll("[data-chat-anchor-key]");
      for (const row of rows) {
        if (row.dataset?.chatAnchorKey === key) return row;
      }
      return null;
    }
    function prefersReducedMotion() {
      try {
        return typeof globalThis.matchMedia === "function" && globalThis.matchMedia("(prefers-reduced-motion: reduce)").matches;
      } catch {
        return false;
      }
    }
    function scrollToKey(key, smooth) {
      const row = findRow(key);
      if (!row) return false;
      const behavior = smooth && !prefersReducedMotion() ? "smooth" : "auto";
      try {
        row.scrollIntoView({ block: "center", behavior });
      } catch {
        try {
          row.scrollIntoView(true);
        } catch {
        }
      }
      return true;
    }
    function throttle(callback, delay) {
      let last = 0;
      let timer = null;
      function run() {
        timer = null;
        last = Date.now();
        callback();
      }
      function throttled() {
        const now = Date.now();
        const remaining = delay - (now - last);
        if (remaining <= 0) {
          if (timer) clearTimeout(timer);
          timer = null;
          last = now;
          callback();
        } else if (!timer) {
          timer = setTimeout(run, remaining);
        }
      }
      throttled.cancel = () => {
        if (timer) clearTimeout(timer);
        timer = null;
      };
      return throttled;
    }
    async function locate(session, targetKey, smooth, delay = wait) {
      function inSnapshot() {
        const snapshot = session?.getSnapshot?.();
        return Boolean(snapshot?.chat?.order?.includes(targetKey));
      }
      for (let attempt = 0; attempt < 8; attempt += 1) {
        if (!inSnapshot()) break;
        if (scrollToKey(targetKey, smooth)) return true;
        await delay(50);
      }
      for (let attempt = 0; attempt < 40; attempt += 1) {
        const snapshot = session?.getSnapshot?.();
        if (inSnapshot()) {
          if (scrollToKey(targetKey, smooth)) return true;
          await delay(70);
          continue;
        }
        if (!snapshot?.hasMore || snapshot.loadingOlder) {
          if (snapshot?.loadingOlder) await delay(120);
          else break;
          continue;
        }
        try {
          await session.loadOlder();
        } catch {
          break;
        }
        await delay(90);
      }
      return scrollToKey(targetKey, smooth);
    }
    function wait(milliseconds) {
      return new Promise((resolve) => setTimeout(resolve, milliseconds));
    }
    
    // src/client/locale.js
    var SETTINGS_NAMESPACE = "settings.timeline-navigator";
    var settingsZh = {
      "timeline.title": "\u65F6\u95F4\u7EBF\u5BFC\u822A",
      "timeline.description": "\u4ECE\u804A\u5929\u53F3\u4FA7\u5FEB\u901F\u5B9A\u4F4D\u56DE\u5408\u3001\u6536\u85CF\u91CD\u70B9\uFF1B\u6253\u5F00\u65F6\u9ED8\u8BA4\u5408\u62E2\u5404\u56DE\u5408",
      "timeline.enable": "\u5DF2\u5F00\u542F",
      "timeline.disable": "\u5DF2\u5173\u95ED",
      "timeline.switchToChinese": "\u5207\u6362\u5230\u4E2D\u6587",
      "timeline.switchToEnglish": "\u5207\u6362\u5230\u82F1\u6587"
    };
    var settingsEn = {
      "timeline.title": "Timeline Navigator",
      "timeline.description": "Jump between turns and bookmark key messages from the right edge; turns start collapsed",
      "timeline.enable": "On",
      "timeline.disable": "Off",
      "timeline.switchToChinese": "Switch to Chinese",
      "timeline.switchToEnglish": "Switch to English"
    };
    var panelDictionaries = {
      en: {
        title: "Timeline",
        switchToChinese: "Switch to Chinese",
        switchToEnglish: "Switch to English",
        open: "Open timeline",
        bookmarks: "Bookmarks",
        noBookmarks: "No bookmarks yet",
        empty: "No conversation yet",
        notFound: "This message is not loaded yet",
        smooth: "Smooth scroll",
        jump: "Direct jump",
        turnLabel: "Turn",
        step: "step",
        turnActions: "Turn group actions",
        expandAll: "Expand all turns",
        collapseAll: "Collapse all turns",
        messages: "Messages",
        all: "All",
        noNodes: "No messages in this view",
        pin: "Keep timeline open",
        latest: "Jump to latest",
        earliest: "Jump to earliest",
        bookmark: "Add bookmark",
        removeBookmark: "Remove bookmark",
        bookmarked: "Added to bookmarks",
        unbookmarked: "Removed from bookmarks",
        running: "Streaming",
        top: "Already at the oldest message",
        loading: "Loading earlier messages\u2026",
        loadFailed: "Could not load earlier messages",
        hint: "Hover the right edge to reopen this timeline",
        noBookmarksHint: "Click the star on a message to save it here",
        showAll: "Show tools and system events",
        showMessages: "Show user and assistant messages only",
        user: "User",
        assistant: "Assistant",
        tool: "Tool",
        context: "Context",
        compaction: "Compaction",
        command: "Command",
        retry: "Retry",
        steering: "Steering",
        error: "Error",
        maxTokens: "Max tokens",
        workflow: "Workflow",
        turn: "Turn",
        unknown: "Unknown",
        node: "Node"
      },
      zh: {
        title: "\u65F6\u95F4\u7EBF",
        switchToChinese: "\u5207\u6362\u5230\u4E2D\u6587",
        switchToEnglish: "\u5207\u6362\u5230\u82F1\u6587",
        open: "\u6253\u5F00\u65F6\u95F4\u7EBF",
        bookmarks: "\u661F\u6807",
        noBookmarks: "\u6682\u65E0\u661F\u6807",
        empty: "\u6682\u65E0\u5BF9\u8BDD\u5185\u5BB9",
        notFound: "\u8FD9\u6761\u6D88\u606F\u5C1A\u672A\u52A0\u8F7D",
        smooth: "\u5E73\u6ED1\u6EDA\u52A8",
        jump: "\u76F4\u63A5\u8DF3\u8F6C",
        turnLabel: "\u56DE\u5408",
        step: "\u6B65\u9AA4",
        turnActions: "\u56DE\u5408\u64CD\u4F5C",
        expandAll: "\u5C55\u5F00\u5168\u90E8",
        collapseAll: "\u6298\u53E0\u5168\u90E8",
        messages: "\u6D88\u606F",
        all: "\u5168\u90E8",
        noNodes: "\u5F53\u524D\u89C6\u56FE\u6CA1\u6709\u6D88\u606F",
        pin: "\u56FA\u5B9A\u65F6\u95F4\u7EBF",
        latest: "\u8DF3\u5230\u6700\u65B0\u6D88\u606F",
        earliest: "\u8DF3\u5230\u6700\u65E9\u6D88\u606F",
        bookmark: "\u6DFB\u52A0\u5230\u661F\u6807",
        removeBookmark: "\u53D6\u6D88\u661F\u6807",
        bookmarked: "\u5DF2\u52A0\u5165\u661F\u6807",
        unbookmarked: "\u5DF2\u53D6\u6D88\u661F\u6807",
        running: "\u8F93\u51FA\u4E2D",
        top: "\u5DF2\u7ECF\u5230\u6700\u65E9\u6D88\u606F",
        loading: "\u6B63\u5728\u52A0\u8F7D\u66F4\u65E9\u6D88\u606F\u2026",
        loadFailed: "\u66F4\u65E9\u6D88\u606F\u52A0\u8F7D\u5931\u8D25",
        hint: "\u5C06\u9F20\u6807\u79FB\u5230\u53F3\u4FA7\u8FB9\u7F18\uFF0C\u53EF\u4EE5\u518D\u6B21\u6253\u5F00\u65F6\u95F4\u7EBF",
        noBookmarksHint: "\u70B9\u51FB\u6D88\u606F\u53F3\u4FA7\u7684\u661F\u6807\uFF0C\u53EF\u4EE5\u6536\u85CF\u5230\u8FD9\u91CC",
        showAll: "\u663E\u793A\u5DE5\u5177\u8C03\u7528\u548C\u7CFB\u7EDF\u4E8B\u4EF6",
        showMessages: "\u4EC5\u663E\u793A\u7528\u6237\u548C\u52A9\u624B\u6D88\u606F",
        user: "\u7528\u6237",
        assistant: "\u52A9\u624B",
        tool: "\u5DE5\u5177",
        context: "\u4E0A\u4E0B\u6587",
        compaction: "\u538B\u7F29",
        command: "\u547D\u4EE4",
        retry: "\u91CD\u8BD5",
        steering: "\u5F15\u5BFC",
        error: "\u9519\u8BEF",
        maxTokens: "\u8FBE\u5230\u4EE4\u724C\u4E0A\u9650",
        workflow: "\u5DE5\u4F5C\u6D41",
        turn: "\u56DE\u5408",
        unknown: "\u672A\u77E5",
        node: "\u8282\u70B9"
      }
    };
    function readLanguage(locale) {
      try {
        const snapshot = locale?.getSnapshot?.();
        const id = typeof snapshot === "string" ? snapshot : snapshot?.locale || snapshot?.id || snapshot?.current;
        return typeof id === "string" && id.startsWith("zh") ? "zh" : "en";
      } catch {
        return "en";
      }
    }
    
    // src/client/styles.js
    var CSS = `
    .tlnav-trigger {
      position: fixed; top: 50%; right: 0; transform: translateY(-50%);
      width: 30px; height: 72px; z-index: 49; display: flex;
      align-items: center; justify-content: center; pointer-events: auto;
      cursor: pointer; background: var(--dsw-specific-sidebar-fill);
      border: 1px solid var(--dsw-alias-border-l2); border-right: none;
      border-radius: 12px 0 0 12px; color: var(--dsw-alias-label-secondary);
      font-size: 17px; line-height: 1; opacity: .82;
      box-shadow: var(--dsw-shadow-lv1); transition: width .16s var(--ds-ease-in-out), opacity .16s var(--ds-ease-in-out), color .16s var(--ds-ease-in-out);
    }
    .tlnav-trigger:hover, .tlnav-trigger:focus-visible { width: 36px; opacity: 1; color: var(--dsw-alias-state-business-primary); outline: none; }
    .tlnav-trigger:focus-visible { box-shadow: 0 0 0 2px var(--dsw-alias-state-business-primary), var(--dsw-shadow-lv1); }
    .tlnav-panel {
      position: fixed; top: var(--tlnav-top, 0); right: 0; bottom: 0; width: 280px;
      min-width: 280px; max-width: 420px; z-index: 50; display: flex;
      flex-direction: column; background: var(--dsw-specific-sidebar-fill);
      border: 1px solid var(--dsw-alias-border-l2); border-radius: 16px 0 0 16px;
      box-shadow: var(--dsw-shadow-lv2); overflow: hidden; pointer-events: auto;
      color: var(--dsw-alias-label-primary); font-family: inherit;
      transform: translateX(100%); opacity: 0;
      transition: transform .18s var(--ds-ease-in-out), opacity .18s var(--ds-ease-in-out);
    }
    .tlnav-panel[data-open="true"] { transform: translateX(0); opacity: 1; }
    .tlnav-resizer { position: absolute; left: 0; top: 0; bottom: 0; width: 8px; cursor: col-resize; touch-action: none; z-index: 2; }
    .tlnav-resizer:hover { background: var(--dsw-alias-interactive-bg-hover); }
    .tlnav-header { display: flex; align-items: center; justify-content: flex-end; gap: 4px; padding: 10px 10px 8px 14px; border-bottom: 1px solid var(--dsw-alias-border-l2); flex: none; overflow: hidden; }
    .tlnav-running { flex: none; width: 8px; height: 8px; border-radius: 50%; background: var(--dsw-alias-state-business-primary); animation: tlnav-pulse 1.2s ease-in-out infinite; }
    @keyframes tlnav-pulse { 0%,100% { opacity: .4 } 50% { opacity: 1 } }
    .tlnav-btn { appearance: none; box-sizing: border-box; display: inline-flex; flex: none; align-items: center; justify-content: center; background: transparent; border: 1px solid transparent; border-radius: 8px; color: var(--dsw-alias-label-secondary); cursor: pointer; padding: 4px 6px; font: var(--dsw-font-xxs-12); white-space: nowrap; }
    .tlnav-btn:hover, .tlnav-btn:focus-visible { background: var(--dsw-alias-interactive-bg-hover); color: var(--dsw-alias-label-primary); outline: none; }
    .tlnav-btn:focus-visible { box-shadow: 0 0 0 2px var(--dsw-alias-state-business-primary); }
    .tlnav-language { width: 42px; gap: 2px; padding-inline: 0; font-size: 11px; }
    .tlnav-language span { opacity: .55; }
    .tlnav-language span[data-active="true"] { opacity: 1; color: var(--dsw-alias-state-business-primary); font-weight: 600; }
    .tlnav-pin, .tlnav-scroll-mode { width: 32px; }
    .tlnav-filter { width: 62px; padding-inline: 2px; }
    .tlnav-boundary { width: 28px; }
    .tlnav-btn[data-on="true"] { color: var(--dsw-alias-state-business-primary); border-color: var(--dsw-alias-state-business-primary); }
    .tlnav-btn[data-tooltip] { position: relative; }
    .tlnav-btn[data-tooltip]::after { content: attr(data-tooltip); position: absolute; top: calc(100% + 6px); right: 0; z-index: 90; max-width: 220px; padding: 5px 8px; border: 1px solid var(--dsw-alias-border-l2); border-radius: 6px; background: var(--dsw-alias-bg-layer-1); color: var(--dsw-alias-label-primary); box-shadow: var(--dsw-shadow-lv1); font: var(--dsw-font-xxs-12); line-height: 16px; white-space: nowrap; pointer-events: none; opacity: 0; transform: translateY(-2px); transition: opacity .12s ease, transform .12s ease; }
    .tlnav-btn[data-tooltip]:hover::after, .tlnav-btn[data-tooltip]:focus-visible::after { opacity: 1; transform: translateY(0); }
    .tlnav-spacer { flex: none; height: 8px; }
    .tlnav-turn-actions { display: flex; gap: 6px; padding: 6px 8px; border-bottom: 1px solid var(--dsw-alias-border-l2); background: var(--dsw-alias-bg-layer-1); }
    .tlnav-turn-action { appearance: none; flex: 1; min-width: 0; padding: 5px 6px; border: 1px solid var(--dsw-alias-border-l2); border-radius: 7px; background: transparent; color: var(--dsw-alias-label-secondary); cursor: pointer; font: var(--dsw-font-xxs-12); white-space: nowrap; }
    .tlnav-turn-action:hover, .tlnav-turn-action:focus-visible { background: var(--dsw-alias-interactive-bg-hover); color: var(--dsw-alias-label-primary); outline: none; }
    .tlnav-turn-action:focus-visible { box-shadow: 0 0 0 2px var(--dsw-alias-state-business-primary); }
    .tlnav-list { flex: 1; overflow-y: auto; overflow-x: hidden; padding: 6px 6px 16px; overscroll-behavior: contain; }
    .tlnav-turn { position: relative; z-index: 0; display: flex; align-items: center; gap: 6px; padding: 8px 8px 4px; font: var(--dsw-font-xxs-12); color: var(--dsw-alias-label-caption); cursor: pointer; user-select: none; background: var(--dsw-specific-sidebar-fill); border-radius: 8px; }
    .tlnav-turn:hover, .tlnav-turn:focus-visible { color: var(--dsw-alias-label-secondary); background: var(--dsw-alias-interactive-bg-hover); outline: none; }
    .tlnav-turn:focus-visible { box-shadow: 0 0 0 2px var(--dsw-alias-state-business-primary); }
    .tlnav-turn-caret { width: 8px; font-size: 9px; }
    .tlnav-turn-count { opacity: .75; }
    .tlnav-marker { position: relative; z-index: 2; display: flex; align-items: center; gap: 2px; width: 100%; border-radius: 8px; }
    .tlnav-marker:hover, .tlnav-marker[data-active="true"] { background: var(--dsw-alias-interactive-bg-hover); }
    .tlnav-marker[data-active="true"] { box-shadow: inset 2px 0 0 var(--dsw-alias-state-business-primary); }
    .tlnav-marker-main { display: flex; align-items: center; gap: 7px; flex: 1; min-width: 0; width: 100%; text-align: left; padding: 6px 6px 6px 8px; border: none; background: transparent; color: var(--dsw-alias-label-primary); cursor: pointer; border-radius: 8px; font: var(--dsw-font-xs-13); }
    .tlnav-marker-main:hover, .tlnav-marker-main:focus-visible { background: var(--dsw-alias-interactive-bg-hover); outline: none; }
    .tlnav-marker-main:focus-visible { box-shadow: 0 0 0 2px var(--dsw-alias-state-business-primary); }
    .tlnav-marker[data-active="true"] { background: var(--dsw-alias-interactive-bg-hover); box-shadow: inset 2px 0 0 var(--dsw-alias-state-business-primary); }
    .tlnav-dot { flex: none; width: 8px; height: 8px; border-radius: 50%; }
    .tlnav-dot[data-role="user"] { background: #3b82f6; }
    .tlnav-dot[data-role="assistant"] { background: #10b981; }
    .tlnav-dot[data-role="tool"] { background: #8b5cf6; }
    .tlnav-dot[data-role="error"] { background: #ef4444; }
    .tlnav-dot[data-role="other"] { background: var(--dsw-alias-label-caption); }
    .tlnav-step { flex: none; min-width: 14px; text-align: center; font: var(--dsw-font-xxxs-11); color: var(--dsw-alias-label-caption); }
    .tlnav-label { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .tlnav-star { flex: none; font-size: 12px; line-height: 1; color: var(--dsw-alias-label-caption); }
    .tlnav-star[data-on="true"] { color: #f59e0b; }
    .tlnav-star-button { flex: none; display: inline-flex; align-items: center; justify-content: center; width: 28px; height: 28px; padding: 0; border: 1px solid transparent; border-radius: 7px; background: transparent; color: var(--dsw-alias-label-caption); cursor: pointer; }
    .tlnav-star-button:hover, .tlnav-star-button:focus-visible { background: var(--dsw-alias-interactive-bg-hover); color: #f59e0b; outline: none; }
    .tlnav-star-button:focus-visible { box-shadow: 0 0 0 2px var(--dsw-alias-state-business-primary); }
    .tlnav-star-button[aria-pressed="true"] { color: #f59e0b; }
    .tlnav-bookmarks { border-top: 1px solid var(--dsw-alias-border-l2); flex: none; max-height: 34%; display: flex; flex-direction: column; }
    .tlnav-bookmarks-title { padding: 8px 12px 4px; font: var(--dsw-font-xxs-12); color: var(--dsw-alias-label-caption); }
    .tlnav-bookmarks-list { overflow-y: auto; padding: 0 6px 6px; }
    .tlnav-empty { padding: 12px; font: var(--dsw-font-xs-13); color: var(--dsw-alias-label-caption); line-height: 18px; }
    .tlnav-empty-hint { margin-top: 3px; color: var(--dsw-alias-label-tertiary); font: var(--dsw-font-xxs-12); line-height: 16px; }
    .tlnav-status { padding: 6px 12px; color: var(--dsw-alias-state-error-primary); font: var(--dsw-font-xxs-12); }
    .tlnav-toast { position: absolute; left: 50%; bottom: 14px; transform: translateX(-50%); background: var(--dsw-alias-bg-layer-1); border: 1px solid var(--dsw-alias-border-l2); color: var(--dsw-alias-label-primary); border-radius: 8px; padding: 6px 12px; box-shadow: var(--dsw-shadow-lv2); z-index: 60; pointer-events: none; white-space: nowrap; font: var(--dsw-font-xxs-12); }
    .tlnav-preview-fixed { background: var(--dsw-alias-bg-layer-1); border: 1px solid var(--dsw-alias-border-l2); border-radius: 8px; box-shadow: 0 6px 24px rgba(0,0,0,.16); padding: 8px 10px; color: var(--dsw-alias-label-primary); word-break: break-word; font: var(--dsw-font-xs-13); }
    .tlnav-preview-title { font: var(--dsw-font-s-strong-14); margin-bottom: 4px; }
    .tlnav-preview-text { color: var(--dsw-alias-label-secondary); white-space: pre-wrap; max-height: 180px; overflow: hidden; }
    .tlnav-preview-meta { margin-top: 6px; color: var(--dsw-alias-label-caption); font: var(--dsw-font-xxs-12); }
    .tlnav-hint { padding: 8px 12px; border-top: 1px solid var(--dsw-alias-border-l2); color: var(--dsw-alias-label-caption); font: var(--dsw-font-xxs-12); line-height: 16px; }
    .tlnav-card { border: 1px solid var(--dsw-alias-border-l2); background: var(--dsw-alias-bg-layer-1); border-radius: 12px; justify-content: space-between; align-items: center; gap: 16px; padding: 16px; display: flex; }
    .tlnav-card-text { flex-direction: column; gap: 2px; min-width: 0; display: flex; }
    .tlnav-card-title { color: var(--dsw-alias-label-primary); font-size: 14px; font-weight: 500; line-height: 22px; }
    .tlnav-card-desc { color: var(--dsw-alias-label-tertiary); font-size: 12px; line-height: 18px; }
    .tlnav-card-actions { display: inline-flex; align-items: center; gap: 8px; flex: none; }
    .tlnav-card-language { appearance: none; border: 1px solid var(--dsw-alias-border-l2); height: 28px; color: var(--dsw-alias-label-secondary); cursor: pointer; background: transparent; border-radius: 14px; padding: 0 8px; font-size: 12px; line-height: 18px; white-space: nowrap; }
    .tlnav-card-language span { opacity: .55; }
    .tlnav-card-language span[data-active="true"] { opacity: 1; color: var(--dsw-alias-state-business-primary); font-weight: 600; }
    .tlnav-card-language:hover, .tlnav-card-language:focus-visible { background: var(--dsw-alias-interactive-bg-hover); outline: none; }
    .tlnav-card-language:focus-visible { box-shadow: 0 0 0 2px var(--dsw-alias-state-business-primary); }
    .tlnav-card-toggle { border: 1px solid var(--dsw-alias-border-l2); height: 28px; color: var(--dsw-alias-label-primary); cursor: pointer; background: transparent; border-radius: 14px; flex: none; align-items: center; gap: 6px; padding: 0 10px 0 6px; font-size: 12px; line-height: 18px; display: inline-flex; }
    .tlnav-card-toggle:hover, .tlnav-card-toggle:focus-visible { background: var(--dsw-alias-interactive-bg-hover); outline: none; }
    .tlnav-card-toggle:focus-visible { box-shadow: 0 0 0 2px var(--dsw-alias-state-business-primary); }
    .tlnav-card-toggle[aria-pressed="true"] { background: var(--dsw-alias-state-business-tertiary); color: var(--dsw-alias-state-business-primary); border-color: transparent; }
    .tlnav-card-check { justify-content: center; align-items: center; width: 16px; height: 16px; display: inline-flex; }
    @media (max-width: 720px) {
      .tlnav-panel { top: auto; left: 0; right: 0; bottom: 0; width: 100%; max-width: none; height: min(68vh, 560px); border-radius: 16px 16px 0 0; border-bottom: none; transform: translateY(100%); }
      .tlnav-panel[data-open="true"] { transform: translateY(0); }
      .tlnav-trigger { top: auto; bottom: 88px; transform: none; width: 40px; height: 42px; border-radius: 12px 0 0 12px; }
      .tlnav-trigger:hover, .tlnav-trigger:focus-visible { width: 46px; }
    }
    @media (max-width: 520px) {
      .tlnav-card { align-items: flex-start; flex-direction: column; gap: 10px; }
      .tlnav-card-actions { align-self: flex-end; }
    }
    @media (prefers-reduced-motion: reduce) {
      .tlnav-panel, .tlnav-trigger, .tlnav-btn[data-tooltip]::after { transition: none; }
      .tlnav-running { animation: none; }
    }
    `;
    
    // src/client/index.js
    var PLUGIN_ID = "@deepseek-ai/dsh-client-ui-timeline-navigator";
    var inject = ["sessions", "slots", "locale"];
    function escapeAttributeValue(value) {
      return String(value).replace(/[\\\"]/g, "\\\\$&");
    }
    var selectChat = (state) => state?.chat;
    var selectBlank = (state) => Boolean(state?.blank);
    var selectRunning = (state) => Boolean(state?.running);
    function useStoreValue(store, selector) {
      const [value, setValue] = import_react.default.useState(() => selector(store));
      import_react.default.useEffect(() => store.subscribe(() => setValue(selector(store))), [store, selector]);
      return value;
    }
    function useBindingSelection(session, selector) {
      const [value, setValue] = import_react.default.useState(() => session ? selector(session.getSnapshot()) : void 0);
      import_react.default.useEffect(() => {
        if (!session) {
          setValue(void 0);
          return void 0;
        }
        setValue(selector(session.getSnapshot()));
        return session.subscribe(() => setValue(selector(session.getSnapshot())));
      }, [session, selector]);
      return value;
    }
    function resolveLanguage(locale, store) {
      const preference = store?.getLanguage?.();
      return preference === "zh" || preference === "en" ? preference : readLanguage(locale);
    }
    function useLanguage(locale, store) {
      const [language, setLanguage] = import_react.default.useState(() => resolveLanguage(locale, store));
      import_react.default.useEffect(() => {
        const update = () => setLanguage(resolveLanguage(locale, store));
        update();
        const unsubscribeLocale = typeof locale?.subscribe === "function" ? locale.subscribe(update) : void 0;
        const unsubscribeStore = typeof store?.subscribe === "function" ? store.subscribe(update) : void 0;
        return () => {
          if (typeof unsubscribeLocale === "function") unsubscribeLocale();
          if (typeof unsubscribeStore === "function") unsubscribeStore();
        };
      }, [locale, store]);
      return language;
    }
    function localizeNavTitle(nav, t) {
      const titleKeys = {
        user: "user",
        "assistant-step": "assistant",
        context: "context",
        compaction: "compaction",
        "manual-compaction": "compaction",
        retry: "retry",
        "model-retry": "retry",
        steering: "steering",
        "turn-error": "error",
        "turn-max-tokens": "maxTokens",
        "workflow-run": "workflow",
        "turn-tail": "turn",
        unknown: "unknown"
      };
      const key = titleKeys[nav.kind];
      if (key) return t(key);
      if (nav.kind === "tool-call") return nav.title === "Tool" ? t("tool") : nav.title;
      if (nav.kind === "command" || nav.kind === "command-input") return nav.title?.startsWith("/") ? nav.title : t("command");
      return nav.title || t("node");
    }
    function SettingsCard(props) {
      const enabled = props.useStore((state) => state.enabled);
      const languagePreference = props.useStore((state) => state.language);
      const language = languagePreference === "zh" || languagePreference === "en" ? languagePreference : void 0;
      const t = language ? (key) => (language === "zh" ? settingsZh : settingsEn)[key] || props.t(key) : props.t;
      return import_react.default.createElement(
        "li",
        { className: "tlnav-card" },
        import_react.default.createElement(
          "div",
          { className: "tlnav-card-text" },
          import_react.default.createElement("div", { className: "tlnav-card-title" }, t("timeline.title")),
          import_react.default.createElement("div", { className: "tlnav-card-desc" }, t("timeline.description"))
        ),
        import_react.default.createElement(
          "div",
          { className: "tlnav-card-actions" },
          import_react.default.createElement(
            "button",
            {
              type: "button",
              className: "tlnav-card-language",
              "aria-label": language === "zh" ? t("timeline.switchToEnglish") : t("timeline.switchToChinese"),
              title: language === "zh" ? t("timeline.switchToEnglish") : t("timeline.switchToChinese"),
              onClick: props.toggleLanguage
            },
            import_react.default.createElement("span", { "data-active": language === "zh" ? "true" : "false" }, "\u4E2D"),
            import_react.default.createElement("span", { "aria-hidden": "true" }, "/"),
            import_react.default.createElement("span", { "data-active": language === "en" ? "true" : "false" }, "EN")
          ),
          import_react.default.createElement(
            "button",
            {
              type: "button",
              className: "tlnav-card-toggle",
              "aria-pressed": enabled,
              "aria-label": `${t("timeline.title")}: ${enabled ? t("timeline.enable") : t("timeline.disable")}`,
              onClick: () => props.setEnabled(!enabled)
            },
            import_react.default.createElement("span", { className: "tlnav-card-check", "aria-hidden": "true" }, enabled ? "\u2713" : ""),
            enabled ? t("timeline.enable") : t("timeline.disable")
          )
        )
      );
    }
    function MarkerRow({ nav, active, bookmarked, onNavigate, onToggleBookmark, onHover, onLeave, t }) {
      const longTimer = import_react.default.useRef(null);
      const longTriggered = import_react.default.useRef(false);
      const title = localizeNavTitle(nav, t);
      function startPress(event) {
        event.stopPropagation();
        longTriggered.current = false;
        if (event.pointerType === "mouse") return;
        longTimer.current = setTimeout(() => {
          longTriggered.current = true;
          onToggleBookmark(nav);
        }, 520);
      }
      function endPress() {
        if (longTimer.current) clearTimeout(longTimer.current);
        longTimer.current = null;
      }
      import_react.default.useEffect(() => () => {
        if (longTimer.current) clearTimeout(longTimer.current);
      }, []);
      return import_react.default.createElement(
        "div",
        {
          className: "tlnav-marker",
          "data-key": nav.key,
          "data-active": active ? "true" : "false",
          "data-role": nav.role,
          onMouseEnter: (event) => onHover(nav, event.currentTarget.getBoundingClientRect()),
          onMouseLeave: onLeave,
          onFocus: (event) => onHover(nav, event.currentTarget.getBoundingClientRect()),
          onBlur: onLeave
        },
        import_react.default.createElement(
          "button",
          {
            className: "tlnav-marker-main",
            type: "button",
            "aria-label": `${nav.turn != null ? `${t("turnLabel")} ${nav.turn} \xB7 ` : ""}${title}`,
            "aria-current": active ? "location" : void 0,
            title: nav.preview || title,
            onPointerDown: startPress,
            onPointerUp: endPress,
            onPointerLeave: endPress,
            onPointerCancel: endPress,
            onClick: (event) => {
              event.stopPropagation();
              if (longTriggered.current) {
                longTriggered.current = false;
                return;
              }
              onNavigate(nav);
            }
          },
          import_react.default.createElement("span", { className: "tlnav-dot", "data-role": nav.role, "aria-hidden": "true" }),
          nav.step != null ? import_react.default.createElement("span", { className: "tlnav-step", "aria-hidden": "true" }, String(nav.step)) : null,
          import_react.default.createElement("span", { className: "tlnav-label" }, title)
        ),
        import_react.default.createElement(
          "button",
          {
            className: "tlnav-star-button",
            type: "button",
            "aria-pressed": bookmarked,
            "aria-label": bookmarked ? t("removeBookmark") : t("bookmark"),
            title: bookmarked ? t("removeBookmark") : t("bookmark"),
            onClick: (event) => {
              event.stopPropagation();
              onToggleBookmark(nav);
            }
          },
          import_react.default.createElement("span", { className: "tlnav-star", "data-on": bookmarked ? "true" : "false", "aria-hidden": "true" }, bookmarked ? "\u2605" : "\u2606")
        )
      );
    }
    function PreviewCard({ preview, t }) {
      if (!preview) return null;
      const width = 280;
      const height = typeof window === "undefined" ? 800 : window.innerHeight;
      const left = Math.max(8, preview.rect.left - width - 10);
      const top = Math.max(8, Math.min(preview.rect.top, height - 240));
      return import_react.default.createElement(
        "div",
        {
          className: "tlnav-preview-fixed",
          style: { position: "fixed", left, top, width, maxWidth: "70vw", zIndex: 70, pointerEvents: "none" },
          role: "tooltip"
        },
        import_react.default.createElement("div", { className: "tlnav-preview-title" }, localizeNavTitle(preview.nav, t)),
        preview.nav.preview ? import_react.default.createElement("div", { className: "tlnav-preview-text" }, preview.nav.preview) : null,
        preview.nav.turn != null ? import_react.default.createElement("div", { className: "tlnav-preview-meta" }, `${t("turnLabel")} ${preview.nav.turn}${preview.nav.step != null ? ` \xB7 ${t("step")} ${preview.nav.step}` : ""}`) : null
      );
    }
    function GroupHeader({ group, collapsed, onToggle, onHover, onLeave, t }) {
      const firstPoint = group.items.find((point) => point.role === "user") || group.items[0];
      const activate = (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onToggle(group.turn);
        }
      };
      return import_react.default.createElement(
        "div",
        {
          className: "tlnav-turn",
          role: "button",
          tabIndex: 0,
          "aria-expanded": !collapsed,
          onClick: () => onToggle(group.turn),
          onKeyDown: activate,
          onMouseEnter: (event) => firstPoint && onHover(firstPoint, event.currentTarget.getBoundingClientRect()),
          onMouseLeave: onLeave,
          onFocus: (event) => firstPoint && onHover(firstPoint, event.currentTarget.getBoundingClientRect()),
          onBlur: onLeave
        },
        import_react.default.createElement("span", { className: "tlnav-turn-caret", "aria-hidden": "true" }, collapsed ? "\u25B8" : "\u25BE"),
        import_react.default.createElement("span", null, `${t("turnLabel")} ${group.turn}`),
        import_react.default.createElement("span", { className: "tlnav-turn-count" }, `${group.items.length} ${t("messages")}`)
      );
    }
    function initialCollapsedTurns(points) {
      const collapsed = {};
      for (const point of points) {
        if (point.turn != null) collapsed[point.turn] = true;
      }
      return collapsed;
    }
    function RailPanel({ sessions, locale, useSessions, store }) {
      const storage = import_react.default.useMemo(() => safeStorage(), []);
      const bookmarks = import_react.default.useMemo(() => createBookmarkStore(storage), [storage]);
      const lang = useLanguage(locale, store);
      const t = import_react.default.useCallback((key) => panelDictionaries[lang]?.[key] || key, [lang]);
      const width = useStoreValue(store, store.getWidth);
      const smooth = useStoreValue(store, store.isSmooth);
      const mode = useStoreValue(store, store.getFilterMode);
      const enabled = useStoreValue(store, store.isEnabled);
      const hintSeen = useStoreValue(store, store.isHintSeen);
      const sessionId = useSessions((state) => state?.current);
      const binding = sessionId ? sessions.binding(sessionId) : void 0;
      const session = binding?.session;
      const chat = useBindingSelection(session, selectChat);
      const blank = useBindingSelection(session, selectBlank);
      const running = useBindingSelection(session, selectRunning);
      const navPoints = import_react.default.useMemo(() => projectNavPoints(chat), [chat]);
      const [open, setOpen] = import_react.default.useState(false);
      const [pinned, setPinned] = import_react.default.useState(false);
      const [activeKey, setActiveKey] = import_react.default.useState(null);
      const [cursor, setCursor] = import_react.default.useState(null);
      const [preview, setPreview] = import_react.default.useState(null);
      const [status, setStatus] = import_react.default.useState("");
      const [toast, setToast] = import_react.default.useState("");
      const [collapsed, setCollapsed] = import_react.default.useState({});
      const [bookmarkList, setBookmarkList] = import_react.default.useState(() => sessionId ? bookmarks.list(sessionId) : []);
      const [railTop, setRailTop] = import_react.default.useState(0);
      const initialCollapseApplied = import_react.default.useRef(navPoints.length > 0);
      const listRef = import_react.default.useRef(null);
      const closeTimer = import_react.default.useRef(null);
      const toastTimer = import_react.default.useRef(null);
      const dragging = import_react.default.useRef(false);
      const loadingOlder = import_react.default.useRef(false);
      const visiblePoints = import_react.default.useMemo(() => filterNavPoints(navPoints, mode, ""), [navPoints, mode]);
      const groups = import_react.default.useMemo(() => groupNavPoints(visiblePoints), [visiblePoints]);
      import_react.default.useEffect(() => {
        if (!sessionId) return void 0;
        setBookmarkList(bookmarks.list(sessionId));
        setCursor(null);
        setActiveKey(null);
        setStatus("");
        initialCollapseApplied.current = false;
        setCollapsed(initialCollapsedTurns(navPoints));
        setOpen(false);
        setPinned(false);
        setPreview(null);
        return void 0;
      }, [sessionId, bookmarks]);
      import_react.default.useEffect(() => {
        if (!navPoints.length || initialCollapseApplied.current) return;
        initialCollapseApplied.current = true;
        setCollapsed(initialCollapsedTurns(navPoints));
      }, [navPoints]);
      import_react.default.useEffect(() => {
        const measure = () => {
          const scrollport = findScrollport();
          if (scrollport) setRailTop(Math.max(0, scrollport.getBoundingClientRect().top));
        };
        measure();
        const timer = setTimeout(measure, 250);
        window.addEventListener("resize", measure);
        return () => {
          clearTimeout(timer);
          window.removeEventListener("resize", measure);
        };
      }, []);
      import_react.default.useEffect(() => () => {
        if (closeTimer.current) clearTimeout(closeTimer.current);
        if (toastTimer.current) clearTimeout(toastTimer.current);
      }, []);
      import_react.default.useEffect(() => {
        if (!open) return void 0;
        const scrollport = findScrollport();
        if (!scrollport) return void 0;
        const compute = () => {
          const top = scrollport.getBoundingClientRect().top;
          const line = top + Math.min(180, scrollport.clientHeight * 0.35);
          const rows2 = scrollport.querySelectorAll("[data-chat-anchor-key]");
          let current = null;
          for (const row of rows2) {
            const rect = row.getBoundingClientRect();
            if (rect.top <= line && rect.bottom > top) current = row.dataset.chatAnchorKey;
          }
          setActiveKey(current);
          if (current && listRef.current) {
            const item = listRef.current.querySelector(`[data-key="${escapeAttributeValue(current)}"]`);
            item?.scrollIntoView?.({ block: "nearest" });
          }
        };
        const onScroll = throttle(compute, 120);
        compute();
        scrollport.addEventListener("scroll", onScroll, { passive: true });
        window.addEventListener("resize", onScroll);
        const observer = new MutationObserver(onScroll);
        observer.observe(scrollport, { childList: true, subtree: true });
        return () => {
          scrollport.removeEventListener("scroll", onScroll);
          window.removeEventListener("resize", onScroll);
          onScroll.cancel?.();
          observer.disconnect();
        };
      }, [open, navPoints]);
      const navigate = import_react.default.useCallback((point) => {
        if (!session) return;
        setCursor(point.key);
        setStatus("");
        locate(session, point.key, smooth).then((found) => {
          if (!found) setStatus(t("notFound"));
        });
      }, [session, smooth, t]);
      import_react.default.useEffect(() => {
        if (!open) return void 0;
        const onKey = (event) => {
          if (event.key !== "Escape") return;
          event.preventDefault();
          closeNow();
        };
        document.addEventListener("keydown", onKey, true);
        return () => document.removeEventListener("keydown", onKey, true);
      }, [open]);
      function openPanel() {
        if (closeTimer.current) clearTimeout(closeTimer.current);
        setOpen(true);
        if (!hintSeen) setTimeout(() => store.markHintSeen(), 4e3);
      }
      function togglePanel() {
        if (open) closeNow();
        else openPanel();
      }
      function scheduleClose() {
        if (dragging.current || pinned) return;
        if (closeTimer.current) clearTimeout(closeTimer.current);
        closeTimer.current = setTimeout(() => {
          setOpen(false);
          setPreview(null);
        }, 260);
      }
      function closeNow() {
        if (closeTimer.current) clearTimeout(closeTimer.current);
        setOpen(false);
        setPinned(false);
        setPreview(null);
      }
      function showToast(message) {
        setToast(message);
        if (toastTimer.current) clearTimeout(toastTimer.current);
        toastTimer.current = setTimeout(() => setToast(""), 1600);
      }
      function toggleBookmark(point) {
        if (!sessionId) return;
        const list = bookmarks.toggle(sessionId, point);
        setBookmarkList(list);
        showToast(list.some((bookmark) => bookmark.chatKey === point.key) ? t("bookmarked") : t("unbookmarked"));
      }
      function toggleCollapse(turn) {
        setCollapsed((previous) => ({ ...previous, [turn]: !previous[turn] }));
      }
      function setAllTurnsCollapsed(value) {
        const next = {};
        for (const point of navPoints) {
          if (point.turn != null) next[point.turn] = value;
        }
        setCollapsed(next);
      }
      function startResize(event) {
        event.preventDefault();
        dragging.current = true;
        const startX = event.clientX;
        const startWidth = width;
        const onMove = (moveEvent) => store.setWidth(startWidth + startX - moveEvent.clientX);
        const onUp = () => {
          dragging.current = false;
          document.removeEventListener("pointermove", onMove);
          document.removeEventListener("pointerup", onUp);
        };
        document.addEventListener("pointermove", onMove);
        document.addEventListener("pointerup", onUp);
      }
      async function jumpToEarliest() {
        if (!session) return;
        let targetKey = navPoints.at(0)?.key;
        const initialSnapshot = session.getSnapshot?.();
        if (navPoints.at(0)?.turn === 1 || !initialSnapshot?.hasMore) {
          if (targetKey) navigate({ key: targetKey });
          return;
        }
        setStatus(t("loading"));
        try {
          for (let attempts = 0; attempts < 40; attempts += 1) {
            const snapshot = session.getSnapshot?.();
            targetKey = snapshot?.chat?.order?.[0] || targetKey;
            if (!snapshot?.hasMore) break;
            if (snapshot.loadingOlder) {
              await new Promise((resolve) => setTimeout(resolve, 120));
              continue;
            }
            await session.loadOlder();
            await new Promise((resolve) => setTimeout(resolve, 90));
          }
          const finalSnapshot = session.getSnapshot?.();
          targetKey = finalSnapshot?.chat?.order?.[0] || targetKey;
          if (targetKey) navigate({ key: targetKey });
          else setStatus(t("top"));
        } catch {
          setStatus(t("loadFailed"));
        }
      }
      function jumpToLatest() {
        const point = navPoints.at(-1);
        if (!point) return;
        navigate(point);
      }
      if (!enabled || !sessionId || !session || blank || navPoints.length === 0) return null;
      const bookmarkKeys = new Set(bookmarkList.map((bookmark) => bookmark.chatKey));
      const rows = [];
      for (const group of groups) {
        const isCollapsed = group.turn != null && collapsed[group.turn];
        if (group.turn != null) {
          rows.push(import_react.default.createElement(GroupHeader, {
            key: `turn-${group.turn}`,
            group,
            collapsed: isCollapsed,
            onToggle: toggleCollapse,
            onHover: (point, rect) => setPreview({ nav: point, rect }),
            onLeave: () => setPreview(null),
            t
          }));
        }
        if (!isCollapsed) {
          for (const point of group.items) {
            rows.push(import_react.default.createElement(MarkerRow, {
              key: point.key,
              nav: point,
              active: activeKey === point.key || cursor === point.key,
              bookmarked: bookmarkKeys.has(point.key),
              onNavigate: navigate,
              onToggleBookmark: toggleBookmark,
              onHover: (pointValue, rect) => setPreview({ nav: pointValue, rect }),
              onLeave: () => setPreview(null),
              t
            }));
          }
        }
      }
      const bookmarkRows = bookmarkList.map((bookmark) => {
        const point = navPoints.find((item) => item.key === bookmark.chatKey) || {
          key: bookmark.chatKey,
          title: bookmark.title || bookmark.chatKey,
          role: "other",
          anchorSeq: bookmark.anchorSeq,
          preview: ""
        };
        return import_react.default.createElement(MarkerRow, {
          key: `bookmark-${bookmark.chatKey}`,
          nav: point,
          active: false,
          bookmarked: true,
          onNavigate: navigate,
          onToggleBookmark: toggleBookmark,
          onHover: (pointValue, rect) => setPreview({ nav: pointValue, rect }),
          onLeave: () => setPreview(null),
          t
        });
      });
      const listContent = navPoints.length === 0 ? import_react.default.createElement("div", { className: "tlnav-empty" }, t("empty")) : visiblePoints.length === 0 ? import_react.default.createElement("div", { className: "tlnav-empty" }, t("noNodes")) : rows;
      return import_react.default.createElement(
        import_react.default.Fragment,
        null,
        import_react.default.createElement(
          "button",
          {
            className: "tlnav-trigger",
            type: "button",
            "aria-label": t("open"),
            "aria-expanded": open,
            title: t("open"),
            onMouseEnter: openPanel,
            onMouseLeave: scheduleClose,
            onClick: togglePanel,
            onFocus: openPanel,
            onBlur: scheduleClose
          },
          "\u2039"
        ),
        import_react.default.createElement(
          "aside",
          {
            className: "tlnav-panel",
            "data-open": open ? "true" : "false",
            style: { width: `${Math.max(MIN_PANEL_WIDTH, width)}px`, "--tlnav-top": `${railTop}px` },
            role: "complementary",
            "aria-label": t("title"),
            "aria-hidden": open ? void 0 : "true",
            inert: !open ? "" : void 0,
            onMouseEnter: openPanel,
            onMouseLeave: scheduleClose,
            onFocus: openPanel,
            onBlur: scheduleClose
          },
          import_react.default.createElement("div", { className: "tlnav-resizer", onPointerDown: startResize, "aria-hidden": "true" }),
          import_react.default.createElement(
            "div",
            { className: "tlnav-header" },
            running ? import_react.default.createElement("span", { className: "tlnav-running", title: t("running"), "aria-label": t("running") }) : null,
            import_react.default.createElement(
              "button",
              {
                type: "button",
                className: "tlnav-btn tlnav-language",
                "data-language": lang,
                onClick: () => store.toggleLanguage(lang),
                title: lang === "zh" ? t("switchToEnglish") : t("switchToChinese"),
                "aria-label": lang === "zh" ? t("switchToEnglish") : t("switchToChinese"),
                "data-tooltip": lang === "zh" ? t("switchToEnglish") : t("switchToChinese")
              },
              import_react.default.createElement("span", { "data-active": lang === "zh" ? "true" : "false" }, "\u4E2D"),
              import_react.default.createElement("span", { "aria-hidden": "true" }, "/"),
              import_react.default.createElement("span", { "data-active": lang === "en" ? "true" : "false" }, "EN")
            ),
            import_react.default.createElement("button", { type: "button", className: "tlnav-btn tlnav-pin", "aria-pressed": pinned, onClick: () => setPinned((value) => !value), title: t("pin"), "aria-label": t("pin"), "data-tooltip": t("pin") }, "\u{1F4CC}"),
            import_react.default.createElement("button", { type: "button", className: "tlnav-btn tlnav-filter", "aria-pressed": mode === "all", onClick: () => store.toggleFilterMode(), title: mode === "messages" ? t("showAll") : t("showMessages"), "aria-label": mode === "messages" ? t("showAll") : t("showMessages"), "data-tooltip": mode === "messages" ? t("showAll") : t("showMessages") }, mode === "messages" ? t("messages") : t("all")),
            import_react.default.createElement("button", { type: "button", className: "tlnav-btn tlnav-scroll-mode", "aria-pressed": smooth, onClick: () => store.toggleSmooth(), title: smooth ? t("smooth") : t("jump"), "aria-label": smooth ? t("smooth") : t("jump"), "data-tooltip": smooth ? t("smooth") : t("jump") }, smooth ? "\u219D" : "\u21A3"),
            import_react.default.createElement("button", { type: "button", className: "tlnav-btn tlnav-boundary", onClick: jumpToEarliest, title: t("earliest"), "aria-label": t("earliest"), "data-tooltip": t("earliest"), "data-action": "jump-earliest" }, "\u2191"),
            import_react.default.createElement("button", { type: "button", className: "tlnav-btn tlnav-boundary", onClick: jumpToLatest, title: t("latest"), "aria-label": t("latest"), "data-tooltip": t("latest"), "data-action": "jump-latest" }, "\u2193")
          ),
          import_react.default.createElement("div", { className: "tlnav-spacer", "aria-hidden": "true" }),
          groups.some((group) => group.turn != null) ? import_react.default.createElement(
            "div",
            { className: "tlnav-turn-actions", role: "toolbar", "aria-label": t("turnActions") },
            import_react.default.createElement("button", { type: "button", className: "tlnav-turn-action", onClick: () => setAllTurnsCollapsed(false), title: t("expandAll"), "aria-label": t("expandAll"), "data-action": "expand-all" }, t("expandAll")),
            import_react.default.createElement("button", { type: "button", className: "tlnav-turn-action", onClick: () => setAllTurnsCollapsed(true), title: t("collapseAll"), "aria-label": t("collapseAll"), "data-action": "collapse-all" }, t("collapseAll"))
          ) : null,
          import_react.default.createElement(
            "div",
            {
              className: "tlnav-list",
              ref: listRef,
              onWheel: (event) => {
                const list = listRef.current;
                if (!list || !session || !(event.deltaY < 0 && list.scrollTop <= 0)) return;
                const snapshot = session.getSnapshot();
                if (navPoints.length && navPoints[0].turn === 1) {
                  setStatus(t("top"));
                  return;
                }
                if (!snapshot?.hasMore) {
                  setStatus(t("top"));
                  return;
                }
                if (snapshot.loadingOlder || loadingOlder.current) return;
                loadingOlder.current = true;
                setStatus(t("loading"));
                Promise.resolve(session.loadOlder()).then(() => setStatus("")).catch(() => setStatus(t("loadFailed"))).finally(() => {
                  loadingOlder.current = false;
                });
              }
            },
            listContent
          ),
          status ? import_react.default.createElement("div", { className: "tlnav-status", role: "status" }, status) : null,
          import_react.default.createElement(
            "div",
            { className: "tlnav-bookmarks" },
            import_react.default.createElement("div", { className: "tlnav-bookmarks-title" }, `\u2605 ${t("bookmarks")} ${bookmarkList.length}`),
            bookmarkList.length ? import_react.default.createElement("div", { className: "tlnav-bookmarks-list" }, bookmarkRows) : import_react.default.createElement(
              "div",
              { className: "tlnav-empty" },
              import_react.default.createElement("div", null, t("noBookmarks")),
              import_react.default.createElement("div", { className: "tlnav-empty-hint" }, t("noBookmarksHint"))
            )
          ),
          !hintSeen ? import_react.default.createElement("div", { className: "tlnav-hint", role: "note" }, t("hint")) : null,
          toast ? import_react.default.createElement("div", { className: "tlnav-toast", role: "status" }, toast) : null
        ),
        import_react.default.createElement(PreviewCard, { preview, t })
      );
    }
    function apply(ctx) {
      const { sessions, slots, locale } = ctx;
      const style = document.createElement("style");
      style.dataset.plugin = PLUGIN_ID;
      style.textContent = CSS;
      document.head.appendChild(style);
      ctx.effect(() => () => style.remove());
      const store = createAppStore();
      const settingsStore = (0, import_client.defineStore)({
        init: () => ({ enabled: true, language: "auto", revision: -1 }),
        actions: {
          sync: (draft, enabled, language, revision2) => {
            if (revision2 <= draft.revision) return;
            draft.enabled = enabled;
            draft.language = language;
            draft.revision = revision2;
          }
        }
      });
      let bound = null;
      let revision = 0;
      const syncSettings = (enabled) => {
        bound?.sync(enabled, resolveLanguage(locale, store), revision);
        revision += 1;
      };
      const injectSettings = (actions) => {
        bound = actions;
        syncSettings(store.isEnabled());
        return {
          setEnabled: (enabled) => {
            store.setEnabled(enabled);
            syncSettings(enabled);
          },
          toggleLanguage: () => {
            store.toggleLanguage(resolveLanguage(locale, store));
            syncSettings(store.isEnabled());
          }
        };
      };
      ctx.effect(() => {
        if (typeof locale?.subscribe !== "function") return void 0;
        return locale.subscribe(() => syncSettings(store.isEnabled()));
      });
      locale.register(SETTINGS_NAMESPACE, { zh: settingsZh, en: settingsEn });
      slots.inject("shell.overlay", () => slots.register(
        { name: "shell.overlay", id: "timeline-navigator-rail", order: 10 },
        (props) => import_react.default.createElement(RailPanel, { sessions, locale, useSessions: props.useSessions, store })
      ));
      slots.inject("settings.plugin.item", () => slots.register(
        { name: "settings.plugin.item", id: "timeline-navigator", order: 6, store: settingsStore, locale: SETTINGS_NAMESPACE, inject: injectSettings },
        SettingsCard
      ));
    }
    
    return module.exports;
  }
});
