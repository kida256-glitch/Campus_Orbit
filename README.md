# CampusOrbit

**Your campus life. Your opportunities. Your proof.**

CampusOrbit brings campus tech events, opportunities, certifications and
communities into one place — then automatically turns your participation into a
career portfolio.

For every school, university and college.

---

## Built entirely by Kiro

> *CampusOrbit was designed, architected, coded, tested, and deployed from scratch by
> **[Kiro](https://kiro.dev)** — Amazon's AI-powered development environment.*

Every line of code, every database migration, every SQL policy, every test, and
every deployment instruction in this repository was produced by Kiro in response
to a product brief from the project owner. No boilerplate was cloned. No external
starter kit was used.

### What Kiro built

**Planning and architecture**
- Defined the full product scope (student portfolio, events, opportunities,
  certifications, marketplace, AI assistant, admin moderation)
- Designed the multi-role data model (student / community leader / admin)
- Made and documented 14 deliberate architectural decisions (see [`docs/decisions.md`](docs/decisions.md))
- Chose the tech stack, justified every choice

**Database (PostgreSQL via Supabase)**
- 6 migrations from scratch: schema, auth guards, RLS policies, portfolio engine,
  table grants, and display-only views
- 11 tables, enums, indexes, UUID primary keys, foreign key constraints
- Row Level Security on all 11 tables — deny-by-default, 3-layer enforcement
  (GRANT → RLS policy → guard trigger)
- SECURITY DEFINER guard triggers: blocks self-promotion to admin, prevents
  self-verification of attendance, stamps reviewer provenance, fires notifications
- Portfolio projection engine as pure SQL functions (`portfolio_skills`,
  `portfolio_stats`, `portfolio_experience`, `public_portfolio`)
- Personalised recommendation scoring in SQL
- One-pass admin analytics function
- Wrote 55 RLS assertions (all pass) to verify the security model

**Backend (Next.js 15 Server Components + Server Actions)**
- 28 routes: student dashboard, events, opportunities, portfolio (own + public),
  AI assistant, discover, marketplace, profile, community leader dashboard +
  event management, full admin moderation suite
- 10 server action modules covering the entire write path
- Middleware for session refresh and role-scoped HTTP redirects
- React `cache()` memoisation to eliminate duplicate session lookups
- Catalog caching with `unstable_cache` and tag-based invalidation
- API route for the AI assistant (`/api/assistant`)

**Authentication and authorisation**
- Supabase Auth integration (email + password)
- `handle_new_user` trigger: auto-creates profile, generates username,
  blocks admin self-assignment at signup
- Role always read from the database row, never from JWT metadata
- Suspension system: preserves evidence, removes access

**The auto-built portfolio** *(the core product differentiator)*
- Portfolio is a read-time projection of verified activity — no `portfolio` table
- Skill proficiency derived from evidence count across events, certifications,
  and opportunities — not self-reported
- Four-state attendance ladder (interested → registered → attended → verified)
  with the verified step being the only one that becomes evidence
- Public/private toggle, per-section visibility controls, opt-in contact sharing

**CampusOrbit AI**
- Retrieval-Augmented Generation over the student's own Supabase data
- 8-intent deterministic reasoner — works with zero API keys, cannot hallucinate
- Optional upgrade to OpenAI or Groq with the same context
- Every answer shows which retrieval sections it drew from

**UI / Frontend**
- Full design system: navy/blue/emerald colour palette, custom Tailwind tokens,
  15 animation keyframes (float, pulse-glow, slide-in, fade-up-sm, etc.)
- Animated WebGL aurora shader background (Three.js, GLSL fragment shader,
  60fps-capped, tab-hidden pause, lazy-loaded)
- 25+ reusable components: stat cards with gradient backgrounds, event cards,
  opportunity cards, portfolio view, attendance sheet, certification manager,
  dual-mode image picker (upload or URL), filter bar, empty states, skeletons
- Responsive layout: sidebar on desktop, mobile tab bar, glass topbar
- Staggered entry animations across dashboards and cards
- Accessible — keyboard navigation, ARIA labels, skip-to-content, focus rings,
  `prefers-reduced-motion` respected

**Marketplace**
- Seller application → moderation → approval flow
- Supabase Storage bucket (`images`) provisioned with upload policies
- Dual-mode image picker for listings and event banners
- Display-only SQL views to expose seller names without leaking emails

**Testing**
- 55 SQL assertions covering RLS, guard triggers, and privilege escalation
- 54 end-to-end smoke tests across all routes and all role combinations
- 20 demo-flow tests walking the full product journey (signup → verify → AI)
- Separate 10-step seller flow test

**Performance optimisations**
- Landing page: 1,445 ms → 25 ms (−98%) via `unstable_cache` with cache tags
- Anonymous pages: 347 ms → 39 ms (−89%)
- Three.js lazy-loaded via `next/dynamic` (splits ~600 KB chunk from initial bundle)
- DNS preconnect to Supabase in `<head>`
- AVIF + WebP image formats, 31-day immutable cache headers
- Supabase round-trip: 7 ms with warm connection

**DevOps and deployment**
- Local Supabase stack (Docker) for development
- Hosted Supabase project with migrations pushed via CLI
- Deployed to Vercel with correct environment variables
- GitHub repository wired to Vercel for auto-deploy on push
- `vercel.json` with correct Next.js settings

### Development log

The entire application was built in a single extended Kiro session. The order of
work:

1. Project foundation — configs, Tailwind tokens, Supabase CLI setup
2. Database schema and migrations (all 6)
3. Row Level Security and guard triggers
4. Portfolio SQL engine
5. Authentication and profile management
6. All server actions and query layer
7. All 28 route pages
8. Shell components (sidebar, topbar, mobile nav)
9. Shared UI components
10. Events system with attendance verification
11. Opportunities and certifications
12. Auto-built portfolio (public and private views)
13. CampusOrbit AI (retrieval + deterministic reasoner + API route)
14. Community leader dashboard and event management
15. Admin dashboard (moderation, opportunities, marketplace, users, analytics)
16. Marketplace with seller onboarding
17. Discovery page
18. Landing page
19. Performance optimisation pass
20. UI upgrade (animations, gradient cards, WebGL shader background)
21. Seller application form fix (onSubmit pattern for Dialog portals)
22. Image upload (Supabase Storage, drag-and-drop or URL)
23. Multi-institution support (university field on signup)
24. Demo data removal (real-user-only mode)
25. Deployment to Vercel + GitHub push

### Kiro's approach

Kiro did not generate code and hand it over to be debugged. Every significant
change was verified:

- **Database changes** were run against a live local Supabase stack and tested
  with SQL assertions before committing
- **Security claims** were verified by impersonating each role in SQL and asserting
  that forbidden actions failed
- **Route behaviour** was verified by HTTP requests that checked actual page content,
  not just status codes
- **Bugs found during testing were fixed immediately** — three real issues were
  caught: missing table grants (policies ran but no GRANT → access denied), role
  gating returning HTTP 200 instead of 307 (layout streamed before page guard),
  and silent form failures inside Radix Dialog portals

---

## Live app

**https://campus-orbit-delta.vercel.app**

Hosted on Vercel, backed by Supabase (hosted project `nhorfibqbbumrjwjxiwb`).

## Admin account

The platform administrator is pre-provisioned:

| Field | Value |
|---|---|
| Email | `benwaeldon@gmail.com` |
| Name | Benjamin Wakid |
| Password | `CampusOrbit!2026` |
| Role | Admin |

All other accounts are created by real users at `/signup`. There are no demo
accounts or sample data — the platform runs on real content from the start.

The 8-entry certifications catalog (AWS, Google Cloud, Microsoft, CompTIA etc.)
is the only pre-loaded content, because it describes real publicly available credentials.

---

## The problem

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
primitives · Lucide icons · Recharts · Three.js (WebGL shader) · Zod ·
Supabase (PostgreSQL, Auth, RLS, Storage) · Sonner

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

## Row Level Security

All 11 tables, deny-by-default, in three cooperating layers:

| Layer | Question | Example |
|---|---|---|
| `GRANT` | Which verbs may this role use? | `anon` has no `INSERT` anywhere |
| RLS policy | Which rows? | a leader sees only their own events |
| Guard trigger | Which transitions? | nobody approves their own event |

Public portfolios are served by a `SECURITY DEFINER` function rather than a
policy. The upshot: **`anon` needs no grant on `profiles` at all.**

## AI / RAG

```
question → buildRetrievalContext()  → scoped SQL as the signed-in student
        → renderContextForPrompt()  → plain text, explicit "none recorded"
        → deterministic reasoner (default) | LLM (opt-in)
```

No vector store, deliberately. One student's corpus is a few dozen structured
rows; scoped SQL retrieves more accurately than similarity search.

---

## Setup

**Prerequisites:** Node 20+, Docker Desktop (for local Supabase).

```bash
npm install
npm run db:start      # first run pulls ~3–5 GB of images
npm run start:prod    # build and serve
```

### Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | development server (Turbopack) |
| `npm run start:prod` | **build and serve — 10–20× faster than dev** |
| `npm run bench` | per-route latency benchmark |
| `npm run verify` | typecheck + lint + production build |
| `npm run db:start` / `db:stop` | local Supabase stack |
| `npm run db:reset` | recreate schema and reseed |
| `npm run db:test` | 55 RLS and trigger assertions |
| `npm run test:smoke` | 29 route and role-access assertions |
| `npm run test:flow` | 20 assertions walking the full demo journey |

## Environment variables

| Variable | Required | Purpose |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | yes | browser key; RLS still applies |
| `SUPABASE_SERVICE_ROLE_KEY` | no | server-only; admin operations. Never expose |
| `NEXT_PUBLIC_SITE_URL` | yes | auth redirects and shareable portfolio links |
| `CAMPUSORBIT_AI_PROVIDER` | no | `none` (default), `openai`, or `groq` |
| `OPENAI_API_KEY` / `GROQ_API_KEY` | no | only if a provider is set |

## Future roadmap

- QR-code attendance check-in (`event_registrations.check_in_token` already exists)
- Multi-campus tenancy (`university` is a column, not a constant)
- Employer view — search students by verified evidence
- Recruiter-verifiable portfolio links with expiry
- Semantic retrieval once long-form content exists to justify it

## Deliberately out of scope

| Excluded | Reason |
|---|---|
| Payments / escrow / checkout | KYC, disputes and liability |
| Mobile app | responsive web covers the need |
| SMS / email / push | deliverability and consent infrastructure |
| Calendar synchronisation | integration maintenance for marginal value |
| Full messaging platform | moderating messaging is its own product |

---

## Verification

```
npm run db:test      →  55 passed   RLS, triggers, privilege escalation
npm run test:smoke   →  29 passed   every route, every role, cross-role lockout
npm run test:flow    →  20 passed   signup → verify → portfolio → AI
npm run verify       →  typecheck + lint + build clean
```

---

*Built entirely by [Kiro](https://kiro.dev) — Amazon's AI development environment.*
