import React, { useEffect, useRef, useState } from "react";
import { AppBridge, PostMessageTransport } from "@modelcontextprotocol/ext-apps/app-bridge";

const WIDGETS = __KLING_WIDGETS__;
const tabs = [
  ["generation", "生成结果"],
  ["upload", "素材上传"],
  ["showcase", "主体展示"],
];

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

function WidgetFrame({ kind }) {
  const iframeRef = useRef(null);
  const [status, setStatus] = useState("正在连接 Widget…");
  const widgetUrl = `/kling-ai-widgets/${kind}`;
  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;
    let bridge;
    const connect = async () => {
      setStatus("正在进行 MCP Apps 握手…");
      const server = {
        getServerCapabilities: () => ({ tools: {} }),
        request: async () => ({ content: [{ type: "text", text: "DeepSeek Harness local Widget demo" }] }),
        notification: async () => {},
      };
      bridge = new AppBridge(server, { name: "kling-ai-deepseek-harness", version: "0.1.0" }, {
        openLinks: {}, serverTools: {}, updateModelContext: { text: {} },
      }, { hostContext: { theme: "dark", platform: "web", displayMode: "inline", availableDisplayModes: ["inline", "fullscreen"], containerDimensions: { width: 980, maxHeight: 760 } } });
      bridge.onopenlink = async ({ url }) => { window.open(url, "_blank", "noopener,noreferrer"); return {}; };
      bridge.onmessage = async () => ({});
      bridge.onupdatemodelcontext = async () => ({});
      bridge.onsizechange = async ({ height }) => { if (height) iframe.style.height = `${Math.min(720, Math.max(360, height))}px`; };
      bridge.onrequestdisplaymode = async ({ mode }) => ({ mode });
      const initialized = new Promise((resolve) => { bridge.oninitialized = resolve; });
      await bridge.connect(new PostMessageTransport(iframe.contentWindow, iframe.contentWindow));
      iframe.src = widgetUrl;
      await initialized;
      await bridge.sendToolInput({ arguments: { demo: true, view: kind } });
      const structuredContent = demoResult(kind);
      await bridge.sendToolResult({ content: [{ type: "text", text: "Kling AI 本地演示结果" }], structuredContent });
      setStatus("");
    };
    const run = () => connect().catch((error) => setStatus(`Widget 连接失败：${error instanceof Error ? error.message : String(error)}`));
    run();
    return () => { bridge?.close(); };
  }, [kind, widgetUrl]);
  return <div style={{ position: "relative" }}>
    {status && <div role="status" style={{ position: "absolute", inset: "18px auto auto 18px", zIndex: 2, color: "#9eb7ae", fontSize: 13 }}>{status}</div>}
    <iframe key={kind} ref={iframeRef} title={`Kling AI ${kind} Widget`} sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-downloads" style={{ width: "100%", height: 620, border: 0, borderRadius: 14, background: "#111715" }} />
  </div>;
}

function KlingOverlay() {
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState("generation");
  return <div style={{ pointerEvents: "auto", position: "fixed", right: 24, bottom: 24, zIndex: 10000, fontFamily: "Inter, system-ui, sans-serif" }}>
    {open && <section aria-label="Kling AI Widget 面板" style={{ width: "min(1040px, calc(100vw - 48px))", height: "min(820px, calc(100vh - 110px))", marginBottom: 14, padding: 14, border: "1px solid #315a4f", borderRadius: 18, background: "#0d1412", boxShadow: "0 24px 80px rgba(0,0,0,.55)", color: "#eef8f4" }}>
      <header style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
        <div><strong style={{ fontSize: 18 }}>Kling AI · MCP Apps</strong><div style={{ fontSize: 12, color: "#8eaaa1" }}>DeepSeek Harness 本地适配 · 不消耗生成额度</div></div>
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
  ctx.slots.inject("shell.overlay", () => ctx.slots.register({ name: "shell.overlay", id: "kling-ai-widget", order: 100, label: "Kling AI Widget" }, KlingOverlay));
}
