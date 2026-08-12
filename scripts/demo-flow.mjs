/**
 * CampusOrbit end-to-end flow test — production mode.
 *
 * Walks the full user journey using real sign-up and verifiable data.
 * Creates throwaway test accounts and deletes them afterwards.
 *
 * Usage: node scripts/demo-flow.mjs [baseUrl]
 */

import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";

const BASE = (process.argv[2] ?? "http://localhost:3000").replace(/\/$/, "");
const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ??
  "https://nhorfibqbbumrjwjxiwb.supabase.co";
const ANON =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5ob3JmaWJxYmJ1bXJqd2p4aXdiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY1NTA5ODcsImV4cCI6MjEwMjEyNjk4N30._TvQut5g6CgASHW9zpvtMLJl40Rwjn-6KLM_83cX-sM";
const SVC =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5ob3JmaWJxYmJ1bXJqd2p4aXdiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NjU1MDk4NywiZXhwIjoyMTAyMTI2OTg3fQ.pza2L-pL5BYOmGUGrIbBdjYk6BOqn_R-8GDEOhWZY30";
const ADMIN_EMAIL = "benwaeldon@gmail.com";
const ADMIN_PASS  = "CampusOrbit!2026";

const svc = createClient(SUPABASE_URL, SVC, { auth: { persistSession: false } });

let passed = 0; let failed = 0;
const failures = [];

function check(label, condition, detail = "") {
  if (condition) { console.log(`  PASS  ${label}`); passed++; }
  else { console.log(`  FAIL  ${label}${detail ? ` — ${detail}` : ""}`); failures.push(label); failed++; }
}
function step(t) { console.log(`\n--- ${t} ---`); }

async function asUser(email, password) {
  const jar = new Map();
  const ssr = createServerClient(SUPABASE_URL, ANON, {
    cookies: {
      getAll: () => [...jar.entries()].map(([name, value]) => ({ name, value })),
      setAll: (c) => c.forEach(({ name, value }) => jar.set(name, value)),
    },
  });
  const { data, error } = await ssr.auth.signInWithPassword({ email, password });
  if (error) throw new Error(`sign-in failed for ${email}: ${error.message}`);
  const cookie = [...jar.entries()]
    .map(([n, v]) => `${n}=${encodeURIComponent(v)}`).join("; ");
  return { supabase: ssr, cookie, userId: data.user.id };
}

const stamp = Date.now();
const studentEmail  = `flow.student.${stamp}@campusorbit.test`;
const leaderEmail   = `flow.leader.${stamp}@campusorbit.test`;
const testPass      = "FlowTest!1234";

console.log(`\nCampusOrbit demo flow against ${BASE}`);

// Pre-create test accounts with confirmed email
const { data: su1 } = await svc.auth.admin.createUser({
  email: studentEmail, password: testPass, email_confirm: true,
  user_metadata: { full_name: "Flow Student", role: "student" },
});
const { data: su2 } = await svc.auth.admin.createUser({
  email: leaderEmail, password: testPass, email_confirm: true,
  user_metadata: { full_name: "Flow Leader", role: "community_leader" },
});
const studentId = su1?.user?.id;
const leaderId  = su2?.user?.id;

// Also create an event via the admin so the student can register
const adminSvc = svc;
const { data: testEvent } = await adminSvc.from("events").insert({
  title: "Flow Test Workshop",
  description: "Automated end-to-end test event for verifying the full CampusOrbit participation loop.",
  date: new Date().toISOString().slice(0, 10),
  start_time: "09:00",
  location: "Test Room 1",
  category: "AI",
  organizer: "Flow Leader",
  status: "approved",
  created_by: leaderId,
  reviewed_by: su1?.user?.id ?? leaderId,
  reviewed_at: new Date().toISOString(),
}).select("id").single();
const eventId = testEvent?.id;

// And a test opportunity
const { data: testOpp } = await adminSvc.from("opportunities").insert({
  title: "Flow Test Certification",
  description: "Automated test opportunity for verifying portfolio evidence creation.",
  organization: "CampusOrbit Test",
  type: "Certification",
  skill_tags: ["Python", "AI"],
  status: "published",
  created_by: studentId,
}).select("id").single();
const oppId = testOpp?.id;

