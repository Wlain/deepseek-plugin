# Kling AI for DeepSeek Harness

DeepSeek Harness 客户端插件，通过官方 MCP Apps `AppBridge` 将仓库中唯一一份 `mcp-app/exports` Widget 挂载到 Harness Web UI。

```bash
npm install && npm run build && npm run check
dsh plugin --profile web add ./deepseek/kling-ai
dsh web --host 127.0.0.1 --port 3080
```

Harness 官方 MCP 客户端目前仅桥接 tools，不消费 resources。因此本适配器使用 Harness 的 `shell.overlay` 客户端插槽承载三个共享 Widget；右下角 **Kling Widget** 可在不配置模型、不调用计费工具的情况下验证挂载。
