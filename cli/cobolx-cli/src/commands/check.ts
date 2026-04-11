import path from "node:path";
import { CobolxError, checkFile, printDiagnostics } from "@cobolx/compiler";
import { readManifest, manifestPath } from "../project.js";

export function runCheckCommand(projectDir: string): number {
  try {
    const manifest = readManifest(manifestPath(projectDir));
    const inputPath = path.join(projectDir, manifest.package.entry);
    const diagnostics = checkFile(inputPath);
    const hasErrors = diagnostics.some((diagnostic) => diagnostic.severity === "error");
    if (diagnostics.length > 0) {
      printDiagnostics(inputPath, diagnostics);
      if (hasErrors) return 1;
    }
    console.log("Check completed successfully");
    return 0;
  } catch (error) {
    if (error instanceof CobolxError) {
      console.error(error.message);
      return 1;
    }
    throw error;
  }
}
