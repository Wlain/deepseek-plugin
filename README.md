# Kling AI for DeepSeek Harness

DeepSeek Harness 插件通过 Harness 官方 MCP tools bridge 和固定版本
`mcp-remote` 的标准 OAuth 流程连接区域服务。安装包默认插入国内
`cordis.patch.yml`（`https://klingai.com/mcp`）；海外
`cordis.global.patch.yml`（`https://kling.ai/mcp`）是对同一个
`kling-ai-remote` 节点的替换 overlay，不会再插入第二个客户端。切区前先停止
旧 DSH 进程并断开旧 OAuth。

```bash
cd /absolute/path/to/kling-ai-plugin/deepseek/kling-ai
npm install
npm run check
npm run verify:bridge
npm run verify:installed
dsh plugin --profile web add "$PWD"
# 国内（安装后的默认区域）
dsh web --host 127.0.0.1 --port 3080

# 海外（从仓库目录执行；overlay 必须位于 web 子命令之前）
dsh --profile web --patch "$PWD/cordis.global.patch.yml" --host 127.0.0.1 --port 3080
```

`verify:bridge` 只使用本地假 OAuth/MCP；`verify:installed` 只在临时
`DSH_HOME` 内安装和合成配置，不读取或改写现有 Harness profile。

不要在已安装国内 bundle 的 profile 上使用另一份 `insert` patch。海外模板按
DSH 的后置 overlay 语义原位替换已安装节点，因此合成结果仍只有一个
`Plugin-DeepSeek-kling-ai`。运行 `dsh --profile web --patch
"$PWD/cordis.global.patch.yml" --dump-config` 可在授权前检查有效配置；输出中应只
出现所选区域 URL。切回国内时停止海外进程并恢复普通 `dsh web` 启动。

首次启动时 `mcp-remote` 会打开浏览器完成 Kling OAuth。两份 patch 都通过
`--static-oauth-client-metadata` 固定 DCR `client_name` 为
`Plugin-DeepSeek`，携带 `X-Kling-Integration: Plugin-DeepSeek`，并把 callback
等待时间从上游默认 30 秒延长到 180 秒。保持
`dsh web` 进程运行，完成授权后新建 Harness 会话，输入 `/kling-ai`
加载计费安全流程。真实工具名使用
`mcp__Plugin-DeepSeek-kling-ai__*` 前缀。

Harness 官方 MCP 客户端 0.0.1-rc.1 目前只桥接 tools，不消费 MCP
resources，也没有已验证的 MCP Apps 容器。因此本发布包不注册自制
`tool.call.toolview`、overlay 或本地 HTML。真实生成会消耗 Kling 额度；Skill
在生成前展示参数并等待确认。结果使用同一次远端工具调用的文本/resource
回落与最多一个主媒体链接，直到官方客户端支持并验收 MCP resources。

## 跨平台呈现契约

- 不复制或链接仓库根目录的本地 `mcp-app/`，不把未发布的 prototype 当成
  运行时能力。
- Harness 官方 MCP 客户端增加 resources consumer 后，直接消费远端
  `_meta.ui.resourceUri`；通过真实目标构建验收前不声明 Widget 可用。

## OAuth bridge 边界

本包固定 `mcp-remote@0.2.0`，不使用会随时间漂移的 `@latest`。仓库的
`npm run verify:bridge` 会用本地假 OAuth/MCP 服务验证 protected-resource
discovery、动态注册、`Plugin-DeepSeek` 客户端名、S256 PKCE、token endpoint、
Bearer 重试和 `tools/list`；测试不会打开真实浏览器、读取凭据或调用 Kling。

上游仍有运行中 access/refresh token 同时失效后 callback listener 未重建的
[问题 #248](https://github.com/geelen/mcp-remote/issues/248)，以及异常退出后旧
callback 端口冲突的[问题 #253](https://github.com/geelen/mcp-remote/issues/253)。
遇到授权过期时先停止并重新启动 `dsh web`，只完成新进程打开的一次授权。
不要反复点击多个旧授权页，也不要直接分享 `~/.mcp-auth` 或 `--debug` 产生的
原始日志；其中可能包含 OAuth 状态和敏感诊断信息。
