import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { CobolxError, compileFile, compilerStdlibDir, printDiagnostics } from "@cobolx/compiler";

export function runTestCommand(projectDir: string): number {
  const testsDir = path.join(projectDir, "tests");
  if (!fs.existsSync(testsDir)) {
    console.log("No tests directory found");
    return 0;
  }
  try {
    const files = fs.readdirSync(testsDir).filter((file) => file.endsWith(".cbx"));
    const outDir = path.join(projectDir, "dist", "tests");
    fs.mkdirSync(outDir, { recursive: true });
      for (const file of files) {
        const inputPath = path.join(testsDir, file);
        const outputPath = path.join(outDir, file.replace(/\.cbx$/i, ".mjs"));
        const diagnostics = compileFile(inputPath, outputPath, compilerStdlibDir());
        const hasErrors = diagnostics.some((diagnostic) => diagnostic.severity === "error");
        if (diagnostics.length > 0) {
          printDiagnostics(inputPath, diagnostics);
          if (hasErrors) return 1;
        }
        const result = spawnSync(process.execPath, [outputPath], {
          cwd: projectDir,
        encoding: "utf8",
        stdio: "inherit"
      });
        if ((result.status ?? 1) !== 0) {
        console.error(`Test failed: ${file}`);
        return result.status ?? 1;
      }
    }
    console.log(`Executed ${files.length} test file(s)`);
    return 0;
  } catch (error) {
    if (error instanceof CobolxError) {
      console.error(error.message);
      return 1;
    }
    throw error;
  }
}
