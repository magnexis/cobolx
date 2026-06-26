import fs from "node:fs";
import path from "node:path";

export function runMigrateCreateCommand(projectDir: string, name = "migration"): number {
  const migrationsDir = path.join(projectDir, "migrations");
  fs.mkdirSync(migrationsDir, { recursive: true });
  const timestamp = new Date().toISOString().replace(/[-:.TZ]/g, "").slice(0, 14);
  const file = path.join(migrationsDir, `${timestamp}_${name}.sql`);
  fs.writeFileSync(file, "-- Write migration SQL here\n", "utf8");
  console.log(`Created migration ${file}`);
  return 0;
}

export function runMigrateRunCommand(projectDir: string): number {
  const migrationsDir = path.join(projectDir, "migrations");
  const stateFile = path.join(projectDir, ".cobolx-cache", "migrations.json");
  fs.mkdirSync(path.dirname(stateFile), { recursive: true });
  const applied = fs.existsSync(stateFile) ? new Set<string>(JSON.parse(fs.readFileSync(stateFile, "utf8"))) : new Set<string>();
  const files = fs.existsSync(migrationsDir) ? fs.readdirSync(migrationsDir).filter((file) => file.endsWith(".sql")).sort() : [];
  for (const file of files) {
    if (applied.has(file)) continue;
    console.log(`Applying migration ${file}`);
    applied.add(file);
  }
  fs.writeFileSync(stateFile, JSON.stringify([...applied], null, 2), "utf8");
  return 0;
}
