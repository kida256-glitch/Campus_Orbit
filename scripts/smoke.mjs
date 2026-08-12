/**
 * CampusOrbit smoke test — production mode.
 *
 * Checks every route and role-access rule against the running app.
 * No demo accounts — uses real sign-up to create a disposable test student,
 * and signs in as the known admin.
 *
 * Usage: node scripts/smoke.mjs [baseUrl]
 */

import { createServerClient } from "@supabase/ssr";

const BASE = (process.argv[2] ?? "http://localhost:3000").replace(/\/$/, "");
const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ??
  "https://nhorfibqbbumrjwjxiwb.supabase.co";
const ANON =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5ob3JmaWJxYmJ1bXJqd2p4aXdiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY1NTA5ODcsImV4cCI6MjEwMjEyNjk4N30._TvQut5g6CgASHW9zpvtMLJl40Rwjn-6KLM_83cX-sM";

import { createClient } from "@supabase/supabase-js";

const ADMIN_EMAIL = "benwaeldon@gmail.com";
const ADMIN_PASS  = "CampusOrbit!2026";

let passed = 0;
let failed = 0;

function check(label, condition, detail = "") {
  if (condition) {
    console.log(`  PASS  ${label}`);
    passed += 1;
  } else {
    console.log(`  FAIL  ${label}${detail ? ` — ${detail}` : ""}`);
    failed += 1;
  }
}

async function login(email, password) {
  const jar = new Map();
  const supabase = createServerClient(SUPABASE_URL, ANON, {
    cookies: {
      getAll: () => [...jar.entries()].map(([name, value]) => ({ name, value })),
      setAll: (c) => c.forEach(({ name, value }) => jar.set(name, value)),
    },
  });
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw new Error(`sign-in failed for ${email}: ${error.message}`);
  return [...jar.entries()]
    .map(([n, v]) => `${n}=${encodeURIComponent(v)}`)
    .join("; ");
}

async function get(path, cookie) {
  const response = await fetch(`${BASE}${path}`, {
    headers: cookie ? { cookie } : {},
    redirect: "manual",
  });
  const body = response.status >= 300 && response.status < 400
    ? ""
    : await response.text();
  return { status: response.status, location: response.headers.get("location") ?? "", body };
}

// Create a disposable test student via the service client.
const svc = createClient(SUPABASE_URL,
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5ob3JmaWJxYmJ1bXJqd2p4aXdiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NjU1MDk4NywiZXhwIjoyMTAyMTI2OTg3fQ.pza2L-pL5BYOmGUGrIbBdjYk6BOqn_R-8GDEOhWZY30",
  { auth: { persistSession: false } }
);

const stamp = Date.now();
const testEmail = `smoke.test.${stamp}@campusorbit.test`;
const testPass  = "SmokeTest!1234";

console.log(`\nCampusOrbit smoke test against ${BASE}\n`);

// Create test student
const { data: signUp } = await svc.auth.admin.createUser({
  email: testEmail, password: testPass,
  email_confirm: true,
  user_metadata: { full_name: "Smoke Tester", role: "student" },
});
const testUserId = signUp?.user?.id;

try {
  // ─── Anonymous ─────────────────────────────────────────────────────────────
  console.log("=== Anonymous ===");

  const landing = await get("/");
  check("landing page renders", landing.status === 200);
  check("landing shows tagline", landing.body.includes("Your campus life"));

  for (const path of ["/events", "/opportunities", "/discover", "/marketplace"]) {
    check(`${path} is publicly readable`, (await get(path)).status === 200);
  }

  const dashAnon = await get("/dashboard");
  check("dashboard redirects anonymous to login",
    dashAnon.status === 307 && dashAnon.location.includes("/login"),
    `got ${dashAnon.status}`);

  const loginPage = await get("/login");
  check("login page renders", loginPage.status === 200);
  check("signup link present", loginPage.body.includes("/signup"));
  check("demo panel absent", !loginPage.body.includes("Demo accounts"));

  // ─── Student ───────────────────────────────────────────────────────────────
  console.log("\n=== Student ===");
  const student = await login(testEmail, testPass);

  for (const path of ["/dashboard", "/events", "/opportunities", "/discover",
                       "/marketplace", "/profile", "/portfolio", "/assistant"]) {
    const page = await get(path, student);
    check(`student ${path} renders`, page.status === 200, `got ${page.status}`);
  }

  const studentAdmin = await get("/admin", student);
  check("student redirected away from /admin", studentAdmin.status === 307,
    `got ${studentAdmin.status}`);
  const studentLeader = await get("/leader", student);
  check("student redirected away from /leader", studentLeader.status === 307,
    `got ${studentLeader.status}`);

  // ─── Admin ─────────────────────────────────────────────────────────────────
  console.log("\n=== Admin ===");
  const admin = await login(ADMIN_EMAIL, ADMIN_PASS);

  for (const path of ["/admin", "/admin/events", "/admin/analytics",
                       "/admin/users", "/admin/opportunities", "/admin/marketplace"]) {
    const page = await get(path, admin);
    check(`admin ${path} renders`, page.status === 200, `got ${page.status}`);
  }

  // ─── Sign-up flow ──────────────────────────────────────────────────────────
  console.log("\n=== Sign-up page ===");
  const signupPage = await get("/signup");
  check("signup page renders", signupPage.status === 200);
  check("role picker present", signupPage.body.includes("student") || signupPage.body.includes("Student"));
  check("admin role not selectable in signup",
    !signupPage.body.match(/value="admin"/i));

} finally {
  // Clean up test student
  if (testUserId) await svc.auth.admin.deleteUser(testUserId);
}

console.log(`\n${passed} passed, ${failed} failed\n`);
process.exit(failed > 0 ? 1 : 0);
