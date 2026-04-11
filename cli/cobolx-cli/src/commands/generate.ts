import fs from "node:fs";
import path from "node:path";
import { parseSource } from "@cobolx/compiler";
import { readManifest, manifestPath } from "../project.js";

export function runGenerateCommand(projectDir: string, target?: string, arg?: string): number {
  const generatedDir = path.join(projectDir, "generated");
  fs.mkdirSync(generatedDir, { recursive: true });

  if (target === "api") {
    const file = path.join(generatedDir, "api.cbx");
    fs.writeFileSync(file, 'PROGRAM Api\n\nBEGIN\nDISPLAY "Generated API"\nEND\n', "utf8");
    console.log(`Generated ${file}`);
    return 0;
  }

  if (target === "model" && arg) {
    const file = path.join(generatedDir, `${arg}.cbx`);
    fs.writeFileSync(file, `PROGRAM ${arg}\n\nBEGIN\nDISPLAY "${arg}"\nEND\n`, "utf8");
    console.log(`Generated ${file}`);
    return 0;
  }

  if (target === "client" && arg === "typescript") {
    const manifest = readManifest(manifestPath(projectDir));
    const source = fs.readFileSync(path.join(projectDir, manifest.package.entry), "utf8");
    const program = parseSource(source);
    const file = path.join(generatedDir, "client-types.ts");
    const enums = program.enums.map((item) => `export type ${item.name} = ${item.variants.map((variant) => `'${variant.name}'`).join(" | ")};`).join("\n");
    const functions = program.functions.map((fn) => `export function ${fn.signature.name}(...args: unknown[]): Promise<unknown>;`).join("\n");
    fs.writeFileSync(file, `${enums}\n${functions}\n`, "utf8");
    console.log(`Generated ${file}`);
    return 0;
  }

  console.error("Usage: cobolx generate <api|model <Name>|client typescript>");
  return 1;
}
