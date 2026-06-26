import fs from "node:fs";
import path from "node:path";
import { readManifest, writeManifest, writeLockfile } from "@cobolx/cargox";

export { readManifest };

export function manifestPath(projectDir: string): string {
  return path.join(projectDir, "cobolx.toml");
}

export function lockfilePath(projectDir: string): string {
  return path.join(projectDir, "CargoX.lock");
}

export function scaffoldProject(targetDir: string, projectName: string, template = "default"): void {
  const srcDir = path.join(targetDir, "src");
  const testsDir = path.join(targetDir, "tests");
  const benchmarksDir = path.join(targetDir, "benchmarks");
  const migrationsDir = path.join(targetDir, "migrations");
  const generatedDir = path.join(targetDir, "generated");
  fs.mkdirSync(srcDir, { recursive: true });
  fs.mkdirSync(testsDir, { recursive: true });
  fs.mkdirSync(benchmarksDir, { recursive: true });
  fs.mkdirSync(migrationsDir, { recursive: true });
  fs.mkdirSync(generatedDir, { recursive: true });

  writeManifest(manifestPath(targetDir), {
    package: {
      name: projectName,
      version: "0.1.0",
      entry: "src/main.cbx"
    },
    dependencies: {}
  });
  writeLockfile(lockfilePath(targetDir), projectName, {});

  fs.writeFileSync(path.join(targetDir, "README.md"), `# ${projectName}\n\nGenerated with COBOL-X template \`${template}\`.\n`, "utf8");
  fs.writeFileSync(path.join(targetDir, ".env.example"), "DATABASE_URL=\nCOBOLX_SECRET_TOKEN=\n", "utf8");
  fs.writeFileSync(path.join(targetDir, "cobolx.tasks.json"), JSON.stringify({
    build: ["check", "test"],
    release: ["build --release", "doc"]
  }, null, 2), "utf8");

  const mainSource = templateSource(projectName, template);
  fs.writeFileSync(
    path.join(srcDir, "main.cbx"),
    mainSource,
    "utf8"
  );
  fs.writeFileSync(
    path.join(testsDir, "smoke.cbx"),
    `PROGRAM Smoke\n\nBEGIN\nSET total = 1 + 2\nDISPLAY total\nEND\n`,
    "utf8"
  );
  fs.writeFileSync(
    path.join(benchmarksDir, "arith.cbx"),
    `PROGRAM Bench\n\nBEGIN\nSET value = 1000 * 1000\nDISPLAY value\nEND\n`,
    "utf8"
  );
}

function templateSource(projectName: string, template: string): string {
  const programName = projectName.replace(/[^A-Za-z0-9_]/g, "") || "Main";
  switch (template) {
    case "api":
      return `PROGRAM ${programName}\n\nCONST API_VERSION = "v1"\n\nBEGIN\nDISPLAY "API template ${projectName}"\nEND\n`;
    case "microservice":
      return `PROGRAM ${programName}\n\nBEGIN\nDISPLAY "Microservice booting"\nEND\n`;
    case "cli":
      return `PROGRAM ${programName}\n\nBEGIN\nDISPLAY "CLI ready"\nEND\n`;
    default:
      return `PROGRAM ${programName}\n\nBEGIN\nDISPLAY "Hello from COBOL-X"\nEND\n`;
  }
}
