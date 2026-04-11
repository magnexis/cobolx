import { spawnSync } from "node:child_process";

export function debugNodeProgram(programPath: string): number {
  console.log(`[debug] starting ${programPath}`);
  const result = spawnSync(process.execPath, ["--inspect-brk=0", programPath], {
    stdio: "inherit"
  });
  return result.status ?? 1;
}
