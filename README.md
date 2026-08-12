# CampusOrbit

**Your campus life. Your opportunities. Your proof.**

CampusOrbit brings campus tech events, opportunities, certifications and
communities into one place — then automatically turns your participation into a
career portfolio.

Built for Makerere University Business School, architected to expand.

---

## Live app

**https://campus-orbit-delta.vercel.app**

Hosted on Vercel, backed by Supabase (hosted project `nhorfibqbbumrjwjxiwb`).


A student's campus activity is scattered and disappears. Events live in WhatsApp
groups and on noticeboards. Internships circulate by word of mouth. Certifications
sit in a forgotten inbox. Communities run in parallel with no shared record.

Then graduation arrives and the student opens a blank CV. Three years of real
work — hackathons, workshops, cloud certifications, community organising —
becomes a list of claims an employer has no reason to believe.

The gap is not effort. It is **evidence**.

## The solution

CampusOrbit records participation as it happens and projects it into a portfolio
the student never writes.

```
Discover  →  Participate  →  Get verified  →  Portfolio builds itself
```

The distinguishing mechanic: **registering for an event is not proof.** After the
event, the organiser verifies who actually took part. Only verified attendance
becomes portfolio evidence. That single split is what makes a CampusOrbit
portfolio worth more than a self-written résumé — someone else vouched for it, and
the database records who and when.

The student never fills in a résumé. They participate. CampusOrbit keeps the
receipts.

---

## Features

**Students** — personalised dashboard, unified discovery across events,
opportunities, certifications and the marketplace; event registration; opportunity
pipeline (saved → in progress → completed); certification tracking; an
auto-built portfolio with a shareable public URL; CampusOrbit AI.

**Community leaders** — submit events for review, track moderation status, see
registrations, and verify attendance (individually or in bulk) — the step that
creates evidence.

**Admins** — event moderation with mandatory rejection notes, opportunity CRUD
with publish/unpublish, seller and listing approval, user roles and suspension,
and analytics led by the platform's integrity metric: verification rate.

**Marketplace** — deliberately lightweight. Verified sellers, moderated listings,
contact hand-off. No payments, no escrow, no checkout.

**Notifications** — in-app only, written exclusively by database triggers.

### The auto-built portfolio

| Section | Source |
|---|---|
| Skills + proficiency | verified events (via category→skill map), completed certifications, completed opportunities, self-declared skills (marked unverified) |
| Verified experience | verified attendance + completed opportunities, each ✓ marked |
| Certifications | completed certifications with credential links |
| Achievements | counters derived in SQL — verified events, hackathons, workshops, community activities |
| Career snapshot | generated from the counters, degrading honestly to "no verified activity yet" |

Proficiency reflects evidence volume, not self-assessment. Private by default;
publishing and revealing contact details are separate consents.

### CampusOrbit AI

Answers only from the signed-in student's own records. Retrieval is scoped SQL
through their session, so RLS decides what can enter the context — there is no
way to ask about another student. Every answer shows the retrieval sections it
used.

Works with **no API key**: the default reasoner composes answers from retrieved
rows and cannot hallucinate. Configure OpenAI or Groq to upgrade fluency; on any
error it falls back to the deterministic path.

Ask it: *What's coming up for me? · Recommend opportunities · Analyze my
portfolio · What skill should I learn next? · What events have I attended?*

---

## Architecture

```
Next.js 15 App Router
├── Server Components ........ read via the user's session
├── Server Actions ........... write, returning a discriminated result
├── /api/assistant ........... AI route handler
└── middleware.ts ............ session refresh + role-scoped redirects
                    │
                    ▼  anon key + user JWT
Supabase / PostgreSQL
├── Row Level Security ....... which rows
├── Guard triggers ........... which state transitions
├── SQL functions ............ portfolio projection, recommendations, analytics
└── Supabase Auth ............ identity, mirrored into profiles
```

No separate API tier. **The database is the authorization boundary** — frontend
role checks exist for navigation, and deleting them would not change what any
user can read or write.

There is no `portfolio` table. A portfolio is a projection over evidence, so it
cannot drift from the activity behind it, and a student has nothing to write to.

