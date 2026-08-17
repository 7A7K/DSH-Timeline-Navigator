# Compatibility / 兼容性说明

## 中文

### 支持范围

| 插件版本 | DSH Web 合约 | 自动化验证 | 说明 |
| --- | --- | --- | --- |
| `v0.3.5` | `rc.6` 及更新版本 | 模拟 Harness fixture + 核心测试 | 真实 Harness 冒烟测试仍需发布前人工运行 |

插件依赖以下宿主契约：

- `ChatSnapshot` 的 `chat.order`、`chat.nodes`、`hasMore` 和 `loadingOlder` 状态；
- 消息节点的 `kind`、`location.turn`、`anchorSeq` 和 `visibility` 字段；
- DOM 上的 `[data-conversation-scroll]` 滚动容器；
- DOM 上的 `[data-chat-anchor-key]` 消息定位属性；
- `shell.overlay` 和 `settings.plugin.item` 两个 UI slot。

仓库中的模拟 Harness 测试会验证这些契约对应的时间线渲染、展开/折叠、收藏、语言切换、跳转、设置页注册和 `Escape` 关闭行为。它可以在 GitHub Actions 中运行，但不能替代真实 DSH 页面测试。

### 升级建议

升级 DSH 后，如果时间线入口消失或消息列表为空，请先运行 `npm run test:ui`，再在真实 Harness 页面运行 `npm run smoke`。如果宿主契约发生变化，请提交包含 DSH 版本、控制台错误、相关 DOM 结构和复现步骤的 issue。

## English

### Support boundary

| Plugin version | DSH Web contract | Automated validation | Notes |
| --- | --- | --- | --- |
| `v0.3.5` | `rc.6` and newer | Simulated Harness fixture + core tests | A live Harness smoke test is still required before a release |

The plugin depends on the host `ChatSnapshot` shape, message node fields, `[data-conversation-scroll]`, `[data-chat-anchor-key]`, and the `shell.overlay` / `settings.plugin.item` slots. The fixture test covers rendering, expand/collapse, bookmarks, language switching, navigation, settings registration, and Escape close behavior. It is not a replacement for a live DSH page.

After upgrading DSH, run `npm run test:ui` first and then `npm run smoke` against a real non-empty Harness conversation. When reporting a compatibility issue, include the DSH version, console error, relevant DOM shape, and reproduction steps.
