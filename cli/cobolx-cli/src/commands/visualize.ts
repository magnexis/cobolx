import fs from "node:fs";
import path from "node:path";
import { parseSource } from "@cobolx/compiler";
import { readManifest, manifestPath } from "../project.js";

export function runVisualizeCommand(projectDir: string): number {
  const manifest = readManifest(manifestPath(projectDir));
  const sourcePath = path.join(projectDir, manifest.package.entry);
  const program = parseSource(fs.readFileSync(sourcePath, "utf8"));
  const output = path.join(projectDir, "generated", "flowchart.mmd");
  fs.mkdirSync(path.dirname(output), { recursive: true });

  const lines = ["flowchart TD", `  A[Program ${program.name}]`];
  let previous = "A";
  program.body.forEach((statement, index) => {
    const node = `N${index}`;
    lines.push(`  ${node}[${statement.kind}]`);
    lines.push(`  ${previous} --> ${node}`);
    previous = node;
  });

  fs.writeFileSync(output, `${lines.join("\n")}\n`, "utf8");
  console.log(`Generated visualization ${output}`);
  return 0;
}
