# DeepSeek Harness release checklist

- Validate the tools-only package: `npm install && npm run check`.
- Run `npm run verify:bridge`; it must pass protected-resource discovery, DCR
  identity, S256 PKCE, token exchange, Bearer retry, initialization and
  `tools/list` against the local fake service without opening a real browser or
  reading credentials.
- With DSH installed, run `npm run verify:installed`; its isolated temporary
  profile must compose exactly one Kling row for China and exactly one replaced
  row for Global without reading or modifying the user's profile.
- Confirm the package and install archive contain no `mcp-app`, client bundle,
  local HTML, tool-view override, or overlay.
- Install with `dsh plugin --profile web add github:Wlain/kling-ai-deepseek-plugin`,
  then repeat from a local checkout with `dsh plugin --profile web add "$PWD"`.
- Install the package into an isolated profile, then validate ordinary startup
  for China and the later `cordis.global.patch.yml` replacement overlay for
  Global. Each composed tree must contain exactly one `kling-ai-remote` row and
  only its selected regional URL; the Global file must never use `insert`.
- Start `dsh web` and confirm no unshipped **Kling Widget** overlay is advertised.
- Complete the browser OAuth flow and verify
  `mcp__Plugin-DeepSeek-kling-ai__who_am_i` succeeds without exposing
  credentials. Inspect DCR metadata for `client_name: Plugin-DeepSeek` and the
  request header for `X-Kling-Integration: Plugin-DeepSeek`.
- Confirm both patches still pin `mcp-remote@0.2.0` and retain the 180-second
  callback budget. If runtime re-authorization stalls or the callback port is
  occupied, stop and restart `dsh web`; do not retry multiple stale browser
  tabs or attach raw `~/.mcp-auth`/debug logs to a report.
- Verify `/kling-ai` is discoverable and requires confirmation before every billable generation tool.
- Verify a non-billable `query_tasks` response preserves the text/resource
  fallback and at most one primary link without a duplicate renderer.
- Record the current Harness limitation: its official MCP client bridges tools
  but has no MCP resource consumer; interactive MCP Apps remain unclaimed.
