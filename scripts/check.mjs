import { access, readFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
await access(resolve(root, "mcp-app/exports/image-video-generation.html"));
await access(resolve(root, "mcp-app/exports/upload.html"));
await access(resolve(root, "mcp-app/exports/showcase.html"));
const client = await readFile(resolve(root, "lib/client.js"), "utf8");
for (const marker of ["kling-ai-deepseek-harness", "sendToolResult", "shell.overlay"]) {
  if (!client.includes(marker)) throw new Error(`Missing built marker: ${marker}`);
}
console.log("DeepSeek Harness Kling Widget bundle is valid.");
