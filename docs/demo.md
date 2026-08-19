# CampusOrbit — Demo walkthrough

Roughly six minutes. Every step is verified by the automated test suite:
`npm run test:flow` runs the same journey non-interactively.

---

## Option A — Live hosted app (no setup)

Open **https://campus-orbit-delta.vercel.app** in your browser.

Sign in with the admin account:
- Email: `benwaeldon@gmail.com`
- Password: `CampusOrbit!2026`

Or create your own accounts at `/signup` for a fresh demo.

---

## Option B — Run locally

```bash
# Prerequisites: Node 20+, Docker Desktop
git clone https://github.com/kida256-glitch/Campus_Orbit.git
cd Campus_Orbit
npm install

# Copy env and fill in your Supabase credentials (see .env.example)
cp .env.example .env.local

# Start Supabase (first run pulls ~3–5 GB of Docker images)
npm run db:start

# Build and serve
npm run start:prod
```

Open http://localhost:3000.

**Admin account** — pre-provisioned by the seed:
- Email: `benwaeldon@gmail.com`
- Password: `CampusOrbit!2026`

Create student and community leader accounts via `/signup` to demo the full flow.

---

## Automated verification (no browser needed)

```bash
npm run db:test      # 55 RLS / trigger assertions
npm run test:smoke   # 29 route and role-access assertions
npm run test:flow    # 20 end-to-end flow assertions
npm run verify       # typecheck + lint + production build
```

The test scripts create their own throwaway accounts against the live Supabase
project, run the assertions, and delete the accounts. They require the
`NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` variables to be
set in `.env.local`.

---

## Full demo walkthrough

### 1. Landing page (30 s)

Open `/` while signed out.

Show the animated aurora hero: *Your campus life. Your opportunities. Your proof.*
The background is a live WebGL shader (Three.js, 60fps GLSL fragment shader with
28-iteration aurora loop).

Scroll to **The problem** — campus opportunities scatter across WhatsApp groups
and noticeboards, leaving no career evidence.

Point at the three-step strip: **Discover → Participate → Build proof.**
The key line: *the student never writes the portfolio.*

### 2. Sign up as a student (45 s)

Go to `/signup`. Enter a name, email, password. Select **Student**.

Note: the role picker only offers Student and Community Leader. Admin is not
selectable — this is enforced by a database trigger, not just a hidden UI option.
A crafted API request also cannot grant it.

After signup, land on `/onboarding`. Pick at least three interests.

### 3. The personalised dashboard (45 s)

`/dashboard`.

- Gradient hero header with animated aurora shader
- Profile completion bar
- Four stat cards (all zero — honest empty state)
- **Recommended for you** already populated from interests
- Portfolio preview: *No verified activity yet*

### 4. Discover and register (45 s)

`/discover` — show All / Events / Opportunities / Certifications / Marketplace tabs.
Type in the search box to show URL-driven filtering.

Open `/events`, pick any event, click into the detail page.

Click **Attend**. The page shows:
> Registering is not the same as proof. After the event the organiser verifies
> who actually took part.

There is no button to mark yourself verified — this is enforced in the database.

### 5. Community leader verifies attendance (60 s)

Sign out. Sign in as a community leader account (create one via `/signup` →
Community Leader role).

Have the community leader create an event (`/leader/events/new`), submit it for
review.

Sign in as the admin (`benwaeldon@gmail.com`), approve the event at
`/admin/events`.

Sign back in as the community leader. After the student "attends", open the event
at `/leader/events/[id]` — the attendance sheet lists the student.

Click **Verify**. This is the step that creates evidence.

Mention: **Verify all N** exists for large workshops — one click verifies everyone.

### 6. The portfolio builds itself (60 s — the payoff)

Sign back in as the student. Go to `/portfolio`.

What changed:
- **Verified experience** lists the event with a ✓ mark
- **Skills** shows proficiency bars — derived from the event category, never typed
- **Achievements** shows 1 verified event
- **Career snapshot** rewrites itself from the counts
- Notification bell shows *Attendance verified* and *Your portfolio grew*

The student did nothing. An organiser confirmed they showed up. That is evidence.

### 7. Complete an opportunity (30 s)

`/opportunities` → open any card → **Completed**.

Return to `/portfolio`: a second experience row appears, skills gain more evidence.

Note the distinction: this is self-reported (no third party can attest to an
external internship), so the UI shows it differently from the ✓ verified event.

### 8. Publish and share (30 s)

In the **Portfolio privacy** panel, toggle **Publish my portfolio**.

Copy the shareable link. Open it in an incognito tab — it renders for anonymous
visitors, with no email address exposed unless you separately enable that toggle.

**Download / print** opens the browser print dialog for a PDF.

### 9. CampusOrbit AI (60 s)

`/assistant`. Click a suggested prompt or type:

- *"What should I focus on next?"* — names a specific gap and a concrete path
- *"Find me quantum computing opportunities"* — answers honestly:
  > I have nothing on CampusOrbit matching "quantum computing". I only answer
  > from what is actually recorded here.

Every answer shows **Grounded in your data** with the retrieval sections used.
No API key is required — the built-in reasoner cannot hallucinate.

### 10. Admin moderation (45 s)

Sign in as `benwaeldon@gmail.com` → `/admin`.

- Moderation queue with pending count
- `/admin/events?status=pending` → Approve / Reject (rejection requires a note —
  this is a database CHECK constraint, not a UI rule)
- A community leader cannot approve their own event — enforced by a guard trigger
- `/admin/analytics` → Verification rate (the platform's integrity metric)
- `/admin/users` → Role changes and suspension

---

## Troubleshooting

| Symptom | Fix |
|---|---|
| `npm run db:start` fails | Docker Desktop must be running |
| Login fails | Run `npm run db:reset` to reseed |
| Port 3000 taken | Next picks 3001; pass `http://localhost:3001` to test scripts |
| Test scripts fail with "no container" | Run `npm run db:start` first |
| Hosted app shows errors | Check Vercel env vars include `NEXT_PUBLIC_SITE_URL` |

---

## Key things to point at

**"Can a student fake this?"**
No. `npm run db:test` live-demonstrates: self-promotion to admin refused, self-
verification of attendance refused, deleting verified evidence refused. Every
"forbidden" test fails the run if it *succeeds*.

**"What if the AI hallucinates?"**
The default reasoner has no generative step — it composes from SQL rows. With an
LLM configured, the system prompt forbids leaving the context and errors fall back
to the reasoner.

**"How is this different from a portfolio website?"**
A portfolio website is a document a student edits. CampusOrbit has no portfolio
table. The portfolio is a read-time projection of verified activity stored in
other tables. A student literally has nothing to write to.
