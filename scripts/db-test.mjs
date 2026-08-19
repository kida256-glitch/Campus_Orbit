/**
 * Runs the RLS / trigger assertion suite against the local Supabase database.
 *
 * Finds the postgres container automatically by asking `docker ps` for any
 * container whose name contains "supabase_db_" — works regardless of what the
 * project folder is named on the judge's machine.
 */

import { execSync, spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const SQL  = readFileSync(join(ROOT, "supabase", "tests", "rls_checks.sql"), "utf8");

// Find the local Supabase postgres container.
let container = "";
try {
  const output = execSync(
    'docker ps --format "{{.Names}}" --filter "name=supabase_db_"',
    { encoding: "utf8" },
  ).trim();
  container = output.split("\n")[0].trim();
} catch {
  console.error(
    "Could not find a running Supabase postgres container.\n" +
      "Make sure the local stack is up: npm run db:start",
  );
  process.exit(1);
}

if (!container) {
  console.error(
    "No supabase_db_* container found. Run npm run db:start first.",
  );
  process.exit(1);
}

console.log(`Running RLS checks against container: ${container}\n`);

const result = spawnSync(
  "docker",
  ["exec", "-i", container, "psql", "-U", "postgres", "-d", "postgres", "-q"],
  {
    input: SQL,
    encoding: "utf8",
    stdio: ["pipe", "inherit", "inherit"],
  },
);

process.exit(result.status ?? 0);
