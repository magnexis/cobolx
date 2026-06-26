import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

export function runTaskCommand(projectDir: string, taskName = "build"): number {
  const tasksFile = path.join(projectDir, "cobolx.tasks.json");
  if (!fs.existsSync(tasksFile)) {
    console.error("No cobolx.tasks.json found");
    return 1;
  }
  const tasks = JSON.parse(fs.readFileSync(tasksFile, "utf8")) as Record<string, string[]>;
  const steps = tasks[taskName];
  if (!steps) {
    console.error(`Task '${taskName}' not found`);
    return 1;
  }
  for (const step of steps) {
    const cliEntry = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../index.js");
    const result = spawnSync(process.execPath, [cliEntry, ...step.split(" ")], {
      cwd: projectDir,
      stdio: "inherit"
    });
    if ((result.status ?? 1) !== 0) return result.status ?? 1;
  }
  return 0;
}
