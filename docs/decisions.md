# CampusOrbit — Architectural decisions

Each entry records the decision, the reasoning, and what it costs.

---

## 1. Authorization in Postgres, not in the frontend

**Decision.** Every table is RLS deny-by-default. Frontend role checks are for
navigation only.

**Why.** A campus platform where students verify each other's credibility cannot
have client-side authorization. The frontend runs on the user's machine; the
policy engine does not.

**Cost.** Policies are harder to debug than `if (role === 'admin')`, and every
new table needs deliberate policy work. Mitigated by
`supabase/tests/rls_checks.sql`.

**Test.** 46 assertions, including 20 attempts to do something forbidden.

---

## 2. Guard triggers alongside RLS

**Decision.** State transitions are enforced by `BEFORE` triggers, not policies.

**Why.** `WITH CHECK` sees only the new row. "You may edit this event" is
expressible as a policy; "you may not move it from pending to approved" is not.

**Cost.** Two places to look when a write is refused. Mitigated by writing
human-readable messages (`Only administrators can approve or reject events`) that
`humanizeDbError` passes straight through to the user.

---

## 3. The portfolio is a projection, not a table

**Decision.** No `portfolio` table. SQL functions compute it from evidence at
read time.

**Why.** This is the product thesis. A stored portfolio would be a document a
student edits — which is a résumé, and résumés are claims. A projection cannot
disagree with the activity behind it, and there is nothing for a student to
write to.

**Cost.** Every portfolio view runs aggregation. Acceptable: the queries are
indexed and scoped to one student. If it ever hurts, a materialised view
refreshed on verification is the escape hatch, with no API change.

---

## 4. Four-state attendance instead of a boolean

**Decision.** `interested → registered → attended → verified`. Only `verified`
becomes evidence.

**Why.** "Attending" is a student's intention. If clicking a button produced
portfolio evidence, the portfolio would be self-certified and worth nothing to a
recruiter. Splitting the claim from the attestation is what makes the ✓ credible.

**Cost.** More clicks for organisers, and a student can attend something and
never get verified. Mitigated with bulk verification and a dashboard prompt when
participants are waiting.

**Consequences enforced in SQL.** Students cannot write `attended`/`verified`;
verified rows require `verified_by` + `verified_at`; students cannot delete a
verified registration.

---

## 5. Completed opportunities are self-reported, and labelled as such

**Decision.** Students mark opportunities complete themselves. The UI never
claims a third party verified them.

**Why.** No campus organiser can attest to an external internship or a Coursera
certificate. The alternatives were to omit them (losing most of a student's real
activity) or to imply verification we cannot perform (dishonest).

**Cost.** Part of the portfolio is weaker evidence than the rest. Handled by
distinguishing the sources: `portfolio_skills` returns `sources[]`, and the UI
shows "3 verified activities across events and certifications" rather than an
unexplained number.

---

## 6. `public_portfolio()` as a function, not a table policy

**Decision.** Public portfolios are served by one `SECURITY DEFINER` function.

**Why.** RLS is row-level. "Anonymous may see this student's row, but not the
`email` column, and only if `is_public`, and with sections filtered by four
toggles" is not expressible as a row predicate. A function expresses it exactly
and keeps the rule in one place.

**Benefit.** `anon` needs **no grant on `profiles` at all** — verified by a test.
The most privacy-sensitive table is completely unreachable anonymously.

**Cost.** The public page cannot use PostgREST filters. Irrelevant: it fetches
one payload by handle.

---

## 7. RAG without a vector store

**Decision.** Retrieval is scoped SQL. No embeddings, no pgvector.

**Why.** One student's corpus is a few dozen structured rows. Similarity search
over that is strictly worse than a `WHERE student_id = ...` query: slower to
build, approximate where exact is available, and it would need its own
authorization story to avoid retrieving another student's chunks. Running the
retrieval queries through the user's own session means RLS already guarantees the
context is theirs.

**Cost.** No semantic search over free text. Not needed — the questions are about
structured facts.

**Revisit if.** The corpus grows to include long documents (event write-ups,
reports) where semantic matching earns its complexity.

---

## 8. A deterministic reasoner as the default AI path

**Decision.** With no model key configured, a rule-based reasoner composes
answers from retrieved rows. An LLM is opt-in via `CAMPUSORBIT_AI_PROVIDER`.

**Why.** Three reasons. It cannot hallucinate, which matters most in a product
whose selling point is verifiable claims. The demo works with zero external
services and zero spend. And it degrades gracefully — the LLM path falls back to
it on any error rather than failing the request.