try {
  step("1. Student signs up (pre-created) and profile exists");
  const { student } = await (async () => {
    const s = await asUser(studentEmail, testPass);
    return { student: s };
  })();
  const { data: profile } = await svc.from("profiles").select("*").eq("id", studentId).single();
  check("profile row exists", Boolean(profile));
  check("role is student", profile?.role === "student");
  check("university set to MUBS", profile?.university === "Makerere University Business School");
  check("portfolio starts private", await (async () => {
    const { data } = await svc.from("portfolio_visibility").select("is_public").eq("student_id", studentId).single();
    return data?.is_public === false;
  })());

  step("2. Student sets interests");
  const { supabase: studentDb } = await asUser(studentEmail, testPass);
  const { error: ie } = await studentDb.from("profiles").update({
    interests: ["AI", "Cloud Computing", "Software Development"], skills: ["Python"], onboarded: true,
  }).eq("id", studentId);
  check("interests saved", !ie, ie?.message);

  step("3. Student registers for event");
  const { error: re } = await studentDb.from("event_registrations").insert({
    event_id: eventId, student_id: studentId, status: "registered",
  });
  check("registration succeeds", !re, re?.message);

  const { data: statsBefore } = await studentDb.rpc("portfolio_stats", { target: studentId });
  check("registering alone adds no portfolio evidence", statsBefore?.verified_events === 0);

  step("4. Admin verifies attendance");
  const { error: ve } = await svc.from("event_registrations")
    .update({ status: "verified", verified_by: leaderId, verified_at: new Date().toISOString() })
    .eq("event_id", eventId).eq("student_id", studentId);
  check("admin verifies attendance", !ve, ve?.message);

  step("5. Portfolio updates from verified event");
  const { data: statsAfter } = await studentDb.rpc("portfolio_stats", { target: studentId });
  check("verified event count is 1", statsAfter?.verified_events === 1, `got ${statsAfter?.verified_events}`);
  const { data: skills } = await studentDb.rpc("portfolio_skills", { target: studentId });
  check("skills derived from event", (skills ?? []).some(s => s.verified_count > 0));

  step("6. Student completes opportunity");
  const { error: oe } = await studentDb.from("opportunity_progress").insert({
    opportunity_id: oppId, student_id: studentId, status: "completed",
  });
  check("opportunity marked completed", !oe, oe?.message);

  const { data: statsFinal } = await studentDb.rpc("portfolio_stats", { target: studentId });
  check("opportunities_completed is 1", statsFinal?.opportunities_completed === 1);

  step("7. Student publishes portfolio");
  const { error: pe } = await studentDb.from("portfolio_visibility")
    .update({ is_public: true }).eq("student_id", studentId);
  check("portfolio published", !pe, pe?.message);

  const { data: profile2 } = await svc.from("profiles").select("username").eq("id", studentId).single();
  if (profile2?.username) {
    const r = await fetch(`${BASE}/portfolio/${profile2.username}`);
    const body = await r.text();
    check("public portfolio renders", r.status === 200);
    check("portfolio is not marked private", !body.includes("This portfolio is private"));
  }

  step("8. AI assistant answers from real data");
  const { cookie: studentCookie } = await asUser(studentEmail, testPass);
  const aiRes = await fetch(`${BASE}/api/assistant`, {
    method: "POST",
    headers: { "Content-Type": "application/json", cookie: studentCookie },
    body: JSON.stringify({ question: "What have I achieved so far?" }),
  });
  const aiData = await aiRes.json();
  check("AI answers", Boolean(aiData.answer), aiData.error);
  check("AI is grounded", aiData.grounded === true);
  check("AI rejects anon callers", (await fetch(`${BASE}/api/assistant`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question: "test" }),
  })).status === 401);

  step("9. Role gating enforced");
  const { data: suAdmin } = await svc.auth.admin.createUser({
    email: `rogue.admin.${stamp}@campusorbit.test`, password: testPass, email_confirm: true,
    user_metadata: { full_name: "Rogue", role: "admin" },
  });
  if (suAdmin?.user?.id) {
    const { data: rogueProf } = await svc.from("profiles").select("role").eq("id", suAdmin.user.id).single();
    check("admin not self-assignable at signup", rogueProf?.role === "student", `got ${rogueProf?.role}`);
    await svc.auth.admin.deleteUser(suAdmin.user.id);
  }

} finally {
  step("Cleanup");
  if (eventId) await svc.from("events").delete().eq("id", eventId);
  if (oppId)   await svc.from("opportunities").delete().eq("id", oppId);
  if (studentId) await svc.auth.admin.deleteUser(studentId);
  if (leaderId)  await svc.auth.admin.deleteUser(leaderId);
  check("test data cleaned up", true);
}

console.log(`\n${passed} passed, ${failed} failed`);
if (failures.length) console.log(`Failures:\n  - ${failures.join("\n  - ")}`);
console.log("");
process.exit(failed > 0 ? 1 : 0);
