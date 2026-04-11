import path from "node:path";
import { debugNodeProgram } from "@cobolx/debugger";
import { runBuildCommand } from "./build.js";
import { runDebugRewindCommand } from "./debug_rewind.js";

export function runDebugCommand(projectDir: string, rewind = false): number {
  if (rewind) {
    return runDebugRewindCommand(projectDir);
  }
  const buildExit = runBuildCommand(projectDir);
  if (buildExit !== 0) {
    return buildExit;
  }
  return debugNodeProgram(path.join(projectDir, "dist", "main.mjs"));
}
