import path from "node:path";
import fs from "node:fs";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import { CobolxError, compileFile, printDiagnostics } from "@cobolx/compiler";
import { compilerStdlibDir } from "@cobolx/compiler";
import { readManifest, manifestPath } from "../project.js";

export interface BuildOptions {
  release?: boolean;
  target?: string;
}

const TOOLCHAIN_CACHE_VERSION = "1.0.0";

function buildCachePath(projectDir: string): string {
  return path.join(projectDir, ".cobolx-cache", "build.json");
}

function sourceHash(value: string): string {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function toolchainFingerprint(): string {
  const currentFile = fileURLToPath(import.meta.url);
  const toolchainFiles = [
    currentFile,
    path.resolve(path.dirname(currentFile), "../../../compiler/dist/index.js"),
    path.resolve(path.dirname(currentFile), "../../../stdlib/core/runtime.js")
  ];
  return toolchainFiles
    .filter((file) => fs.existsSync(file))
    .map((file) => `${path.basename(file)}:${fs.statSync(file).mtimeMs}`)
    .join("|");
}

export function runBuildCommand(projectDir: string, options: BuildOptions = {}): number {
  try {
    const manifest = readManifest(manifestPath(projectDir));
    const inputPath = path.join(projectDir, manifest.package.entry);
    const target = options.target ?? "node";
    const outputPath = path.join(projectDir, "dist", target === "wasm" ? "main.wasm.mjs" : "main.mjs");
    const source = fs.readFileSync(inputPath, "utf8");
    const cachePath = buildCachePath(projectDir);
    const cacheKey = sourceHash(`${TOOLCHAIN_CACHE_VERSION}:${toolchainFingerprint()}:${source}:${options.release ? "release" : "debug"}:${target}`);
    if (fs.existsSync(cachePath)) {
      const previous = JSON.parse(fs.readFileSync(cachePath, "utf8")) as { key?: string; outputPath?: string };
      if (previous.key === cacheKey && previous.outputPath === outputPath && fs.existsSync(outputPath)) {
        console.log(`Reused incremental build cache for ${outputPath}`);
        return 0;
      }
    }
    const diagnostics = compileFile(inputPath, outputPath, compilerStdlibDir());
    const hasErrors = diagnostics.some((diagnostic) => diagnostic.severity === "error");

    if (diagnostics.length > 0) {
      printDiagnostics(inputPath, diagnostics);
    }
    if (hasErrors) {
      return 1;
    }

    fs.mkdirSync(path.dirname(cachePath), { recursive: true });
    fs.writeFileSync(cachePath, JSON.stringify({ key: cacheKey, outputPath, target, mode: options.release ? "release" : "debug" }, null, 2), "utf8");
    console.log(`Built ${outputPath}${options.release ? " [release]" : " [debug]"}${target !== "node" ? ` target=${target}` : ""}`);
    return 0;
  } catch (error) {
    if (error instanceof CobolxError) {
      console.error(error.message);
      return 1;
    }
    throw error;
  }
}