Full detail: [`docs/architecture.md`](docs/architecture.md) ·
[`docs/database.md`](docs/database.md) ·
[`docs/decisions.md`](docs/decisions.md) · [`docs/demo.md`](docs/demo.md) ·
[`docs/performance.md`](docs/performance.md)

## Tech stack

Next.js 15 (App Router) · TypeScript (strict) · Tailwind CSS · Radix UI
primitives · Lucide icons · Recharts · Zod · Supabase (PostgreSQL, Auth, RLS) ·
Sonner

## Database

11 tables, 6 migrations, UUID primary keys throughout.

`profiles` · `events` · `event_registrations` · `opportunities` ·
`opportunity_progress` · `certifications` · `student_certifications` ·
`seller_applications` · `marketplace_listings` · `portfolio_visibility` ·
`notifications`

Domain vocabulary lives in Postgres enums mirrored by `src/lib/constants.ts`, so
an invalid state is rejected by the database rather than validated in the UI.

The attendance ladder is the schema's centrepiece:

```
interested → registered → attended → verified
└── the student's own claim ──┘   └── someone else's attestation ──┘
```

A `verified` row cannot exist without `verified_by` and `verified_at` — a CHECK
constraint. Students cannot delete verified rows.

## Authentication

Supabase Auth (email + password). An `auth.users` insert fires
`handle_new_user`, which creates the `profiles` row, generates a unique portfolio
handle, and creates a private `portfolio_visibility` row.

Roles are `student`, `community_leader`, `admin`. **Admin is not self-assignable:**
the trigger coerces any requested admin role at signup, so a crafted request
cannot grant it. Roles are always read from the database row, never from JWT
metadata.

Sessions are refreshed in middleware via `getUser()`, which revalidates the token
rather than trusting cookie contents.

## Row Level Security

All 11 tables, deny-by-default, in three cooperating layers:

| Layer | Question | Example |
|---|---|---|
| `GRANT` | Which verbs may this role use? | `anon` has no `INSERT` anywhere |
| RLS policy | Which rows? | a leader sees only their own events |
| Guard trigger | Which transitions? | nobody approves their own event |

Guard triggers exist because `WITH CHECK` cannot see the previous row.

Public portfolios are served by a `SECURITY DEFINER` function rather than a
policy, because "this row but not the email column, only if published, with
sections filtered" is not a row predicate. The upshot: **`anon` needs no grant on
`profiles` at all.**

For the same reason, `profiles` is readable only by its owner and by admins. The
two legitimate cross-user reads — an organiser seeing who registered, a listing
showing its seller's name — go through display-only views that carry their own
predicate and expose no email column.

## AI / RAG

```
question → buildRetrievalContext()  → scoped SQL as the signed-in student
        → renderContextForPrompt()  → plain text, explicit "none recorded"
        → deterministic reasoner (default) | LLM (opt-in)
```

No vector store, deliberately. One student's corpus is a few dozen structured
rows; scoped SQL retrieves more accurately than similarity search and inherits
RLS for free. See decision 7.

---

## Setup

**Prerequisites:** Node 20+, Docker Desktop (for local Supabase).

```bash
npm install
npm run db:start      # first run pulls ~3–5 GB of images
npm run start:prod    # build and serve
```

`npm run db:start` applies all migrations and seeds demo data. Open
http://localhost:3000.

> **Use `npm run start:prod`, not `npm run dev`, unless you are editing code.**
> `next dev` compiles routes on demand, which measures 2,400–7,500 ms per
> navigation here versus 146–397 ms for a production build. See
> [`docs/performance.md`](docs/performance.md).

Local Supabase keys are fixed and identical on every machine, so a working
`.env.local` is committed-adjacent via `.env.example`. Print the current values
with `npm run db:status`.

### Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | development server (Turbopack) |
| `npm run start:prod` | **build and serve — 10–20× faster than dev** |
| `npm run bench` | per-route latency benchmark |
| `npm run verify` | typecheck + lint + production build |
| `npm run db:start` / `db:stop` | local Supabase stack |
| `npm run db:reset` | recreate schema and reseed |
| `npm run db:types` | regenerate TypeScript types from the live schema |
| `npm run db:test` | 46 RLS and trigger assertions |
| `npm run test:smoke` | 47 route and role-access assertions |
| `npm run test:flow` | 43 assertions walking the full demo journey |

