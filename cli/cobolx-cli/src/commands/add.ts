import { readManifest, resolveDependencyGraph, writeLockfile, writeManifest } from "@cobolx/cargox";
import { lockfilePath, manifestPath } from "../project.js";

export function runAddCommand(projectDir: string, dependencyName?: string, version = "0.1.0"): number {
  if (!dependencyName) {
    console.error("Usage: cobolx add <dependency> [version]");
    return 1;
  }

  const manifestFile = manifestPath(projectDir);
  const manifest = readManifest(manifestFile);
  manifest.dependencies[dependencyName] = version;
  writeManifest(manifestFile, manifest);
  const graph = resolveDependencyGraph(manifest.package.name, manifest.dependencies);
  writeLockfile(lockfilePath(projectDir), graph.root, graph.dependencies);
  console.log(`Added dependency ${dependencyName}@${version}`);
  return 0;
}
