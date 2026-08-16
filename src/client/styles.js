export const CSS = `
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
`
