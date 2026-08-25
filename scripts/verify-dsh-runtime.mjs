#!/usr/bin/env node

import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve } from "node:path";

const packageRoot = resolve(import.meta.dirname, "..");
const dshHome = await mkdtemp(resolve(tmpdir(), "kling-dsh-runtime-"));

const runDsh = (args) => spawnSync("dsh", args, {
  encoding: "utf8",
  env: { ...process.env, DSH_HOME: dshHome },
});

const requireSuccess = (result, step) => {
  if (result.error?.code === "ENOENT") {
    throw new Error("DeepSeek Harness CLI (dsh) is not installed");
  }
  if (result.status !== 0) {
    throw new Error(`${step} failed in the isolated profile: ${result.stderr}`);
  }
  return result.stdout;
};

try {
  requireSuccess(
    runDsh(["plugin", "--profile", "web", "add", packageRoot]),
    "plugin installation",
  );

  const cases = [
    {
      region: "China",
      args: ["--profile", "web", "--dump-config"],
      endpoint: "https://klingai.com/mcp",
      forbiddenEndpoint: "https://kling.ai/mcp",
    },
    {
      region: "Global",
      args: [
        "--profile",
        "web",
        "--patch",
        resolve(packageRoot, "cordis.global.patch.yml"),
        "--dump-config",
      ],
      endpoint: "https://kling.ai/mcp",
      forbiddenEndpoint: "https://klingai.com/mcp",
    },
  ];

  for (const testCase of cases) {
    const output = requireSuccess(runDsh(testCase.args), `${testCase.region} config composition`);
    const rowCount = output.split("serverName: Plugin-DeepSeek-kling-ai").length - 1;
    assert.equal(rowCount, 1, `${testCase.region} must compose exactly one Kling MCP row`);
    assert.ok(output.includes(testCase.endpoint), `${testCase.region} endpoint is missing`);
    assert.ok(!output.includes(testCase.forbiddenEndpoint), `${testCase.region} also activates the other endpoint`);
    for (const expected of ["mcp-remote@0.2.0", "--auth-timeout", "180"]) {
      assert.ok(output.includes(expected), `${testCase.region} config is missing ${expected}`);
    }
  }

  console.log("DeepSeek Harness isolated install verified: China and Global each compose exactly one pinned Kling MCP bridge.");
} finally {
  await rm(dshHome, { recursive: true, force: true });
}
