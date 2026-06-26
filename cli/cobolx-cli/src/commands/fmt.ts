import fs from "node:fs";
import path from "node:path";
import { formatSource } from "@cobolx/formatter";
import { readManifest } from "@cobolx/cargox";
import { manifestPath } from "../project.js";

export function runFmtCommand(projectDir: string): number {
  const manifest = readManifest(manifestPath(projectDir));
  const inputPath = path.join(projectDir, manifest.package.entry);
  const source = fs.readFileSync(inputPath, "utf8");
  fs.writeFileSync(inputPath, formatSource(source), "utf8");
  console.log(`Formatted ${inputPath}`);
  return 0;
}
