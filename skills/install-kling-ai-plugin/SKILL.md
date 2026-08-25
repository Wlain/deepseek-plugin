---
name: install-kling-ai-plugin
description: Install, refresh, or troubleshoot the Kling AI DeepSeek Harness MCP integration. Use when applying the Cordis patch, checking the remote MCP client, or reconnecting OAuth. Preserve the configured serverName exactly.
---

# Install the Kling AI plugin in DeepSeek Harness

1. Treat the bundled `cordis.patch.yml` as the China insert and `cordis.global.patch.yml` as the later Global replacement overlay for the same `kling-ai-remote` row.
2. Preserve the exact `serverName: Plugin-DeepSeek-kling-ai`, remote endpoint, transport, and timeout fields. Do not reconstruct them from memory.
3. Install the package once. Use ordinary `dsh web` for China; for Global, stop the China process and start `dsh --profile web --patch <absolute-package-path>/cordis.global.patch.yml ...`. Never turn the Global file back into an `insert` patch.
4. Before OAuth, use `--dump-config` and verify there is exactly one `Plugin-DeepSeek-kling-ai` row and only the selected endpoint: China `https://klingai.com/mcp` or Global `https://kling.ai/mcp`.
5. Use the host-owned OAuth flow and never request credentials in chat.