**Cost.** Answers are less fluent and limited to eight intents. Accepted: an
answer that is always true beats one that is usually eloquent. When a model is
configured, the system prompt forbids leaving the context block.

**Both paths** return the retrieval sections used, shown in the chat as
"Grounded in your data".

---

## 9. Recommendations weight demonstrated skills above claimed ones

**Decision.** `recommended_opportunities` scores verified-skill overlap ×3,
declared skills ×2, interests ×2.

**Why.** What a student has actually done predicts fit better than what they
listed. It also creates the right feedback loop: participating makes
recommendations better, which is the behaviour the product wants.

**Cost.** A brand-new student gets interest-only matching. Acceptable — that is
genuinely all we know about them, and the onboarding flow asks for at least three
interests for this reason.

---

## 10. Server Actions returning a discriminated result

**Decision.** Actions return `ActionState<T>` (`{ok: true, ...} | {ok: false,
message, fieldErrors}`) instead of throwing.

**Why.** Validation failures are expected control flow, not exceptions. Forms can
render field-level errors and toasts without a try/catch at every call site.

**Cost.** Every caller must check `result.ok`. Uniform enough to be habitual.

---

## 11. Role gating in middleware, not only in page guards

**Decision.** Role-scoped prefixes are checked in `middleware.ts`.

**Why.** Found during the smoke test: `requireRole()` inside a page issued its
redirect *after* the shared layout had begun streaming, so a student requesting
`/admin` got HTTP 200 with a client-side redirect. No admin content leaked — the
guard did stop rendering — but 200 for a forbidden route is the wrong contract.
Middleware makes it a true 307 before any render.

**Cost.** One extra `profiles` query per role-scoped request. Limited to routes
whose outcome depends on the role, and it needs no elevated key because RLS lets
a user read their own row. Page guards are retained as defence in depth.

---

## 12. `is_trusted_server()` treats a null `auth.uid()` as trusted

**Decision.** Guard triggers skip escalation checks when there is no end user
behind the statement.

**Why.** Migrations, seeds and service-role admin operations need to write states
that no end user may write (for example seeding verified attendance).

**Why it is safe.** Anonymous HTTP callers also have a null `auth.uid()`, but they
are stopped earlier: `anon` holds no write grant on any table, so a trigger is
never reached. The two layers are independent, and the grants migration is what
makes this reasoning hold.

---

## 12b. Display-only views instead of broad profile access

**Decision.** `profiles` is self-or-admin. Organiser attendance sheets and
marketplace seller names read from `event_participants` and
`marketplace_public_listings`, both `security_invoker = false` with their own
access predicate and no email column.

**Why.** The earlier policy let a leader read the whole `profiles` row of anyone
registered for their event. That included `email`, which contradicts making
contact details opt-in through `portfolio_visibility.show_contact`. RLS is
row-level and cannot say "this row but not that column", so the policy was
narrowed and the two legitimate reads moved into views that project only what the
feature needs.

**Cost.** Application queries must remember to use the views. A direct join now
returns null and **degrades silently** — the attendance sheet would show "Unknown
student" for every participant while still returning HTTP 200. This is exactly the
failure that a status-code-only test would miss, so `npm run test:smoke` asserts
that real participant and seller names appear *and* that no email addresses do.

---

## 13. Print-to-PDF instead of a server-side PDF pipeline

**Decision.** "Download portfolio" calls `window.print()`.

**Why.** Every major browser offers Save as PDF from that dialog. A headless
Chrome renderer would add a heavy dependency and an infrastructure concern for a
feature the browser already implements.

**Cost.** Less control over pagination. Accepted for v1; the honest framing is
"Download / print" rather than implying a bespoke export.

---

## 14. Deliberately out of scope

Not built, and the reasoning:

| Feature | Why not |
|---|---|
| Payments / escrow | Real money means KYC, disputes and liability. The marketplace connects people and says so. |
| Mobile app | The responsive web app covers the need; a second client doubles surface area. |
| SMS / email / push | Requires deliverability and consent infrastructure that adds nothing to the core loop. |
| Calendar sync | Integration maintenance for marginal value. |
| Messaging platform | A moderated ecosystem needs moderation for messaging too. Contact links suffice. |
| Social graph | Follows and feeds are a different product. |
| QR check-in | Schema is ready (`check_in_token` exists, unused) but the manual sheet proves the model first. |

Each of these would have cost polish on the auto-built portfolio, which is the
one thing that makes CampusOrbit different.
