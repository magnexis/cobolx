import fs from "node:fs";
export function readManifest(manifestPath) {
    const raw = fs.readFileSync(manifestPath, "utf8");
    const result = {
        package: { name: "app", version: "0.1.0", entry: "src/main.cbx" },
        dependencies: {}
    };
    let section = "";
    for (const line of raw.split(/\r?\n/)) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#")) {
            continue;
        }
        const sectionMatch = /^\[(.+)\]$/.exec(trimmed);
        if (sectionMatch) {
            section = sectionMatch[1];
            continue;
        }
        const kv = /^([A-Za-z0-9_.-]+)\s*=\s*"(.*)"$/.exec(trimmed);
        if (!kv) {
            continue;
        }
        const [, key, value] = kv;
        if (section === "package" || section === "workspace") {
            if (key === "name" || key === "version" || key === "entry") {
                result.package[key] = value;
            }
        }
        else if (section === "dependencies") {
            result.dependencies[key] = value;
        }
    }
    return result;
}
export function writeManifest(manifestPath, manifest) {
    const lines = [
        "[package]",
        `name = "${manifest.package.name}"`,
        `version = "${manifest.package.version}"`,
        `entry = "${manifest.package.entry}"`,
        "",
        "[dependencies]"
    ];
    for (const [name, version] of Object.entries(manifest.dependencies)) {
        lines.push(`${name} = "${version}"`);
    }
    fs.writeFileSync(manifestPath, `${lines.join("\n")}\n`, "utf8");
}
//# sourceMappingURL=manifest.js.map