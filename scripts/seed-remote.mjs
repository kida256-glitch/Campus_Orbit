/**
 * Seed script for remote Supabase project.
 * Connects to a remote Supabase instance and seeds demo data.
 */

import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SEED_FILE = path.join(process.cwd(), "supabase", "seed.sql");
const PASSWORD = "CampusOrbit!2026";

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error("Missing environment variables:");
  console.error("  NEXT_PUBLIC_SUPABASE_URL");
  console.error("  SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

// Parse seed.sql to extract SQL statements
function parseSqlStatements(sqlContent) {
  // Remove comments and split by semicolon
  const lines = sqlContent.split("\n");
  const cleanedLines = lines.filter((line) => {
    const trimmed = line.trim();
    return !trimmed.startsWith("--") && !trimmed.startsWith("set search_path");
  });
  const cleanedSql = cleanedLines.join("\n");

  // Split by semicolon, filtering empty statements
  return cleanedSql
    .split(";")
    .map((stmt) => stmt.trim())
    .filter((stmt) => stmt.length > 0);
}

async function runMigration(statements) {
  console.log("Seeding Supabase database...");

  let successCount = 0;
  let errorCount = 0;

  for (const statement of statements) {
    try {
      // Skip statements that modify auth schema directly (handled by Supabase)
      if (
        statement.includes("auth.users") ||
        statement.includes("auth.identities")
      ) {
        // Use Supabase Auth API instead
        continue;
      }

      const { error } = await supabase.rpc("exec_sql", { sql: statement });

      if (error) {
        console.error(`Error executing statement: ${error.message}`);
        errorCount++;
      } else {
        successCount++;
      }
    } catch (err) {
      console.error(`Exception executing statement: ${err.message}`);
      errorCount++;
    }
  }

  console.log(`\nSeed complete: ${successCount} statements executed, ${errorCount} errors`);
}

async function seedAuthUsers() {
  console.log("Seeding auth users...");

  const users = [
    {
      id: "a0000000-0000-4000-8000-000000000001",
      email: "benwaeldon@gmail.com",
      full_name: "Ben Waeldon",
      role: "admin",
    },
    {
      id: "b0000000-0000-4000-8000-000000000001",
      email: "brian@campusorbit.demo",
      full_name: "Brian Ochieng",
      role: "community_leader",
    },
    {
      id: "b0000000-0000-4000-8000-000000000002",
      email: "sandra@campusorbit.demo",
      full_name: "Sandra Achieng",
      role: "community_leader",
    },
    {
      id: "b0000000-0000-4000-8000-000000000003",
      email: "kevin@campusorbit.demo",
      full_name: "Kevin Mugisha",
      role: "community_leader",
    },
    {
      id: "c0000000-0000-4000-8000-000000000001",
      email: "benjamin@campusorbit.demo",
      full_name: "Benjamin Ssekandi",
      role: "student",
    },
    {
      id: "c0000000-0000-4000-8000-000000000002",
      email: "aisha@campusorbit.demo",
      full_name: "Aisha Nakato",
      role: "student",
    },
    {
      id: "c0000000-0000-4000-8000-000000000003",
      email: "timothy@campusorbit.demo",
      full_name: "Timothy Okello",
      role: "student",
    },
    {
      id: "c0000000-0000-4000-8000-000000000004",
      email: "grace@campusorbit.demo",
      full_name: "Grace Atim",
      role: "student",
    },
    {
      id: "c0000000-0000-4000-8000-000000000005",
      email: "daniel@campusorbit.demo",
      full_name: "Daniel Kizza",
      role: "student",
    },
    {
      id: "c0000000-0000-4000-8000-000000000006",
      email: "patricia@campusorbit.demo",
      full_name: "Patricia Amongin",
      role: "student",
    },
  ];

  for (const user of users) {
    const { data, error } = await supabase.auth.admin.createUser({
      email: user.email,
      password: PASSWORD,
      email_confirm: true,
      user_metadata: {
        full_name: user.full_name,
        role: user.role,
      },
    });

    if (error) {
      if (error.message.includes("already exists")) {
        console.log(`User ${user.email} already exists, updating metadata...`);
        const { error: updateError } = await supabase.auth.admin.updateUserById(
          user.id,
          { user_metadata: { full_name: user.full_name, role: user.role } }
        );
        if (updateError) {
          console.error(`Failed to update ${user.email}: ${updateError.message}`);
        }
      } else {
        console.error(`Failed to create user ${user.email}: ${error.message}`);
      }
    } else {
      console.log(`Created user: ${user.email}`);
    }
  }
}

async function main() {
  console.log(`Connecting to Supabase at ${SUPABASE_URL}`);
  console.log("Starting seed process...\n");

  // Read seed file
  const seedSql = fs.readFileSync(SEED_FILE, "utf8");

  // Parse SQL statements
  const statements = parseSqlStatements(seedSql);
  console.log(`Found ${statements.length} SQL statements to execute`);

  // Seed auth users first
  await seedAuthUsers();

  console.log("\nNote: Some seed data may need to be applied manually via SQL.");
  console.log("Please run the remaining SQL statements in the Supabase SQL Editor.");
}

main().catch((error) => {
  console.error(`\nSeed failed: ${error.message}`);
  process.exit(1);
});
