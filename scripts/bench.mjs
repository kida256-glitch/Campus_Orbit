/**
 * Latency benchmark. Measures server response time per route, twice, so the
 * first (compile / cold) pass can be told apart from the warm pass.
 *
 * Usage: node scripts/bench.mjs [baseUrl] [rounds]
 */

import { createServerClient } from "@supabase/ssr";

const BASE = (process.argv[2] ?? "http://localhost:3001").replace(/\/$/, "");
const ROUNDS = Number(process.argv[3] ?? 2);

const SUPABASE_URL = "http://127.0.0.1:54321";
const ANON =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0";

async function login(email) {
  const jar = new Map();
  const supabase = createServerClient(SUPABASE_URL, ANON, {
    cookies: {
      getAll: () => [...jar.entries()].map(([name, value]) => ({ name, value })),
      setAll: (c) => c.forEach(({ name, value }) => jar.set(name, value)),
    },
  });
  await supabase.auth.signInWithPassword({
    email,
    password: "CampusOrbit!2026",
  });
  return [...jar.entries()]
    .map(([n, v]) => `${n}=${encodeURIComponent(v)}`)
    .join("; ");
}

async function time(path, cookie) {
  const started = performance.now();
  const response = await fetch(`${BASE}${path}`, {
    headers: cookie ? { cookie } : {},
    redirect: "manual",
  });
  await response.arrayBuffer();
  return { ms: Math.round(performance.now() - started), status: response.status };
}

const PUBLIC = ["/", "/events", "/opportunities", "/discover", "/marketplace"];
const STUDENT = [
  "/dashboard",
  "/portfolio",
  "/assistant",
  "/events",
  "/opportunities",
  "/discover",
  "/profile",
];
const ADMIN = [
  "/admin",
  "/admin/events",
  "/admin/analytics",
  "/admin/users",
  "/admin/opportunities",
  "/admin/marketplace",
];

async function suite(label, paths, cookie) {
  console.log(`\n=== ${label} ===`);
  const results = new Map();

  for (let round = 1; round <= ROUNDS; round += 1) {
    for (const path of paths) {
      const { ms } = await time(path, cookie);
      if (!results.has(path)) results.set(path, []);
      results.get(path).push(ms);
    }
  }

  const header = ["route".padEnd(24), ...Array.from({ length: ROUNDS }, (_, i) => `r${i + 1}`.padStart(8))].join("");
  console.log(header);

  const warm = [];
  for (const [path, times] of results) {
    console.log(path.padEnd(24) + times.map((t) => `${t}`.padStart(8)).join(""));
    if (times.length > 1) warm.push(times[times.length - 1]);
  }

  if (warm.length > 0) {
    const avg = Math.round(warm.reduce((a, b) => a + b, 0) / warm.length);
    const max = Math.max(...warm);
    console.log(`warm avg ${avg} ms · worst ${max} ms`);
  }
}

console.log(`Benchmarking ${BASE} — ${ROUNDS} rounds`);

await suite("Anonymous", PUBLIC);

const student = await login("benjamin@campusorbit.demo");
await suite("Student", STUDENT, student);

const admin = await login("benwaeldon@gmail.com");
await suite("Admin", ADMIN, admin);

// Isolate the two per-request network hops the middleware performs.
console.log("\n=== Supabase round-trip cost (from Node) ===");
for (const label of ["auth getUser", "profiles select"]) {
  const started = performance.now();
  const jar = new Map();
  const supabase = createServerClient(SUPABASE_URL, ANON, {
    cookies: { getAll: () => [], setAll: () => {} },
  });
  if (label === "auth getUser") {
    await supabase.auth.getUser();
  } else {
    await supabase.from("events").select("id").limit(1);
  }
  console.log(`${label.padEnd(24)}${`${Math.round(performance.now() - started)}`.padStart(8)} ms`);
  void jar;
}

console.log("");
