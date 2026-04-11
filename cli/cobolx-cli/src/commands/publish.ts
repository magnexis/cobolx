import fs from "node:fs";
import path from "node:path";
import { publishToLocalRegistry, readManifest } from "@cobolx/cargox";
import { manifestPath } from "../project.js";

export function runPublishCommand(projectDir: string): number {
  const manifest = readManifest(manifestPath(projectDir));
  const entryPath = path.join(projectDir, manifest.package.entry);
  const registryDir = path.join(projectDir, ".cargox-registry");
  const publishedDir = publishToLocalRegistry(registryDir, manifest.package.name, manifest.package.version, [
    { path: "cobolx.toml", content: fs.readFileSync(manifestPath(projectDir), "utf8") },
    { path: manifest.package.entry, content: fs.readFileSync(entryPath, "utf8") }
  ]);
  console.log(`Published ${manifest.package.name}@${manifest.package.version} to ${publishedDir}`);
  return 0;
}
