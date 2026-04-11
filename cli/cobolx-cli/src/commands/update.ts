import { readManifest, writeManifest } from "@cobolx/cargox";
import { manifestPath } from "../project.js";
import { runInstallCommand } from "./install.js";

function bumpPatch(version: string): string {
  const match = /^(\d+)\.(\d+)\.(\d+)$/.exec(version.trim());
  if (!match) return version;
  const [, major, minor, patch] = match;
  return `${major}.${minor}.${Number(patch) + 1}`;
}

export function runUpdateCommand(projectDir: string): number {
  const manifestFile = manifestPath(projectDir);
  const manifest = readManifest(manifestFile);
  const updated: string[] = [];

  for (const [name, version] of Object.entries(manifest.dependencies)) {
    const nextVersion = bumpPatch(version);
    manifest.dependencies[name] = nextVersion;
    if (nextVersion !== version) {
      updated.push(`${name}: ${version} -> ${nextVersion}`);
    }
  }

  writeManifest(manifestFile, manifest);
  const installExitCode = runInstallCommand(projectDir);
  if (installExitCode !== 0) return installExitCode;
  console.log(updated.length > 0 ? `Updated dependencies:\n${updated.join("\n")}` : "Dependencies already up to date");
  return 0;
}
