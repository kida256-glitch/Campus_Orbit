/**
 * CampusOrbit auth smoke test.
 *
 * Exercises the real Supabase Auth endpoints and asserts that RLS behaves the
 * same way over HTTP (PostgREST) as it does in SQL. Run with:
 *
 *   node scripts/smoke-auth.mjs
 *
 * Requires the local stack (`npm run db:start`).
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";

// Minimal .env.local reader so the script needs no extra dependency.
const env = Object.fromEntries(
  readFileSync(new URL("../.env.local", import.meta.url), "utf8")
    .split(/\r?\n/)
    .filter((line) => line && !line.trimStart().startsWith("#"))
    .map((line) => {
      const index = line.indexOf("=");
      return [line.slice(0, index).trim(), line.slice(index + 1).trim()];
    }),
);

const URL_ = env.NEXT_PUBLIC_SUPABASE_URL;
const ANON = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

let passed = 0;
let failed = 0;

function check(label, condition, detail = "") {
  if (condition) {
    passed += 1;
    console.log(`PASS  ${label}`);
  } else {
    failed += 1;
    console.error(`FAIL  ${label}${detail ? ` — ${detail}` : ""}`);
  }
}

function anonClient() {
  return createClient(URL_, ANON, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

async function signIn(email, password = "CampusOrbit!2026") {
  const client = anonClient();
  const { data, error } = await client.auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw new Error(`${email}: ${error.message}`);
  return { client, user: data.user };
}

console.log("\n=== Sign-in with seeded accounts ===");

const student = await signIn("benjamin@campusorbit.demo");
check("student signs in", !!student.user);

const leader = await signIn("sandra@campusorbit.demo");
check("community leader signs in", !!leader.user);

const admin = await signIn("benwaeldon@gmail.com");
check("admin signs in", !!admin.user);

{
  const client = anonClient();
  const { error } = await client.auth.signInWithPassword({
    email: "benjamin@campusorbit.demo",
    password: "wrong-password",
  });
  check("wrong password is rejected", !!error, error?.message);
}

console.log("\n=== Role comes from the database profile ===");
{
  const { data } = await student.client
    .from("profiles")
    .select("role, username, onboarded, university")
    .eq("id", student.user.id)
    .single();
  check("student profile has student role", data?.role === "student");
  check(
    "student profile carries the default university",
    data?.university === "Makerere University Business School",
  );
  check("student has a portfolio handle", data?.username === "benjamin-ssekandi");
}

console.log("\n=== RLS over HTTP (PostgREST) ===");
{
  const { data } = await student.client.from("events").select("id, status");
  check(
    "student reads only approved/completed events",
    data?.length === 8 && data.every((e) => ["approved", "completed"].includes(e.status)),
    `got ${data?.length} rows`,
  );
}
{
  const { data } = await student.client.from("profiles").select("id, email");
  check(
    "student sees only their own profile row",
    data?.length === 1 && data[0].id === student.user.id,
    `got ${data?.length} rows`,
  );
}
{
  // Sellers are visible by name through a view, never as a profile row.
  const { data } = await student.client
    .from("marketplace_public_listings")
    .select("product_name, seller_name, contact_value");
  check(
    "marketplace exposes seller display names",
    (data?.length ?? 0) === 5 && data.every((row) => !!row.seller_name),
    `got ${data?.length} rows`,
  );
  check(
    "marketplace view has no email column",
    data?.length > 0 && !("email" in data[0]),
  );
}
{
  const { data } = await leader.client
    .from("event_participants")
    .select("student_name, event_title, status");
  check(
    "leader sees participants for own events only",
    (data?.length ?? 0) > 0,
    `got ${data?.length} rows`,
  );
  check(
    "participant view exposes no email",
    data?.length > 0 && !("email" in data[0]),
  );
}
{
  const { data } = await student.client
    .from("event_participants")
    .select("student_name");
  check(
    "student sees no participant rows (organises nothing)",
    (data?.length ?? 0) === 0,
    `got ${data?.length} rows`,
  );
}
{
  const { data } = await student.client
    .from("student_certifications")
    .select("student_id");
  check(
    "student sees only own certifications",
    data?.every((row) => row.student_id === student.user.id),
  );
}
{
  const { error } = await student.client
    .from("profiles")
    .update({ role: "admin" })
    .eq("id", student.user.id);
  check("student cannot self-promote over HTTP", !!error, error?.message);
}
{
  // Attempt to self-verify attendance for an upcoming event.
  const { data: reg } = await student.client
    .from("event_registrations")
    .select("id")
    .eq("status", "registered")
    .limit(1)
    .single();
  const { error } = await student.client
    .from("event_registrations")
    .update({ status: "verified" })
    .eq("id", reg.id);
  check("student cannot self-verify attendance over HTTP", !!error, error?.message);
}
{
  const { error } = await leader.client
    .from("events")
    .update({ status: "approved" })
    .eq("status", "pending")
    .eq("created_by", leader.user.id);
  check("leader cannot self-approve over HTTP", !!error, error?.message);
}
{
  const { data, error } = await admin.client.rpc("platform_analytics");
  check("admin analytics RPC works", !error && data?.students === 6, error?.message);
}
{
  const { error } = await student.client.rpc("platform_analytics");
  check("student is refused analytics RPC", !!error, error?.message);
}

console.log("\n=== Public portfolio (anonymous) ===");
{
  const client = anonClient();
  const { data } = await client.rpc("public_portfolio", {
    handle: "benjamin-ssekandi",
  });
  check("anon reads the published portfolio", data?.private === false);
  check("portfolio hides email by default", data?.profile?.email === null);
  check(
    "portfolio reports verified evidence",
    data?.stats?.verified_events === 3 && data?.experience?.length === 5,
    JSON.stringify(data?.stats?.verified_events),
  );
  check("portfolio derives skills", (data?.skills?.length ?? 0) >= 8);
}
{
  const client = anonClient();
  const { data } = await client.rpc("public_portfolio", {
    handle: "aisha-nakato",
  });
  check("private portfolio stays private for anon", data?.private === true);
  check("private portfolio exposes no stats", data?.stats === undefined);
}

console.log("\n=== Signup provisions a profile ===");
{
  const email = `smoke-${Date.now()}@campusorbit.demo`;
  const client = anonClient();
  const { data, error } = await client.auth.signUp({
    email,
    password: "CampusOrbit!2026",
    options: { data: { full_name: "Smoke Test Student", role: "admin" } },
  });
  check("signup succeeds", !error && !!data.user, error?.message);

  const { data: profile } = await client
    .from("profiles")
    .select("role, username, university, onboarded")
    .eq("id", data.user.id)
    .single();

  check("profile row is auto-created", !!profile);
  // The client asked for admin; the trigger must downgrade it.
  check(
    "self-assigned admin is refused at signup",
    profile?.role === "student",
    `got ${profile?.role}`,
  );
  check(
    "username slug is generated",
    profile?.username === "smoke-test-student",
    profile?.username,
  );
  check("new student starts un-onboarded", profile?.onboarded === false);

  const { data: vis } = await client
    .from("portfolio_visibility")
    .select("is_public")
    .eq("student_id", data.user.id)
    .single();
  check("portfolio starts private", vis?.is_public === false);

  const { data: portfolio } = await client.rpc("public_portfolio", {
    handle: profile.username,
  });
  check(
    "brand-new portfolio is empty but valid",
    portfolio?.private === false && portfolio?.stats?.verified_events === 0,
  );
}

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