Test scripts default to `http://localhost:3001`; pass a base URL if Next chose a
different port: `npm run test:flow -- http://localhost:3000`.

### Deploying to hosted Supabase

Create a project, then:

```bash
npm run sb -- link --project-ref <ref>
npm run sb -- db push
```

Set `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
`SUPABASE_SERVICE_ROLE_KEY` and `NEXT_PUBLIC_SITE_URL` in your host. The
application code is unchanged.

## Environment variables

| Variable | Required | Purpose |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | yes | browser key; RLS still applies |
| `SUPABASE_SERVICE_ROLE_KEY` | no | server-only; admin operations. Never expose |
| `NEXT_PUBLIC_SITE_URL` | yes | auth redirects and shareable portfolio links |
| `CAMPUSORBIT_AI_PROVIDER` | no | `none` (default), `openai`, or `groq` |
| `CAMPUSORBIT_AI_MODEL` | no | model name |
| `OPENAI_API_KEY` / `GROQ_API_KEY` | no | only if a provider is set |

The AI works fully with `CAMPUSORBIT_AI_PROVIDER=none`.

## Demo credentials

Password for all accounts: `CampusOrbit!2026`

| Role | Email | Notes |
|---|---|---|
| Student | `(real user accounts)` | rich portfolio, published |
| Student | `aisha@campusorbit.demo` | private portfolio |
| Student | `timothy@campusorbit.demo` | attendance awaiting verification |
| Community leader | `(real user accounts)` | owns Cloud Bootcamp + a pending event |
| Community leader | `brian@campusorbit.demo` | owns the ML workshop |
| Community leader | `kevin@campusorbit.demo` | owns the Web3 hackathon |
| Admin | `benwaeldon@gmail.com` | the platform's only administrator — moderation and analytics |

Seed data includes 11 events across all moderation states, 12 opportunities, 8
catalog certifications, 6 marketplace listings, 10 accounts and 18 registrations.

**This is clearly-labelled sample data.** Organisation names refer to genuinely
public programmes (AWS certification, Microsoft Learn, GitHub Campus Experts) and
imply no partnership, sponsorship or endorsement. Fictional entries are prefixed
*Sample*. People, campus communities and listings are invented.

Walkthrough: [`docs/demo.md`](docs/demo.md).

## Future roadmap

- QR-code attendance check-in (`event_registrations.check_in_token` already exists)
- Multi-campus tenancy (`university` is a column, not a constant)
- Employer view — search students by verified evidence
- Recruiter-verifiable portfolio links with expiry
- Semantic retrieval once long-form content exists to justify it
- Materialised portfolio projection if aggregation ever becomes a bottleneck
- Organiser analytics on repeat participation

## Deliberately out of scope

Not oversights — each was declined for a reason, recorded in
[`docs/decisions.md`](docs/decisions.md#14-deliberately-out-of-scope).

| Excluded | Reason |
|---|---|
| Payments / escrow / checkout | KYC, disputes and liability. The marketplace connects people and says so on every card |
| Mobile app | responsive web covers the need; a second client doubles surface area |
| SMS / email / push | deliverability and consent infrastructure adding nothing to the core loop |
| Calendar synchronisation | integration maintenance for marginal value |
| Full messaging platform | moderating messaging is its own product |
| Social networking / feeds | a different product |

Each would have cost polish on the auto-built portfolio, which is the one thing
that makes CampusOrbit different.

---

## Verification

Not "it compiles" — behaviour is asserted:

```
npm run db:test      →  46 passed   RLS, triggers, privilege escalation
npm run test:smoke   →  47 passed   every route, every role, cross-role lockout
npm run test:flow    →  43 passed   signup → verify → portfolio → AI
npm run verify       →  typecheck + lint + build clean
```

`db:test` wraps every forbidden action so that *succeeding* fails the run: a
student attempting self-promotion to admin, self-verifying attendance, deleting
verified evidence, registering on another student's behalf, or listing without
seller approval.
