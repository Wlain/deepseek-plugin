# DeepSeek Harness release checklist

- Build and validate the client bundle: `npm install && npm run build && npm run check`.
- Confirm `mcp-app` is a symbolic link to the repository's shared app.
- Install with `dsh plugin --profile web add ./deepseek/kling-ai`.
- Start `dsh web` and verify the **Kling Widget** overlay.
- Verify generation, upload, and showcase tabs all render their corresponding shared HTML.
- Complete the browser OAuth flow and verify `mcp__kling-ai__who_am_i` succeeds without exposing credentials.
- Verify `/kling-ai` is discoverable and requires confirmation before every billable generation tool.
- Verify a non-billable `query_tasks` response is rendered by the keyed Kling tool view; keep the overlay demo deterministic and local.
- Record the current Harness limitation: its official MCP client bridges tools but has no MCP resource consumer, so the client slot adapter remains required.
