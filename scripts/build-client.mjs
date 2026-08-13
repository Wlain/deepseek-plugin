import { build } from "esbuild";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const widgets = {
  generation: await readFile(resolve(root, "mcp-app/exports/image-video-generation.html"), "utf8"),
  upload: await readFile(resolve(root, "mcp-app/exports/upload.html"), "utf8"),
  showcase: await readFile(resolve(root, "mcp-app/exports/showcase.html"), "utf8"),
};

const result = await build({
  entryPoints: [resolve(root, "src/client.jsx")],
  bundle: true,
  format: "cjs",
  platform: "browser",
  target: "es2022",
  write: false,
  external: ["react"],
  define: { __KLING_WIDGETS__: JSON.stringify(widgets) },
});

const body = result.outputFiles[0].text;
const wrapped = `window.__ModuleLoader__.load({\n  id: "kling-ai-deepseek-harness",\n  factory: (require) => {\n    const module = { exports: {} };\n    const exports = module.exports;\n${body.split("\n").map((line) => `    ${line}`).join("\n")}\n    return module.exports;\n  },\n});\n`;
await mkdir(resolve(root, "lib"), { recursive: true });
await writeFile(resolve(root, "lib/client.js"), wrapped);
