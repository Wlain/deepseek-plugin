---
name: install-kling-ai-plugin
description: Install, refresh, or troubleshoot the Kling AI DeepSeek Harness MCP integration. Use when applying the Cordis patch, checking the remote MCP client, or reconnecting OAuth. Preserve the configured serverName exactly.
---

# Install the Kling AI plugin in DeepSeek Harness

1. Treat `cordis.patch.yml` as the source of truth.
2. Preserve the exact `serverName: Plugin-DeepSeek-kling-ai`, remote endpoint, transport, and timeout fields. Do not reconstruct them from memory.
3. Apply the packaged patch without adding a second MCP client for the same endpoint.
4. Re-read the effective Cordis configuration and verify the exact server name and `https://klingai.com/mcp` endpoint.
5. Use the host-owned OAuth flow and never request credentials in chat.
