# Kling AI for DeepSeek Harness

DeepSeek Harness 客户端插件，通过官方 MCP Apps `AppBridge` 将仓库中唯一一份 `mcp-app/exports` Widget 挂载到 Harness Web UI。

```bash
npm install && npm run build && npm run check
dsh plugin --profile web add ./deepseek/kling-ai
dsh web --host 127.0.0.1 --port 3080
```

Harness 官方 MCP 客户端目前仅桥接 tools，不消费 resources。因此本适配器使用 Harness 的 `shell.overlay` 客户端插槽承载三个共享 Widget；右下角 **Kling Widget** 可在不配置模型、不调用计费工具的情况下验证挂载。

## 跨平台呈现契约

- Widget 的内容、媒体操作、主题和安全区行为来自唯一共享的 `mcp-app`，与 Codex、Cursor、WorkBuddy 等支持 MCP Apps 的宿主一致。
- Harness 适配层只负责提供 iframe 容器，并把实时尺寸与明暗主题通过标准 host context 传给 App；内容驱动的尺寸变化在 iframe 内滚动，不得撑破宿主面板。
- 面板使用 `border-box` 在视口内居中；三份 Widget 共用同一容器，不按页面分别维护尺寸常量。
- Harness 官方 MCP 客户端增加 resources consumer 后，应删除这层资源路由兼容代码，直接消费 `_meta.ui.resourceUri`。
