import fs from "node:fs";
import path from "node:path";
import { profile } from "@cobolx/profiler";
import { CobolxError, compileFile, compilerStdlibDir, printDiagnostics } from "@cobolx/compiler";
import { spawnSync } from "node:child_process";

export async function runBenchCommand(projectDir: string): Promise<number> {
  const benchmarksDir = path.join(projectDir, "benchmarks");
  if (!fs.existsSync(benchmarksDir)) {
    console.log("No benchmarks directory found");
    return 0;
  }
  try {
    const files = fs.readdirSync(benchmarksDir).filter((file) => file.endsWith(".cbx"));
    const outDir = path.join(projectDir, "dist", "benchmarks");
    fs.mkdirSync(outDir, { recursive: true });
    let totalDuration = 0;
    for (const file of files) {
      const inputPath = path.join(benchmarksDir, file);
      const outputPath = path.join(outDir, file.replace(/\.cbx$/i, ".mjs"));
      const diagnostics = compileFile(inputPath, outputPath, compilerStdlibDir());
      const hasErrors = diagnostics.some((diagnostic) => diagnostic.severity === "error");
      if (diagnostics.length > 0) {
        printDiagnostics(inputPath, diagnostics);
        if (hasErrors) return 1;
      }
      const measurement = await profile(file, () => {
        const result = spawnSync(process.execPath, [outputPath], {
          cwd: projectDir,
          encoding: "utf8",
          stdio: "inherit"
        });
        return result.status ?? 1;
      });
      totalDuration += measurement.durationMs;
      if (measurement.result !== 0) return measurement.result;
    }
    console.log(`Benchmarked ${files.length} file(s) in ${totalDuration.toFixed(2)}ms`);
    return 0;
  } catch (error) {
    if (error instanceof CobolxError) {
      console.error(error.message);
      return 1;
    }
    throw error;
  }
}
