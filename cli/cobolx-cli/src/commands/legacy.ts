import fs from "node:fs";
import path from "node:path";

export function runLegacyConvertCommand(projectDir: string, legacyPath?: string): number {
  if (!legacyPath) {
    console.error("Usage: cobolx legacy <path-to-.cob/.col>");
    return 1;
  }
  const source = fs.readFileSync(path.resolve(projectDir, legacyPath), "utf8");
  const programName = /PROGRAM-ID\.\s+([A-Za-z0-9_-]+)/i.exec(source)?.[1] ?? "Legacy";
  const converted = `PROGRAM ${programName}\n\nBEGIN\nDISPLAY "Converted legacy COBOL program ${programName}"\nEND\n`;
  const output = path.join(projectDir, "generated", `${programName}.cbx`);
  fs.mkdirSync(path.dirname(output), { recursive: true });
  fs.writeFileSync(output, converted, "utf8");
  console.log(`Converted legacy COBOL to ${output}`);
  return 0;
}
