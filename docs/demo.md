# CampusOrbit — Demo script

Roughly six minutes. Every step below is covered by an automated test, so if the
walkthrough breaks you can diagnose it with `npm run test:flow`.

## Before you start

```bash
npm run db:start      # Supabase (Docker)
npm run dev           # http://localhost:3000
```

Optional but recommended — reset to clean seed data:

```bash
npm run db:reset
```

**Demo accounts** — password `CampusOrbit!2026` for all:

| Role | Email | Use for |
|---|---|---|
| Student | `(real user accounts)` | rich, pre-populated portfolio |
| Student | `aisha@campusorbit.demo` | private portfolio (privacy contrast) |
| Community leader | `(real user accounts)` | owns the Cloud Bootcamp + a pending event |
| Community leader | `brian@campusorbit.demo` | owns the ML workshop |
| Admin | `benwaeldon@gmail.com` | the only administrator — moderation and analytics |

---

## The 60-second version

If you have one minute, show two screens:

1. `/portfolio/benjamin-ssekandi` — a shareable, evidence-backed portfolio nobody
   typed in.
2. `/leader/events/{id}` as Sandra — the organiser clicking **Verify**, which is
   what created that evidence.

The gap between those two screens is the entire product.

---

## Full walkthrough

### 1. The problem (landing page, 30s)

Open `/` while signed out.

Read the hero: *Your campus life. Your opportunities. Your proof.* Scroll to
**The problem** — campus opportunities are scattered across WhatsApp groups,
noticeboards and word of mouth, and nothing a student does leaves a trace they
can show an employer.

Point at the three-step strip: **Discover → Participate → Build proof.** Say the
line that matters: *the student never writes the portfolio.*

### 2. A new student signs up (60s)

Click **Build your portfolio** → `/signup`.

- Enter any name and email, pick **Student**.
- Note the role dropdown offers Student and Community Leader only. Mention that
  Admin is not merely hidden — `handle_new_user` coerces any requested admin role
  to student, so a crafted signup request cannot grant it.

You land on `/onboarding`. Pick at least three interests — say **Cloud
Computing**, **AI**, **Software Development**.

### 3. The personalised dashboard (45s)

`/dashboard`.

- *Good morning, {name} 👋* with profile completion as a live percentage.
- Four activity stats, all zero. **This is the honest empty state** — a new
  student has no evidence, and the product does not pretend otherwise.
- **Recommended for you** is already populated, matched from the interests just
  chosen. Point out the *Matches your …* line on a card.
- Portfolio preview reads *No verified activity has been recorded yet* rather
  than inventing filler.

### 4. Discover and register (45s)

Go to `/discover`. Show the tabs (All / Events / Opportunities / Certifications /
Marketplace) and type `cloud` in the search box to show URL-driven filtering.

Open **Events** → pick **AWS Cloud Practitioner Bootcamp** → click into detail.

Click **Attend**. Read the callout that appears:

> Registering is not the same as proof. After the event the organiser verifies
> who actually took part.

Then try to cheat: there is no control anywhere to mark yourself attended. Worth
saying out loud that this is enforced in the database, not just missing from the
UI — `npm run db:test` asserts a student attempting it gets *Attendance can only
be verified by the organiser or an administrator*.

### 5. The organiser verifies (60s)

Sign out. Sign in as `(real user accounts)`.

`/leader` shows **Events published**, **Awaiting approval**, **Total
registrations**, **Verified participants** — plus a prompt when participants are
waiting on her.

Open **AWS Cloud Practitioner Bootcamp** → the attendance sheet lists the new
student as *Registered*.

Click **Verify**. Note the confirmation wording: this becomes permanent evidence
on that student's portfolio.

Mention scale: **Verify all N** exists so a 200-person workshop is one click.

### 6. The portfolio built itself (60s — the payoff)

Sign back in as the new student. Go to `/portfolio`.

Compare against 30 seconds ago:

- **Verified experience** now lists the bootcamp with a ✓ Verified mark.
- **Skills** shows AWS, Cloud Computing and Docker with proficiency bars — derived
  from the event's category, never typed in. Each reads *1 verified activity
  across events*.
