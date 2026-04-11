import fs from "node:fs";
export function writeLockfile(lockfilePath, root, dependencies) {
    const lines = [`workspace = "${root}"`];
    for (const [name, version] of Object.entries(dependencies)) {
        lines.push(`${name} = "${version}"`);
    }
    fs.writeFileSync(lockfilePath, `${lines.join("\n")}\n`, "utf8");
}
//# sourceMappingURL=index.js.map