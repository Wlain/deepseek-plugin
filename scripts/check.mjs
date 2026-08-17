import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const files = ["index.js", "cordis.patch.yml", "cordis.global.patch.yml", "skills/kling-ai/SKILL.md", "package.json"];
for (const file of files) {
  const text = await readFile(resolve(root, file), "utf8");
  if (/mcp-app|kling[-_]mcp-app/u.test(text)) {
    throw new Error(`${file} must not depend on the local MCP App`);
  }
}
const patch = await readFile(resolve(root, "cordis.patch.yml"), "utf8");
const globalPatch = await readFile(resolve(root, "cordis.global.patch.yml"), "utf8");
if (!patch.includes("https://klingai.com/mcp") || patch.includes("https://kling.ai/mcp")) {
  throw new Error("China Kling MCP patch is invalid");
}
if (!globalPatch.includes("https://kling.ai/mcp") || globalPatch.includes("https://klingai.com/mcp")) {
  throw new Error("Global Kling MCP patch is invalid");
}
console.log("DeepSeek Kling regional remote MCP templates are valid.");
