import fs from "node:fs";
import path from "node:path";
import { discoverService, healthCheck, registerService } from "@cobolx/runtime";
import { runBuildCommand } from "./build.js";

export function runDeployCommand(projectDir: string): number {
  const built = runBuildCommand(projectDir, { release: true });
  if (built !== 0) return built;
  const serviceName = path.basename(projectDir);
  const address = `node://${serviceName}`;
  registerService(serviceName, address);
  const status = healthCheck(serviceName, true, { address });
  const out = path.join(projectDir, "generated", "deploy.json");
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, JSON.stringify({ service: serviceName, address, status, discovered: discoverService(serviceName) }, null, 2), "utf8");
  console.log(`Deployed ${serviceName} to ${address}`);
  return 0;
}
