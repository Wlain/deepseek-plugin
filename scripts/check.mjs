import { access, readFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const MCP_REMOTE_VERSION = "0.2.0";
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
if (!patch.includes("- insert:") || globalPatch.includes("- insert:")) {
  throw new Error("China must be the bundle insert; Global must replace that row without adding a second MCP client");
}
for (const [region, text] of [["China", patch], ["Global", globalPatch]]) {
  for (const phrase of [
    `mcp-remote@${MCP_REMOTE_VERSION}`,
    "--static-oauth-client-metadata",
    "Plugin-DeepSeek",
    "--header",
    "X-Kling-Integration:Plugin-DeepSeek",
    "--auth-timeout",
    "'180'",
  ]) {
    if (!text.includes(phrase)) throw new Error(`${region} patch is missing: ${phrase}`);
  }
  if (text.includes("mcp-remote@latest")) {
    throw new Error(`${region} patch must pin mcp-remote`);
  }
}
const packageJson = JSON.parse(await readFile(resolve(root, "package.json"), "utf8"));
if (packageJson.scripts?.build || packageJson.files?.some((path) => path.startsWith("src"))) {
  throw new Error("DeepSeek release must remain tools-only until the official MCP client consumes resources");
}
for (const retiredPath of ["src/client.jsx", "lib/client.js", "mcp-app"]) {
  try {
    await access(resolve(root, retiredPath));
    throw new Error(`DeepSeek retired local Widget runtime still exists: ${retiredPath}`);
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
  }
}
const readme = await readFile(resolve(root, "README.md"), "utf8");
if (readme.includes("npm run build")
  || readme.includes("Kling Widget**")
  || readme.includes("mcp__kling-ai__")) {
  throw new Error("DeepSeek README advertises an unshipped build, Widget, or stale tool namespace");
}
if (!readme.includes('dsh plugin --profile web add "$PWD"')) {
  throw new Error("DeepSeek README must install the current package directory after changing into it");
}
console.log("DeepSeek Kling regional remote MCP templates are valid.");
