import fs from "node:fs";
import path from "node:path";
import { loadTimeline } from "@cobolx/runtime";

export function runDebugRewindCommand(projectDir: string): number {
  const tracePath = path.join(projectDir, "dist", "debug-timeline.json");
  if (!fs.existsSync(tracePath)) {
    console.error(`No debug trace found at ${tracePath}. Run the program with tracing first.`);
    return 1;
  }
  const timeline = loadTimeline(tracePath);
  for (const entry of timeline.slice().reverse()) {
    console.log(`[rewind step ${entry.step}] ${entry.action} ${JSON.stringify(entry.state)}`);
  }
  return 0;
}
