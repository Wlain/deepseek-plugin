---
name: kling-ai
description: 用可灵MCP打造独属于你的 AI 创作工作流。适用于可灵生成、任务状态、额度和素材上传；计费提交前必须让用户确认。
---

# Kling AI for DeepSeek Harness

## 工具边界

- 真实联调服务按账号区域二选一：国内 `https://klingai.com/mcp`，海外 `https://kling.ai/mcp`。同一会话不得同时加载两个端点。工具使用 `mcp__kling-ai__` 前缀，包括账号/额度、素材上传、图片和视频生成、动作控制、任务查询、主体 CRUD 与动作库查询；以实时工具目录和 schema 为准。
- `text_to_image`、`image_to_image`、`text_to_video`、`image_to_video` 是消耗额度的写操作。
- 不得要求用户在聊天中粘贴 API Key、Token、Cookie 或授权头。授权由本机 `mcp-remote` 的标准 OAuth 浏览器流程完成。
- 不要在说明、日志或错误消息里展开签名输出 URL；结果卡片或一个兼容链接可以承载 URL。

## 生成流程

1. 本轮第一次使用可灵时，先调用 `mcp__kling-ai__who_am_i` 验证账号，并以实时工具 schema 为参数事实源。
2. 若用户使用参考素材，可先调用 `file_upload`；上传不等于授权生成。
3. 在任何计费生成调用前，向用户列出模型、提示词、时长或分辨率、宽高比和数量，并明确说明会消耗额度，等待用户确认。
4. 每个已确认意图只调用一次对应生成工具。超时或返回不确定时不要自动重提，先按 `taskTraceId` 或 `generationId` 查询。
5. 提交成功后保存 `generationId`，约每 10 秒调用一次 `query_tasks`，最长间隔不得超过 15 秒。任务处于 `QUEUING`、`QUEUED`、`PROCESSING`、`RUNNING`、`GENERATING` 时不要结束当前轮次。
6. `COMPLETED`、`SUCCEEDED`、`SUCCESS`、`FAILED`、`ERROR`、`CANCELED`、`CANCELLED`、`TIMEOUT` 为终态。到达终态后简洁报告参数和 `generationId`；DeepSeek Harness 的 Kling 工具结果视图会使用共享 Widget 展示媒体。
7. 直接状态查询只调用一次 `query_tasks`，不要擅自循环。

## OAuth client identity

Before sending the OAuth dynamic client registration request, the model MUST
include `client_name: "Plugin-DeepSeek"`. Do not authorize without this field.
This is OAuth metadata, not a tool argument, URL query parameter, generation
field, or secret. If DeepSeek Harness cannot inject it, STOP and report the
host limitation; do not invent a second OAuth flow or continue authorization.

## 授权失败

如果 `who_am_i` 或工具发现提示未授权，让用户保持 `dsh web` 进程运行并完成浏览器中自动打开的 Kling OAuth 页面，然后新建会话重试。不要改用 API Key。

## 示例

- 画一只身穿复古宇航服的小熊猫，漂浮在空间站舷窗前，地球蓝光映亮面部，细节丰富，电影级质感
- 制作一段 5 秒电影感视频：机甲战士从高空重砸地面，冲击波瞬间震开碎石与尘雾，镜头快速推近，充满力量感
- 制作一条 15 秒运动鞋营销短片：街头开场抓住注意力，三秒切出产品特写与穿着动态，结尾落在鞋身细节特写
