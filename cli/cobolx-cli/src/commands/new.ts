import fs from "node:fs";
import path from "node:path";
import { scaffoldProject } from "../project.js";

export function runNewCommand(projectName?: string, template = "default"): number {
  if (!projectName) {
    console.error("Usage: cobolx new <project-name> [default|api|microservice|cli]");
    return 1;
  }

  const targetDir = path.resolve(projectName);
  if (fs.existsSync(targetDir)) {
    console.error(`Directory already exists: ${targetDir}`);
    return 1;
  }

  scaffoldProject(targetDir, projectName, template);
  console.log(`Created COBOLX project at ${targetDir}`);
  return 0;
}
