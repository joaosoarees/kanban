import { spawnSync } from "node:child_process";
import { join } from "node:path";

const migratorDir = join(import.meta.dirname, "migrator");

const migration = spawnSync(
  process.execPath,
  [
    join(migratorDir, "node_modules/prisma/build/index.js"),
    "migrate",
    "deploy",
  ],
  { cwd: migratorDir, stdio: "inherit" },
);

if (migration.status !== 0) {
  process.exit(migration.status ?? 1);
}

await import(join(import.meta.dirname, "server.js"));
