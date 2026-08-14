import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

export const name = "kling-ai-deepseek-harness";
export const inject = ["webServer", "skills"];

const sourceFiles = [
  ["/kling-ai-widgets/generation", "./mcp-app/exports/image-video-generation.html"],
  ["/kling-ai-widgets/upload", "./mcp-app/exports/upload.html"],
  ["/kling-ai-widgets/showcase", "./mcp-app/exports/showcase.html"],
];

function splitWidget(path, html) {
  const diagnostics = `<script>window.__KLING_ERRORS__=[];window.addEventListener("error",e=>window.__KLING_ERRORS__.push(String(e.message)+(e.error?.stack?'\\n'+e.error.stack:'')));window.addEventListener("unhandledrejection",e=>window.__KLING_ERRORS__.push(String(e.reason?.stack||e.reason)));document.addEventListener("DOMContentLoaded",()=>{document.body.dataset.klingScripts="running";setTimeout(()=>{const root=document.getElementById("gallery-root");if(root&&!root.childElementCount){const pre=document.createElement("pre");pre.style.cssText="padding:20px;color:#ffb4b4;background:#0c0f0e;white-space:pre-wrap";pre.textContent="Kling Widget did not mount.\\n"+(window.__KLING_ERRORS__.join("\\n")||"No browser error was reported.");document.body.append(pre)}},800)})</script>`;
  const moduleStart = html.indexOf('<script type="module" crossorigin>');
  const openEnd = html.indexOf(">", moduleStart) + 1;
  const closeStart = html.indexOf("</script>\n    <style", openEnd);
  const moduleEnd = closeStart + "</script>".length;
  const script = html.slice(openEnd, closeStart)
    .replace("if(window.parent===window)return;", "")
    .replaceAll("import.meta.url", "location.href");
  const withoutModule = `${html.slice(0, moduleStart)}${html.slice(moduleEnd)}`;
  const bodyEnd = withoutModule.lastIndexOf("</body>");
  const document = `${withoutModule.slice(0, bodyEnd)}<script src="${path}.js" defer></script>${withoutModule.slice(bodyEnd)}`
    .replace("<head>", `<head>${diagnostics}`);
  return { document, script: `${script}\ndocument.documentElement.dataset.klingBundle="executed";\n` };
}

const resources = new Map();
for (const [path, relative] of sourceFiles) {
  const source = readFileSync(fileURLToPath(new URL(relative, import.meta.url)), "utf8");
  const { document, script } = splitWidget(path, source);
  resources.set(path, { body: document, type: "text/html; charset=utf-8" });
  resources.set(`${path}.js`, { body: script, type: "text/javascript; charset=utf-8" });
}

export function apply(ctx) {
  const skillPath = fileURLToPath(new URL("./skills/kling-ai/SKILL.md", import.meta.url));
  const skillSource = readFileSync(skillPath, "utf8");
  const skillContent = skillSource.replace(/^---\n[\s\S]*?\n---\n/, "");
  const disposeSkill = ctx.skills.register({
    name: "kling-ai",
    description: "通过真实 Kling OAuth MCP 服务创建、查询图片和视频，并在提交计费任务前等待用户确认。",
    content: skillContent,
    path: skillPath,
  });
  const disposers = [...resources].map(([path, resource]) => ctx.webServer.register({
    kind: "exact",
    path,
    handler(_req, res) {
      res.writeHead(200, {
        "content-type": resource.type,
        "cache-control": "no-store",
      });
      res.end(resource.body);
    },
  }));
  return () => {
    disposeSkill();
    disposers.forEach((dispose) => dispose());
  };
}
