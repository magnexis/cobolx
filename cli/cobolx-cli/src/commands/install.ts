import fs from "node:fs";
import path from "node:path";
import { readManifest, resolveDependencyGraph, writeLockfile } from "@cobolx/cargox";
import { lockfilePath, manifestPath } from "../project.js";

export function runInstallCommand(projectDir: string): number {
  const manifest = readManifest(manifestPath(projectDir));
  const graph = resolveDependencyGraph(manifest.package.name, manifest.dependencies);
  const packagesDir = path.join(projectDir, ".cargox", "packages");
  fs.mkdirSync(packagesDir, { recursive: true });

  for (const [name, version] of Object.entries(graph.dependencies)) {
    const packageDir = path.join(packagesDir, `${name}-${version}`);
    fs.mkdirSync(packageDir, { recursive: true });
    fs.writeFileSync(
      path.join(packageDir, "manifest.json"),
      JSON.stringify({ name, version, installedAt: new Date().toISOString() }, null, 2),
      "utf8"
    );
  }

  writeLockfile(lockfilePath(projectDir), graph.root, graph.dependencies);
  console.log(`Installed ${Object.keys(graph.dependencies).length} package(s)`);
  return 0;
}
