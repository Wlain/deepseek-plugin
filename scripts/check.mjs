import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const files = ["index.js", "cordis.patch.yml", "skills/kling-ai/SKILL.md", "package.json"];
for (const file of files) {
  const text = await readFile(resolve(root, file), "utf8");
  if (/mcp-app|kling[-_]mcp-app/u.test(text)) {
    throw new Error(`${file} must not depend on the local MCP App`);
  }
}
const patch = await readFile(resolve(root, "cordis.patch.yml"), "utf8");
if (!patch.includes("https://klingai.com/mcp")) throw new Error("Remote Kling MCP URL is missing");
console.log("DeepSeek Kling remote MCP plugin is valid.");
