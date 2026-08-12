# CampusOrbit — Architecture

## Shape of the system

```
┌─────────────────────────────────────────────────────────────┐
│  Next.js 15 (App Router)                                    │
│                                                             │
│  Server Components ──── read data ────┐                     │
│  Server Actions ─────── write data ───┤                     │
│  Route Handler (/api/assistant) ──────┤                     │
│  middleware.ts ──── session + role ───┤                     │
└───────────────────────────────────────┼─────────────────────┘
                                        │ anon key + user JWT
                                        ▼
┌─────────────────────────────────────────────────────────────┐
│  Supabase / PostgreSQL                                      │
│                                                             │
│  Row Level Security ....... who may touch which rows        │
│  Guard triggers ........... which state transitions are ok  │
│  SQL functions ............ portfolio projection, analytics │
│  Supabase Auth ............ identity, mirrored to profiles  │
└─────────────────────────────────────────────────────────────┘
```

There is no separate API tier. Server Components query Postgres directly
through the user's own session, and Server Actions write through the same path.
The database is the authorization boundary.

## The one architectural decision that matters

**Authorization lives in Postgres, not in React.**

Every table is deny-by-default with RLS. The frontend's role checks
(`requireRole`, the sidebar, middleware) exist for user experience — to send
someone to the right page instead of showing them a broken one. Delete all of
them and the security properties are unchanged, because a student's JWT simply
cannot read another student's certifications.

This is verifiable rather than aspirational: `supabase/tests/rls_checks.sql`
impersonates each role and asserts on real behaviour, including 20 attempts to
do something forbidden.

Three layers cooperate:

| Layer | Question it answers | Example |
|---|---|---|
| `GRANT` | Which verbs may this role ever use? | `anon` has no `INSERT` anywhere |
| RLS policy | Which rows may it touch? | a leader sees only their own events |
| Guard trigger | Which transitions are legal? | nobody self-approves their own event |

Guard triggers exist because `WITH CHECK` cannot compare against the previous
row. "You may edit this event" is a policy; "you may not change its status from
pending to approved" is a trigger.

## The portfolio is a projection, not a table

There is no `portfolio` table. A portfolio is computed at read time from
evidence that already exists:

```
verified event attendance  ─┐
completed opportunities    ─┼─→ portfolio_skills()      → skills + proficiency
completed certifications   ─┤   portfolio_experience()  → verified timeline
self-declared profile skills┘   portfolio_stats()       → achievement counters
```

Consequences of this choice:

- A portfolio cannot drift out of sync with the activity behind it.
- Deleting the evidence deletes the claim. There is no orphaned boast.
- A student cannot write to their portfolio, because there is nothing to write to.
- Self-declared skills are included but carry `verified_count = 0`, so the UI can
  show them honestly as unverified rather than silently mixing them with proof.

`skillProficiency()` in `src/lib/portfolio.ts` turns evidence count into a bar:
22 points per verified activity, 15 for a self-claim, capped at 96 so nothing
ever reads as "complete".

## The trust boundary

The attendance ladder is the product's core idea expressed as an enum:

```
interested → registered → attended → verified
└─── the student's own claim ───┘   └─ someone else's attestation ─┘
```

Only `verified` feeds the portfolio. The database enforces the split:

- A student may write `interested` and `registered` for themselves only.
- `attended` and `verified` are refused for the subject of the record — the
  guard trigger raises for anyone who is not the event owner or an admin.
- `verified` requires `verified_by` and `verified_at` (a CHECK constraint), so
  every piece of evidence is attributable.
- A student cannot `DELETE` a verified registration — evidence is not theirs to
  erase.

Completed *opportunities* are self-reported, because no campus organiser can
attest to an external internship. The UI never labels these "verified by" anyone;
they are shown as completions, and `completed_at` is stamped by a trigger rather
than accepted from the client.

## CampusOrbit AI

Retrieval-augmented, with no vector store — deliberately.

```
question
   │
   ▼
buildRetrievalContext(profile)     ← scoped SQL through the user's own session
   │                                  (RLS decides what may enter the prompt)
   ▼
renderContextForPrompt()           ← plain text, explicit "none recorded"
   │
   ├──→ LLM (OpenAI/Groq) if a key is configured
   └──→ deterministic reasoner (default)
```

Why no embeddings: one student's corpus is small and fully structured. Scoped
SQL retrieves *more* accurately than similarity search, and it cannot surface
another student's rows because the query runs as that student.

Why a deterministic reasoner is the default: it cannot hallucinate. It composes
answers from the retrieved rows and says "none recorded" when a section is
empty. The product therefore works with zero external services and zero API
spend, and the LLM path is an enhancement rather than a dependency. When a model
*is* configured, the system prompt forbids going beyond the context block and
the code falls back to the reasoner on any error.

Both paths return the retrieval sections they used, which the chat UI displays.
That is a trust signal, not decoration.

## Request lifecycle

1. `middleware.ts` refreshes the Supabase session cookie via `getUser()` — which
   revalidates the token rather than trusting cookie contents — and redirects on
   role-scoped prefixes so a wrong-role visit is a real HTTP redirect.
2. The route's Server Component calls `requireProfile()` / `requireRole()`. The
   role is read from the `profiles` row, never from JWT metadata.
3. Queries run through `createClient()` (anon key + user JWT). RLS applies.
4. Mutations go through Server Actions that return a discriminated
   `ActionState`, so forms render field errors without try/catch at call sites.
5. Actions call `revalidatePath()`, so the portfolio reflects new evidence
   immediately.

## Multi-campus readiness

`profiles.university` is a column with a default rather than a hardcoded string,
and `DEFAULT_UNIVERSITY` is a single constant. Extending to a second campus means
adding a `universities` table, swapping the column for a foreign key, and adding
`university_id` to the RLS predicates for events and opportunities. No
application logic assumes a single campus.

Deliberately not done now: it would add a join to every query for a benefit no
current user has.

## Service-role usage

`createAdminClient()` bypasses RLS and is marked `server-only`, so importing it
into a client component is a build error. It is used only where RLS cannot help
(deleting auth users in test cleanup). Role changes and suspensions deliberately
go through the *ordinary* RLS-bound client, so the admin's own session must
satisfy `profiles_admin_update` and the guard trigger still fires and notifies.

`is_trusted_server()` returns true when `auth.uid()` is null, which means either
the service role or a direct superuser connection (migrations, seeds). This is
safe as a trust signal because anonymous HTTP callers also have a null
`auth.uid()` but are stopped earlier by RLS — `anon` holds no write grant on any
table.
