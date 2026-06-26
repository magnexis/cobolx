import path from "node:path";
import { spawnSync } from "node:child_process";
import { type BuildOptions, runBuildCommand } from "./build.js";

export function runRunCommand(projectDir: string, options: BuildOptions = {}): number {
  const buildExitCode = runBuildCommand(projectDir, options);
  if (buildExitCode !== 0) {
    return buildExitCode;
  }

  const builtFile = path.join(projectDir, "dist", options.target === "wasm" ? "main.wasm.mjs" : "main.mjs");
  const traceFile = path.join(projectDir, "dist", "debug-timeline.json");
  const result = spawnSync(process.execPath, [builtFile], {
    cwd: projectDir,
    stdio: "inherit",
    env: {
      ...process.env,
      COBOLX_DEBUG_TRACE_FILE: traceFile
    }
  });
  return result.status ?? 1;
}
