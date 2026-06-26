import fs from "node:fs";
import path from "node:path";
import { CobolxError, analyzeSource } from "@cobolx/compiler";
import { readManifest, manifestPath } from "../project.js";

export function runFuzzCommand(projectDir: string, target = "parser"): number {
  const manifest = readManifest(manifestPath(projectDir));
  const sourcePath = path.join(projectDir, manifest.package.entry);
  const source = fs.readFileSync(sourcePath, "utf8");
  const seeds = [source, source.replace(/DISPLAY/g, "DISPLAY"), source.slice(0, Math.max(1, source.length - 1)), `${source}\nDISPLAY "fuzz"`];
  for (const seed of seeds) {
    try {
      analyzeSource(seed);
    } catch (error) {
      if (error instanceof CobolxError) {
        continue;
      }
      console.error(`Fuzz case crashed ${target}: ${String(error)}`);
      return 1;
    }
  }
  console.log(`Fuzzed ${target} with ${seeds.length} mutated inputs`);
  return 0;
}
