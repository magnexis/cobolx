import fs from "node:fs";
import path from "node:path";
import { formatDiagnostic } from "@cobolx/compiler";
import type { Diagnostic } from "@cobolx/compiler";
import { lintSource } from "@cobolx/linter";
import { readManifest } from "@cobolx/cargox";
import { manifestPath } from "../project.js";

export function runLintCommand(projectDir: string): number {
  const manifest = readManifest(manifestPath(projectDir));
  const inputPath = path.join(projectDir, manifest.package.entry);
  const diagnostics = lintSource(fs.readFileSync(inputPath, "utf8"));
  for (const diagnostic of diagnostics as Diagnostic[]) {
    console.log(formatDiagnostic(inputPath, diagnostic));
  }
  return diagnostics.some((diagnostic) => diagnostic.severity === "error") ? 1 : 0;
}
