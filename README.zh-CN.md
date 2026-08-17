# DeepSeek Harness 时间线导航

[返回主 README（中文优先，含英文说明）](README.md)

一个面向 DeepSeek Harness Web UI 的对话时间线导航插件。它把长对话按回合整理成可点击跳转、可收藏的侧边时间线，不修改 Harness 主程序源码。

> 本项目由 7A7K 独立维护，是社区插件，与 DeepSeek 官方无隶属、赞助或背书关系。

![时间线导航演示图（界面示意）](demo-timeline.svg)

## 功能

- 从聊天右侧可见入口打开，也支持键盘聚焦和移动端触摸。
- 按 Turn 分组浏览消息，自动高亮当前可见消息。
- 跳转到尚未加载的旧消息时，自动加载历史。
- 默认合拢回合，支持“展开全部 / 折叠全部”。
- 点击每条消息右侧星标收藏；移动端长按是备用方式。
- 一键跳到最早/最新消息，按 `Escape` 关闭面板，拖动左边缘调整宽度。
- 面板标题栏和设置页插件卡片都提供 `中 / EN` 按钮；切换后标题、收藏、跳转、展开/折叠和状态提示会同步切换语言，并自动记住选择。
- 记住启用状态、面板宽度、过滤模式、滚动模式和首次提示状态。
- 支持移动端底部面板，并尊重系统的“减少动态效果”设置。

## 安装：让 Harness 直接下载（推荐）

如果已经安装 DeepSeek Harness，直接在终端执行：

```powershell
dsh plugin --profile web add github:7A7K/DSH-Timeline-Navigator
```

Harness 会从 GitHub 获取并安装插件。本项目已包含可直接加载的 `lib/` 构建产物，并声明了 Harness 所需的 `dsh.bundle` 清单，因此不需要先下载仓库、执行 `npm install` 或手动编写 patch。安装完成后刷新 `http://127.0.0.1:3080/`；如果页面仍使用旧 bundle，请重启一次 DSH Web 进程。

### 备用方式：PowerShell 安装脚本

普通用户不需要 `npm install`。Windows PowerShell 推荐：

```powershell
git clone https://github.com/7A7K/DSH-Timeline-Navigator.git
Set-Location .\DSH-Timeline-Navigator
.\install.ps1
```

也可以在 GitHub 点击 **Code → Download ZIP**，解压后运行 `.\install.ps1`。

从项目链接安装：

```powershell
.\install.ps1 `
  -Source 'https://github.com/7A7K/DSH-Timeline-Navigator' `
  -Version latest
```

`latest` 会读取最新 Release，也可以指定版本 tag。备用脚本会从 GitHub 下载并复制代码到本地，未提供签名或哈希校验；请优先使用上面的 Harness 官方安装命令，或至少固定到明确的版本 tag，不要对不受信任的仓库使用 `main`。安装完成后刷新 `http://127.0.0.1:3080/`；如果页面仍使用旧 bundle，请重启一次 DSH Web 进程。

如果 DSH 不在默认目录 `%USERPROFILE%\.dsh`：

```powershell
.\install.ps1 -DshHome 'D:\path\to\.dsh'
```

## 卸载

```powershell
.\uninstall.ps1
```

默认保留源代码以便回滚；确定不再需要源代码时再加 `-RemoveSource`。

## 操作速查

| 操作 | 结果 |
| --- | --- |
| 悬停或聚焦右侧入口 | 打开时间线 |
| 点击消息 | 跳转并居中消息 |
| 点击消息右侧星标 | 添加/取消收藏 |
| 点击 Turn 标题 | 展开/折叠该回合 |
| 展开全部 / 折叠全部 | 批量改变回合状态 |
| ↑ / ↓ 按钮 | 跳到最早 / 最新消息 |
| 移动端长按消息 | 收藏备用操作 |
| `Escape` | 关闭时间线 |
| 拖动面板左边缘 | 调整面板宽度 |

## 兼容性

- 目标为 DSH Web client `rc.6` 及更新的插件合约。
- 使用 Harness 的 `ChatSnapshot` 和 `data-chat-anchor-key`，不抓取原始 session 事件。
- 只拥有自己的 overlay 和 settings slots；禁用或卸载不会修改宿主源码。
- CI 会检查宿主 DOM 定位、历史消息加载、插件 manifest、overlay/settings slots，以及模拟 Harness 页面中的真实 UI 交互。
- 自动化 fixture 覆盖 DSH `rc.6` 合约形状；`npm run smoke` 仍需要正在运行且有非空会话的真实 Harness，用于发布前人工验证，不作为普通 CI 的必需前置条件。
- 详细的支持范围、契约依赖和升级建议见 [兼容性说明](COMPATIBILITY.md)。
- 最终用户只需要 Windows PowerShell 和已经存在的 DSH home，不需要 Node.js。

## 开发

开发和打包需要 Node.js 18 或更新版本：

```powershell
npm install
npm run bundle
npm run check
npm run test:ui
```

源码在 `src/`，`lib/` 是生成产物。修改后先运行 `npm run bundle`，不要直接编辑 `lib/client.js`。`npm run check` 检查版本元数据、生成 bundle 的语法和核心测试；`npm run test:ui` 在模拟 Harness 页面中运行 Playwright 交互测试。
