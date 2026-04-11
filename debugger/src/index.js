import { spawnSync } from "node:child_process";
export function debugNodeProgram(programPath) {
    console.log(`[debug] starting ${programPath}`);
    const result = spawnSync(process.execPath, ["--inspect-brk=0", programPath], {
        stdio: "inherit"
    });
    return result.status ?? 1;
}
//# sourceMappingURL=index.js.map