import { mkdtempSync, rmSync, existsSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

const root = process.cwd();
const cli = path.join(root, "cli", "cobolx-cli", "dist", "index.js");
const tempRoot = mkdtempSync(path.join(tmpdir(), "cobolx-validate-"));

function run(command, args, cwd = root) {
  const result = spawnSync(process.execPath, [cli, command, ...args], {
    cwd,
    encoding: "utf8",
    stdio: "pipe"
  });
  if ((result.status ?? 1) !== 0) {
    throw new Error(`Command failed: cobolx ${command} ${args.join(" ")}\n${result.stdout}\n${result.stderr}`);
  }
  return `${result.stdout}${result.stderr}`;
}

try {
  run("build", []);
  run("test", []);
  run("bench", []);

  const projectDir = path.join(tempRoot, "release-app");
  run("new", [projectDir, "api"]);
  run("add", ["ledger", "1.2.3"], projectDir);
  run("install", [], projectDir);
  run("update", [], projectDir);
  run("check", [], projectDir);
  run("build", ["--release"], projectDir);
  run("run", [], projectDir);
  run("doc", [], projectDir);
  run("generate", ["api"], projectDir);
  run("generate", ["client", "typescript"], projectDir);
  run("migrate", ["create", "init"], projectDir);
  run("migrate", ["run"], projectDir);
  run("visualize", [], projectDir);
  run("deploy", [], projectDir);
  run("debug", ["--rewind"], projectDir);

  if (!existsSync(path.join(projectDir, "dist", "main.mjs"))) throw new Error("Missing built main.mjs");
  if (!existsSync(path.join(projectDir, "dist", "debug-timeline.json"))) throw new Error("Missing debug timeline");
  if (!existsSync(path.join(projectDir, "docs-output", "index.html"))) throw new Error("Missing generated docs");
  if (!existsSync(path.join(projectDir, "generated", "deploy.json"))) throw new Error("Missing deploy metadata");
  const deploy = JSON.parse(readFileSync(path.join(projectDir, "generated", "deploy.json"), "utf8"));
  if (!deploy.service) throw new Error("Deploy metadata missing service name");

  console.log("Release validation completed successfully");
} finally {
  rmSync(tempRoot, { recursive: true, force: true });
}
