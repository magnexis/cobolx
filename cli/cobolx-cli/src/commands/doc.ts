import fs from "node:fs";
import path from "node:path";
import { parseSource } from "@cobolx/compiler";
import { readManifest, manifestPath } from "../project.js";

export function runDocCommand(projectDir: string): number {
  const manifest = readManifest(manifestPath(projectDir));
  const sourcePath = path.join(projectDir, manifest.package.entry);
  const source = fs.readFileSync(sourcePath, "utf8");
  const program = parseSource(source);
  const outputDir = path.join(projectDir, "docs-output");
  fs.mkdirSync(outputDir, { recursive: true });
  const html = `<!doctype html><html><body><h1>${program.name}</h1><h2>Functions</h2><ul>${program.functions
    .map((fn) => `<li><strong>${fn.signature.name}</strong><p>${(fn.docs ?? []).join(" ")}</p></li>`)
    .join("")}</ul><h2>Traits</h2><ul>${program.traits.map((trait) => `<li>${trait.name}</li>`).join("")}</ul></body></html>`;
  fs.writeFileSync(path.join(outputDir, "index.html"), html, "utf8");
  console.log(`Generated docs at ${path.join(outputDir, "index.html")}`);
  return 0;
}
