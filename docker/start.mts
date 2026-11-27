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

if (migration.error) {
  console.error("could not run prisma migrate deploy", migration.error);
}

if (migration.status !== 0) {
  process.exit(migration.status ?? 1);
}

const drainMilliseconds = 5000;

process.on("SIGTERM", () => {
  process.env.SHUTTING_DOWN = "true";
  setTimeout(() => process.exit(0), drainMilliseconds);
});

await import(join(import.meta.dirname, "server.js"));