- **Achievements** counts 1 verified event.
- **Career snapshot** is a written summary generated from the counters.
- The notification bell has *Attendance verified* and *Your portfolio grew*.

The student added nothing. They attended something and someone confirmed it.

### 7. Complete an opportunity (30s)

`/opportunities` → open any card → **Completed**.

Return to `/portfolio`: a second experience row appears, more skills gain
evidence, and the career snapshot rewrites itself.

Be straight about the distinction: this one is self-reported, because no campus
organiser can attest to an external programme. The UI never claims otherwise —
compare the wording against the ✓ Verified event above it.

### 8. Share it (30s)

In the **Portfolio privacy** panel, toggle **Publish my portfolio**.

- Before the toggle, the portfolio was private. Prove it: open
  `/portfolio/aisha-nakato` in a new tab — *This portfolio is private*, with no
  statistics leaked.
- Copy the shareable link and open it signed out. The portfolio renders for
  anonymous visitors.
- Note the email is still hidden — publishing and sharing contact details are two
  separate consents.
- **Download / print** opens the browser print dialog for a PDF to attach to a CV.

### 9. Ask CampusOrbit AI (60s)

`/assistant`. Use the suggested prompts, then ask **"What should I focus on
next?"**

The answer names the student's real verified skill, the actual gap, and a
specific opportunity or certification on the platform that would close it. Each
answer shows **Grounded in your data** with the retrieval sections it used.

Now prove it will not bluff: ask **"Find me quantum computing opportunities."**

> I have nothing on CampusOrbit matching "quantum computing". I only answer from
> what is actually recorded here, so I won't guess at listings that don't exist.

Worth noting: this runs with no API key and no external service. Retrieval is
scoped SQL through the student's own session, so RLS decides what can even enter
the context — there is no way to ask about another student.

### 10. Trust and moderation (45s)

Sign in as `benwaeldon@gmail.com`.

`/admin` — the moderation queue with counts. `/admin/events?status=pending`:

- **Approve** an event and watch it appear publicly.
- **Reject** one and note that the note field is mandatory. This is a database
  CHECK constraint, not a form rule, so no submission can be killed silently.
- Mention that a leader cannot approve their own event — enforced by trigger.

`/admin/analytics` — lead with **Verification rate**: the share of registrations
that became verified evidence. That single number is the platform's integrity
metric.

`/admin/users` — role changes and suspension. Suspension keeps the account and its
evidence but removes access, and an admin cannot demote or suspend themselves.

---

## If something goes wrong

| Symptom | Fix |
|---|---|
| Every page 500s | Supabase is down — `npm run db:start` |
| Login rejects the demo password | Seed not applied — `npm run db:reset` |
| Portfolio looks empty for Benjamin | `npm run db:reset` |
| Port 3000 taken | Next picks 3001; pass it to the test scripts |

Verify the whole flow non-interactively:

```bash
npm run db:test      # 46 RLS and trigger assertions
npm run test:smoke   # 47 route and role-access assertions
npm run test:flow    # 43 assertions walking this exact script
```

---

## Questions to expect

**"Couldn't a student just fake this?"** No. Run `npm run db:test` live. It
attempts self-promotion to admin, self-verification of attendance, deleting
verified evidence, registering on someone else's behalf, and listing without
seller approval. All refused by Postgres.

**"What if the AI makes something up?"** The default reasoner has no generative
step — it composes from retrieved rows and says "none recorded" for empty
sections. With a model configured, the prompt forbids leaving the context block
and errors fall back to the deterministic path.

**"Is this real data?"** No, and it says so. `supabase/seed.sql` is labelled
sample data; organisation names refer to genuinely public programmes (AWS
certification, GitHub Campus Experts) and imply no partnership. Fictional entries
are prefixed *Sample*.

**"Why is the marketplace so thin?"** Deliberate. Payments mean KYC, disputes and
liability. CampusOrbit verifies sellers, moderates listings, and hands off to
WhatsApp — and tells users on every card that it does not handle payment.
