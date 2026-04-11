import fs from "node:fs";

export function writeLockfile(lockfilePath: string, root: string, dependencies: Record<string, string>): void {
  const lines = [`workspace = "${root}"`];
  for (const [name, version] of Object.entries(dependencies)) {
    lines.push(`${name} = "${version}"`);
  }
  fs.writeFileSync(lockfilePath, `${lines.join("\n")}\n`, "utf8");
}
