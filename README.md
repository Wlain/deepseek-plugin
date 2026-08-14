# Kling AI for DeepSeek Harness

DeepSeek Harness 完整插件：通过 Harness 官方 MCP tools bridge 和 `mcp-remote` 的标准 OAuth 流程连接联调服务 `https://klingai.com/mcp`，并通过官方 MCP Apps `AppBridge` 将仓库中唯一一份 `mcp-app/exports` Widget 挂载到 Harness Web UI。

```bash
npm install && npm run build && npm run check
dsh plugin --profile web add ./deepseek/kling-ai
dsh web --host 127.0.0.1 --port 3080
```

首次启动时 `mcp-remote` 会打开浏览器完成 Kling OAuth。保持 `dsh web` 进程运行，完成授权后新建 Harness 会话，输入 `/kling-ai` 加载计费安全流程。真实工具名使用 `mcp__kling-ai__*` 前缀。

Harness 官方 MCP 客户端目前仅桥接 tools，不消费 resources。因此本适配器同时使用：

- `tool.call.toolview`：把真实生成和 `query_tasks` 结果在聊天流中交给共享生成 Widget 渲染；
- `shell.overlay`：承载三个确定性本地 Widget，供无额度 UI 验证，右下角入口为 **Kling Widget**。

联调服务当前声明的 UI 映射为：`ui://kling/work-viewer.html` → `image-video-generation.html`、`ui://kling/upload-file.html` → `upload.html`、`ui://kling/element-list.html` → `showcase.html`。

真实生成会消耗 Kling 额度；Skill 强制要求在生成工具调用前展示参数并等待用户确认。右下角本地预览不会调用真实服务。

当前联调阶段的三个 HTML 均直接读取仓库本地 `mcp-app/exports/`；本插件不会上传或修改远端 UI。验证通过后再由发布流程把同一批构建产物上传到联调 MCP 服务对应的 UI resource。

## 跨平台呈现契约

- Widget 的内容、媒体操作、主题和安全区行为来自唯一共享的 `mcp-app`，与 Codex、Cursor、WorkBuddy 等支持 MCP Apps 的宿主一致。
- Harness 适配层只负责提供 iframe 容器，并把实时尺寸与明暗主题通过标准 host context 传给 App；内容驱动的尺寸变化在 iframe 内滚动，不得撑破宿主面板。
- 面板使用 `border-box` 在视口内居中；三份 Widget 共用同一容器，不按页面分别维护尺寸常量。
- Harness 官方 MCP 客户端增加 resources consumer 后，应删除这层资源路由兼容代码，直接消费 `_meta.ui.resourceUri`。
