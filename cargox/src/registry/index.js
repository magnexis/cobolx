import fs from "node:fs";
import path from "node:path";
export function publishToLocalRegistry(registryDir, name, version, files) {
    const packageDir = path.join(registryDir, name, version);
    fs.mkdirSync(packageDir, { recursive: true });
    for (const file of files) {
        const target = path.join(packageDir, file.path);
        fs.mkdirSync(path.dirname(target), { recursive: true });
        fs.writeFileSync(target, file.content, "utf8");
    }
    return packageDir;
}
//# sourceMappingURL=index.js.map