import { profile } from "@cobolx/profiler";
import { runRunCommand } from "./run.js";

export async function runProfileCommand(projectDir: string): Promise<number> {
  const measurement = await profile("run", () => runRunCommand(projectDir));
  console.log(`Profile: ${measurement.label} completed in ${measurement.durationMs.toFixed(2)}ms`);
  return measurement.result;
}
