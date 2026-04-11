import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import { readManifest, manifestPath } from "../project.js";
import { runBuildCommand } from "./build.js";

export function runDevCommand(projectDir: string): number {
  const manifest = readManifest(manifestPath(projectDir));
  const sourcePath = path.join(projectDir, manifest.package.entry);
  let child: ReturnType<typeof spawn> | undefined;

  const restart = (): void => {
    child?.kill();
    const built = runBuildCommand(projectDir);
    if (built !== 0) return;
    const output = path.join(projectDir, "dist", "main.mjs");
    child = spawn(process.execPath, [output], { cwd: projectDir, stdio: "inherit" });
  };

  restart();
  fs.watch(sourcePath, { persistent: true }, () => restart());
  console.log(`Watching ${sourcePath} for hot reload changes. Press Ctrl+C to stop.`);
  return 0;
}
