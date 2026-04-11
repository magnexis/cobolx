#!/usr/bin/env node
import { runAddCommand } from "./commands/add.js";
import { runBenchCommand } from "./commands/bench.js";
import { runBuildCommand } from "./commands/build.js";
import { runCheckCommand } from "./commands/check.js";
import { runDevCommand } from "./commands/dev.js";
import { runDebugCommand } from "./commands/debug.js";
import { runDocCommand } from "./commands/doc.js";
import { runDeployCommand } from "./commands/deploy.js";
import { runFmtCommand } from "./commands/fmt.js";
import { runFuzzCommand } from "./commands/fuzz.js";
import { runGenerateCommand } from "./commands/generate.js";
import { runInstallCommand } from "./commands/install.js";
import { runLegacyConvertCommand } from "./commands/legacy.js";
import { runLintCommand } from "./commands/lint.js";
import { runMigrateCreateCommand, runMigrateRunCommand } from "./commands/migrate.js";
import { runNewCommand } from "./commands/new.js";
import { runProfileCommand } from "./commands/profile.js";
import { runPublishCommand } from "./commands/publish.js";
import { runReplCommand } from "./commands/repl.js";
import { runRunCommand } from "./commands/run.js";
import { runTaskCommand } from "./commands/task.js";
import { runTestCommand } from "./commands/test.js";
import { runUpdateCommand } from "./commands/update.js";
import { runVisualizeCommand } from "./commands/visualize.js";

function usage(): void {
  console.log("COBOL-X CLI");
  console.log("Usage: cobolx <new|build|run|check|test|bench|add|install|update|publish|fmt|lint|debug|profile|dev|migrate|generate|fuzz|repl|doc|task|legacy|visualize|deploy> [args]");
}

async function main(argv: string[]): Promise<number> {
  const [command, ...rest] = argv;
  const projectDir = process.cwd();
  const release = rest.includes("--release");
  const targetIndex = rest.indexOf("--target");
  const target = targetIndex >= 0 ? rest[targetIndex + 1] : undefined;

  switch (command) {
    case "new":
      return runNewCommand(rest[0], rest[1]);
    case "build":
      return runBuildCommand(projectDir, { release, target });
    case "run":
      return runRunCommand(projectDir, { release, target });
    case "check":
      return runCheckCommand(projectDir);
    case "test":
      return runTestCommand(projectDir);
    case "bench":
      return await runBenchCommand(projectDir);
    case "add":
      return runAddCommand(projectDir, rest[0], rest[1]);
    case "install":
      return runInstallCommand(projectDir);
    case "update":
      return runUpdateCommand(projectDir);
    case "publish":
      return runPublishCommand(projectDir);
    case "fmt":
      return runFmtCommand(projectDir);
    case "lint":
      return runLintCommand(projectDir);
    case "debug":
      return runDebugCommand(projectDir, rest.includes("--rewind"));
    case "profile":
      return await runProfileCommand(projectDir);
    case "dev":
      return runDevCommand(projectDir);
    case "migrate":
      if (rest[0] === "create") return runMigrateCreateCommand(projectDir, rest[1]);
      if (rest[0] === "run") return runMigrateRunCommand(projectDir);
      usage();
      return 1;
    case "generate":
      return runGenerateCommand(projectDir, rest[0], rest[1]);
    case "fuzz":
      return runFuzzCommand(projectDir, rest[0]);
    case "repl":
      return await runReplCommand();
    case "doc":
      return runDocCommand(projectDir);
    case "task":
      return runTaskCommand(projectDir, rest[0]);
    case "legacy":
      return runLegacyConvertCommand(projectDir, rest[0]);
    case "visualize":
      return runVisualizeCommand(projectDir);
    case "deploy":
      return runDeployCommand(projectDir);
    case undefined:
      usage();
      return 0;
    default:
      console.error(`Unknown command: ${command}`);
      usage();
      return 1;
  }
}

process.exit(await main(process.argv.slice(2)));
