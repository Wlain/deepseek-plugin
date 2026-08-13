# DeepSeek Harness release checklist

- Build and validate the client bundle: `npm install && npm run build && npm run check`.
- Confirm `mcp-app` is a symbolic link to the repository's shared app.
- Install with `dsh plugin --profile web add ./deepseek/kling-ai`.
- Start `dsh web` and verify the **Kling Widget** overlay.
- Verify generation, upload, and showcase tabs all render their corresponding shared HTML.
- Keep the demo deterministic and local; it must not invoke a billable Kling generation tool.
- Record the current Harness limitation: its official MCP client bridges tools but has no MCP resource consumer, so the client slot adapter remains required.
