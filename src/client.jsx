import React, { useEffect, useRef, useState } from "react";
import { AppBridge, PostMessageTransport } from "@modelcontextprotocol/ext-apps/app-bridge";

const WIDGETS = __KLING_WIDGETS__;
const tabs = [
  ["generation", "生成结果"],
  ["upload", "素材上传"],
  ["showcase", "主体展示"],
];
const KLING_TOOL_NAMES = [
  "who_am_i", "logout", "query_membership_and_credits", "file_upload",
  "text_to_image", "image_to_image", "text_to_video", "image_to_video", "motion_control", "query_tasks",
  "element_create", "element_list", "element_get", "element_update", "element_delete", "motion_library_list",
].map((name) => `mcp__kling-ai__${name}`);
const GENERATION_TOOL_NAMES = new Set(["text_to_image", "image_to_image", "text_to_video", "image_to_video", "motion_control", "query_tasks"].map((name) => `mcp__kling-ai__${name}`));

const image = (label, a, b) => `data:image/svg+xml;charset=utf-8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="720" height="960"><defs><linearGradient id="g" x2="1" y2="1"><stop stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs><rect width="720" height="960" fill="url(#g)"/><circle cx="360" cy="390" r="180" fill="rgba(255,255,255,.17)"/><text x="360" y="780" text-anchor="middle" fill="white" font-family="sans-serif" font-size="50">${label}</text></svg>`)}`;

function demoResult(kind) {
  const base = { schemaVersion: 1, sessionId: `deepseek-demo:${kind}`, stateVersion: 1 };
  if (kind === "generation") return {
    ...base, sessionId: "generation:deepseek-harness-demo", view: "generation", state: {
      schemaVersion: 1, generationId: "deepseek-harness-demo", kind: "image", status: "succeeded", stateVersion: 1,
      prompt: "雨后的未来城市，电影感霓虹灯光", parameters: { model: "Kling Image 3.0", aspectRatio: "9:16", resolution: "2K" },
      outputCount: 2, references: [], outputs: [
        { id: "demo-1", label: "输出图片 1", mimeType: "image/png", url: image("Kling 01", "#102a43", "#8b5cf6") },
        { id: "demo-2", label: "输出图片 2", mimeType: "image/png", url: image("Kling 02", "#123c36", "#d97745") },
      ],
    },
  };
  if (kind === "upload") return {
    ...base, view: "upload", state: { title: "上传素材", scenario: "under_limit", purpose: "general", maxUploads: 4,
      media: [], uploads: [{ id: "upload-1", name: "reference.png", kind: "image", status: "ready", previewUrl: image("Reference", "#17324d", "#bf6b54") }],
      subjects: [], voices: [], actions: [], canContinue: true },
  };
  return {
    ...base, view: "subject-library", state: { title: "主体库", scenario: "populated", category: "all", media: [], uploads: [], voices: [], actions: [], canContinue: true,
      subjects: [
        { id: "subject-1", name: "凯莉", category: "character", imageUrl: image("Kelly", "#2b1f3b", "#d16f56"), favorite: true },
        { id: "subject-2", name: "灯塔", category: "scene", imageUrl: image("Coast", "#16404d", "#d38b5a"), favorite: false },
      ] },
  };
}

function textFromBlock(block) {
  if (block?.kind !== "tool-result") return "";
  return (block.content || []).filter((item) => item?.type === "text").map((item) => item.text || "").join("\n");
}

function parseJsonValues(text) {
  const values = [];
  const candidates = [text, ...(text.match(/```(?:json)?\s*([\s\S]*?)```/gi) || []).map((part) => part.replace(/^```(?:json)?\s*/i, "").replace(/```$/, ""))];
  for (const candidate of candidates) {
    try { values.push(JSON.parse(candidate.trim())); } catch {}
  }
  return values;
}

function walk(value, visit) {
  if (!value || typeof value !== "object") return;
  visit(value);
  for (const child of Array.isArray(value) ? value : Object.values(value)) walk(child, visit);
}

function realGenerationResult(toolName, block) {
  const text = textFromBlock(block);
  if (!text) return null;
  const argsRaw = block.call?.argsRaw || "{}";
  let args = {};
  try { args = JSON.parse(argsRaw); } catch {}
  const argumentValues = Object.fromEntries(Array.isArray(args.arguments) ? args.arguments.filter((item) => item && typeof item.name === "string").map((item) => [item.name, item.value]) : []);
  let generationId = "";
  let status = "";
  let kind = toolName.includes("video") ? "video" : toolName.includes("image") ? "image" : "";
  let parameters = {};
  const media = [];
  for (const value of parseJsonValues(text)) walk(value, (record) => {
    generationId ||= String(record.generationId || record.generation_id || record.taskId || record.task_id || "");
    status ||= String(record.status || record.taskStatus || record.task_status || "");
    kind ||= String(record.kind || record.type || record.contentType || record.content_type || "").toLowerCase().includes("video") ? "video" : "";
    if (record.parameters && typeof record.parameters === "object") parameters = { ...parameters, ...record.parameters };
    const url = record.url || record.videoUrl || record.video_url || record.imageUrl || record.image_url || record.resourceUrl || record.resource_url;
    if (typeof url === "string" && /^https:\/\//.test(url) && !media.some((item) => item.url === url)) {
      const mime = String(record.mimeType || record.mime_type || record.contentType || record.content_type || "");
      media.push({ url, mime, label: record.label || record.name || "" });
    }
  });
  generationId ||= text.match(/(?:generationId|generation_id|taskId|task_id)\s*[":=：]+\s*["']?([A-Za-z0-9_-]{8,})/i)?.[1] || "";
  status ||= text.match(/(?:status|任务状态)\s*[":=：]+\s*["']?([A-Z_]+)/i)?.[1] || "";
  const urls = text.match(/https:\/\/[^\s"'<>]+/g) || [];
  for (const url of urls) if (!media.some((item) => item.url === url)) media.push({ url, mime: "", label: "" });
  if (!generationId && media.length === 0) return null;
  const normalized = status.toUpperCase();
  const succeeded = ["COMPLETED", "SUCCEEDED", "SUCCESS"].includes(normalized);
  const failed = ["FAILED", "ERROR", "CANCELED", "CANCELLED", "TIMEOUT"].includes(normalized);
  const outputKind = kind || (media.some((item) => /video|\.mp4(?:\?|$)/i.test(`${item.mime} ${item.url}`)) ? "video" : "image");
  const outputs = media.map((item, index) => {
    const isVideo = /video|\.mp4(?:\?|$)/i.test(`${item.mime} ${item.url}`);
    return { id: `result-${index + 1}`, label: item.label || (isVideo ? "生成视频" : `生成图片 ${index + 1}`), mimeType: isVideo ? "video/mp4" : "image/png", url: item.url };
  });
  return {
    schemaVersion: 1,
    sessionId: `generation:${generationId || block.callId}`,
    stateVersion: 1,
    view: "generation",
    state: {
      schemaVersion: 1, generationId: generationId || block.callId, kind: outputKind,
      status: succeeded ? "succeeded" : failed ? "failed" : "running", stateVersion: 1,
      prompt: String(argumentValues.prompt || args.prompt || args.text || "Kling AI 生成任务"),
      parameters: { ...argumentValues, ...parameters, model: args.model || parameters.model, duration: argumentValues.duration || args.duration || parameters.duration, resolution: argumentValues.resolution || args.resolution || parameters.resolution, aspectRatio: argumentValues.aspect_ratio || argumentValues.aspectRatio || args.aspect_ratio || args.aspectRatio || parameters.aspectRatio },
      outputCount: outputs.length, references: [], outputs,
      ...(failed ? { error: { message: text.slice(0, 500) } } : {}),
    },
  };
}

function WidgetFrame({ kind, result }) {
  const iframeRef = useRef(null);
  const [status, setStatus] = useState("正在连接 Widget…");
  const widgetUrl = `/kling-ai-widgets/${kind}`;
  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;
    let bridge;
    let resizeObserver;
    let themeObserver;
    const connect = async () => {
      setStatus("正在进行 MCP Apps 握手…");
      const theme = document.body.hasAttribute("data-ds-dark-theme") ? "dark" : "light";
      const dimensions = { width: iframe.clientWidth || 930, maxHeight: iframe.clientHeight || 592 };
      const server = {
        getServerCapabilities: () => ({ tools: {} }),
        request: async () => ({ content: [{ type: "text", text: "DeepSeek Harness local Widget demo" }] }),
        notification: async () => {},
      };
      bridge = new AppBridge(server, { name: "kling-ai-deepseek-harness", version: "0.1.0" }, {
        openLinks: {}, serverTools: {}, updateModelContext: { text: {} },
      }, { hostContext: { theme, platform: "web", displayMode: "inline", availableDisplayModes: ["inline", "fullscreen"], containerDimensions: dimensions } });
      bridge.onopenlink = async ({ url }) => { window.open(url, "_blank", "noopener,noreferrer"); return {}; };
      bridge.onmessage = async () => ({});
      bridge.onupdatemodelcontext = async () => ({});
      // The Harness panel owns the viewport. Let the Widget scroll inside that
      // stable frame instead of letting content-driven resize overflow it.
      bridge.onsizechange = async () => {};
      bridge.onrequestdisplaymode = async ({ mode }) => ({ mode });
      const initialized = new Promise((resolve) => { bridge.oninitialized = resolve; });
      await bridge.connect(new PostMessageTransport(iframe.contentWindow, iframe.contentWindow));
      iframe.src = widgetUrl;
      await initialized;
      resizeObserver = new ResizeObserver(([entry]) => {
        const width = Math.round(entry.contentRect.width);
        const maxHeight = Math.round(entry.contentRect.height);
        if (width > 0 && maxHeight > 0) void bridge.sendHostContextChange({ containerDimensions: { width, maxHeight } });
      });
      resizeObserver.observe(iframe);
      themeObserver = new MutationObserver(() => {
        void bridge.sendHostContextChange({ theme: document.body.hasAttribute("data-ds-dark-theme") ? "dark" : "light" });
      });
      themeObserver.observe(document.body, { attributes: true, attributeFilter: ["data-ds-dark-theme"] });
      await bridge.sendToolInput({ arguments: { demo: true, view: kind } });
      const structuredContent = result || demoResult(kind);
      await bridge.sendToolResult({ content: [{ type: "text", text: result ? "Kling AI 真实服务结果" : "Kling AI 本地演示结果" }], structuredContent });
      setStatus("");
    };
    const run = () => connect().catch((error) => setStatus(`Widget 连接失败：${error instanceof Error ? error.message : String(error)}`));
    run();
    return () => { resizeObserver?.disconnect(); themeObserver?.disconnect(); bridge?.close(); };
  }, [kind, widgetUrl, result]);
  return <div style={{ position: "relative", flex: "1 1 auto", minHeight: 0, overflow: "hidden" }}>
    {status && <div role="status" style={{ position: "absolute", inset: "18px auto auto 18px", zIndex: 2, color: "#9eb7ae", fontSize: 13 }}>{status}</div>}
    <iframe key={kind} ref={iframeRef} title={`Kling AI ${kind} Widget`} sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-downloads" style={{ display: "block", width: "100%", height: "100%", border: 0, borderRadius: 14, background: "#111715" }} />
  </div>;
}

function KlingToolRow({ block, toolName }) {
  const result = GENERATION_TOOL_NAMES.has(toolName) ? realGenerationResult(toolName, block) : null;
  const running = block?.kind !== "tool-result";
  if (!result) return <div style={{ border: "1px solid #2f5148", borderRadius: 10, padding: "10px 12px", color: "#b8ccc5", background: "#101815" }}>
    <strong>Kling AI</strong><span style={{ marginLeft: 8, color: running ? "#e3b56a" : "#75d9b8" }}>{running ? "正在调用真实服务…" : "调用完成"}</span>
    {!running && <div style={{ marginTop: 6, whiteSpace: "pre-wrap", fontSize: 12, opacity: .8 }}>{textFromBlock(block).slice(0, 600)}</div>}
  </div>;
  return <section style={{ height: 620, overflow: "hidden", border: "1px solid #315a4f", borderRadius: 14, padding: 8, background: "#0d1412" }}>
    <WidgetFrame kind="generation" result={result} />
  </section>;
}

function KlingOverlay() {
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState("generation");
  return <div style={{ pointerEvents: "auto", position: "fixed", right: 24, bottom: 24, zIndex: 10000, fontFamily: "Inter, system-ui, sans-serif" }}>
    {open && <section aria-label="Kling AI Widget 面板" style={{ boxSizing: "border-box", position: "fixed", inset: 24, width: "min(960px, calc(100vw - 48px))", height: "calc(100vh - 48px)", margin: "auto", padding: 14, display: "flex", flexDirection: "column", overflow: "hidden", border: "1px solid #315a4f", borderRadius: 18, background: "#0d1412", boxShadow: "0 24px 80px rgba(0,0,0,.55)", color: "#eef8f4" }}>
      <header style={{ display: "flex", flex: "0 0 auto", flexWrap: "wrap", alignItems: "center", gap: 12, marginBottom: 12 }}>
        <div><strong style={{ fontSize: 18 }}>Kling AI · MCP Apps</strong><div style={{ fontSize: 12, color: "#8eaaa1" }}>真实服务由聊天中的 /kling-ai 与 Kling MCP tools 驱动；此面板为无额度本地预览</div></div>
        <nav style={{ display: "flex", gap: 6, marginLeft: "auto" }}>{tabs.map(([id, label]) => <button key={id} onClick={() => setKind(id)} style={{ border: "1px solid #34584f", borderRadius: 9, padding: "7px 11px", color: id === kind ? "#0a1713" : "#c7d8d2", background: id === kind ? "#74e0bd" : "#17211e", cursor: "pointer" }}>{label}</button>)}</nav>
        <button aria-label="关闭 Kling Widget" onClick={() => setOpen(false)} style={{ border: 0, color: "#b8ccc5", background: "transparent", fontSize: 24, cursor: "pointer" }}>×</button>
      </header>
      <WidgetFrame kind={kind} />
    </section>}
    <button aria-label="打开 Kling AI Widget" onClick={() => setOpen(!open)} style={{ float: "right", border: "1px solid #5de0b5", borderRadius: 999, padding: "12px 18px", background: "#102a22", color: "#a9f5db", fontWeight: 700, boxShadow: "0 10px 32px rgba(0,0,0,.4)", cursor: "pointer" }}>✦ Kling Widget</button>
  </div>;
}

export const name = "kling-ai-deepseek-harness-client";
export const inject = ["slots"];
export function apply(ctx) {
  const effects = [ctx.slots.inject("shell.overlay", () => ctx.slots.register({ name: "shell.overlay", id: "kling-ai-widget", order: 100, label: "Kling AI Widget" }, KlingOverlay))];
  for (const toolName of KLING_TOOL_NAMES) effects.push(ctx.slots.inject("tool.call.toolview", () => ctx.slots.register({ name: "tool.call.toolview", key: toolName }, KlingToolRow)));
  return () => effects.forEach((dispose) => { if (typeof dispose === "function") dispose(); });
}
