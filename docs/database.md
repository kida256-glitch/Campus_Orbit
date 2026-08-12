# CampusOrbit — Database

PostgreSQL via Supabase. Five migrations in `supabase/migrations/`, applied in
order:

| Migration | Contents |
|---|---|
| `…000100_initial_schema.sql` | extensions, enums, 11 tables, indexes, constraints |
| `…000200_auth_and_guards.sql` | signup trigger, role helpers, state-transition guards |
| `…000300_rls.sql` | Row Level Security policies |
| `…000400_portfolio.sql` | portfolio projection, recommendations, analytics |
| `…000500_grants.sql` | table privileges per role |
| `…000600_public_views.sql` | narrows profile exposure to display-only views |

Reset and reseed with `npm run db:reset`.

## Entity relationships

```
auth.users ──1:1──> profiles
                      │
     ┌────────────────┼─────────────────┬──────────────────┐
     │                │                 │                  │
     ▼                ▼                 ▼                  ▼
   events      event_registrations  opportunity_    student_certifications
  (created_by)   (student_id)        progress          (student_id)
     │                │              (student_id)          │
     └────────────────┘                   │                │
       event_id                    opportunity_id    certification_id
                                          │                │
                                    opportunities    certifications
                                                        (catalog)

profiles ──1:1──> portfolio_visibility
profiles ──1:1──> seller_applications ──> marketplace_listings (seller_id)
profiles ──1:N──> notifications
```

## Tables

### `profiles`
Mirror of `auth.users`, created by the `on_auth_user_created` trigger.

| Column | Notes |
|---|---|
| `id` | PK, FK to `auth.users` on delete cascade |
| `full_name` | 2–120 chars |
| `email` | `citext`, unique — case-insensitive by type |
| `role` | `user_role` enum, default `student` |
| `username` | unique slug for `/portfolio/[username]`, auto-generated with collision suffixes |
| `interests`, `skills` | `text[]`, GIN-indexed for array-overlap matching |
| `links` | `jsonb` — `{github, linkedin, website}` |
| `onboarded` | drives the onboarding redirect |
| `suspended` | preserves the row while removing access |
| `university` | default `Makerere University Business School` |

Beyond the brief: `username` (needed for the public portfolio route),
`suspended` (admin moderation), `links` (portfolio hero), `onboarded`
(interest-picking flow).

### `events`
| Column | Notes |
|---|---|
| `status` | `pending` → `approved` / `rejected` → `completed` |
| `rejection_note` | **CHECK: required when status is `rejected`** |
| `created_by` | FK to profiles |
| `reviewed_by`, `reviewed_at` | stamped by the guard trigger, not the client |

`CHECK (end_time IS NULL OR end_time > start_time)`.

### `event_registrations` — the trust boundary
| Column | Notes |
|---|---|
| `status` | `interested` \| `registered` \| `attended` \| `verified` |
| `verified_by`, `verified_at` | **CHECK: both required when `verified`** |
| `check_in_token` | unused UUID, reserved for future QR check-in |
| | `UNIQUE (event_id, student_id)` |

The provenance CHECK is what makes "✓ Verified" mean something: no verified row
can exist without recording who signed it off.

### `opportunity_progress`
`saved` → `in_progress` → `completed`. `CHECK: completed requires completed_at`,
and a trigger sets that timestamp so it is never client-supplied.
`UNIQUE (opportunity_id, student_id)`.

### `student_certifications`
`certification_id` is nullable so students can track credentials outside the
catalog. When it *is* set, the action copies name/provider/skills from the
catalog so skill derivation stays consistent across students.
`CHECK: completed requires completion_date`; `CHECK: completion >= start`.

### `portfolio_visibility`
One row per student, created at signup with `is_public = false`. Section toggles
(`show_events`, `show_opportunities`, `show_certifications`) and a separate
`show_contact` for the email address.

### `notifications`
Written **only** by `SECURITY DEFINER` triggers. There is no `INSERT` policy and
no `INSERT` grant, so a client cannot forge a notification.

## Enums

| Enum | Values |
|---|---|
| `user_role` | student, community_leader, admin |
| `event_category` | AI, Web3, Cloud, Software Development, Data, Cybersecurity, Design, Entrepreneurship, Career, Other |
| `event_status` | pending, approved, rejected, completed |
| `registration_status` | interested, registered, attended, verified |
| `opportunity_type` | Internship, Fellowship, Hackathon, Scholarship, Certification, Competition, Grant, Course |
| `opportunity_status` | draft, published, archived |
| `progress_status` | saved, in_progress, completed |
| `certification_status` | in_progress, completed |
| `marketplace_category` | Laptops, Phones, Accessories, Networking Equipment, Software, Other |
| `listing_condition` | new, like_new, good, fair |
| `moderation_status` | pending, approved, rejected |
| `contact_method` | whatsapp, phone, email |
| `notification_type` | 11 values, see migration |

Enums rather than free text so an invalid state is rejected by the database, and
`src/lib/constants.ts` mirrors them exactly.

## Functions

### Portfolio projection
| Function | Returns |
|---|---|
| `portfolio_skills(uuid)` | skill, evidence_count, verified_count, sources[] |
| `portfolio_experience(uuid)` | verified events + completed opportunities, newest first |
| `portfolio_stats(uuid)` | jsonb counters: verified events, hackathons, workshops, community activities, certifications, top categories |
| `profile_completion(uuid)` | 0–100 weighted score |
| `public_portfolio(text)` | the whole public payload for one handle |

`category_skills()` maps an event category to the skills it evidences, which is
how attending a Web3 hackathon produces Solidity evidence without anyone typing
it in.

### `public_portfolio(handle text)`
A `SECURITY DEFINER` function rather than a table policy, on purpose. It:

1. resolves the handle and skips suspended accounts,
2. returns `{private: true, full_name}` unless the student opted in (owners and
   admins always pass),
3. filters each section by the student's toggles,
4. returns `email` only when `show_contact` is true.

Because it is a function, **`anon` needs no grant on `profiles` at all** —
verified by a test asserting anonymous reads of `profiles` are refused. A
row-level policy could not express "this row, but not this column".

### `recommended_opportunities(uuid, int)`
Scores published, unexpired, not-yet-completed opportunities:

```
3 × overlap with demonstrated (verified) skills
2 × overlap with declared skills
2 × overlap with stated interests
+1 if the deadline is within 21 days,  −5 if already passed
```

Demonstrated skills outweigh claimed ones, so recommendations improve as a
student accumulates real evidence.

### `platform_analytics()`
Every admin metric in one round trip. Raises `Administrator access required` for
non-admins — tested.

## Row Level Security

All 11 tables have RLS enabled. Highlights:

**Students** read approved/completed events and published opportunities; manage
their own registrations, progress, certifications, profile and visibility; read
only their own notifications.

**Community leaders** insert events (forced to `pending`); read and edit their
own; see registrations for their own events; verify attendance for their own
events. They cannot see another leader's pending event.

**Admins** have full moderation access.

**Anonymous** may read exactly four catalogs — events, opportunities,
certifications, approved listings — and nothing else. No write grant anywhere.

Role helpers are `SECURITY DEFINER` with a pinned `search_path`, because a policy
on `profiles` that queries `profiles` would recurse.

### `profiles` is self-or-admin only

`can_view_profile(uuid)` returns true only for your own row or an admin.

An earlier version also opened whole rows to a leader whose event you joined, and
to the seller of an approved listing. That granted `SELECT` on the *entire* row —
including `email` — which contradicted the rule that contact details are opt-in
via `portfolio_visibility.show_contact`. RLS is row-level and cannot express
"this row but not that column", so the fix was to narrow the policy and route the
two legitimate cross-user reads through views.

## Display-only views

Both are `security_invoker = false` (they run as the owner) and carry their own
access predicate, so they replace exactly what the old policy allowed and nothing
more.

### `event_participants`
An organiser's own attendance sheet: registration state plus the student's name,
handle and avatar. Predicate: `e.created_by = auth.uid() OR is_admin()`.
**No email column.** Granted to `authenticated`.

### `marketplace_public_listings`
Approved listings plus the seller's display name and the contact method they
deliberately published. **No email column.** Granted to `anon, authenticated`.

Application queries must use these views rather than joining `profiles`. A direct
join now returns null and degrades silently — the attendance sheet would render
"Unknown student" for every participant while still returning HTTP 200, which is
why `npm run test:smoke` asserts that real participant names appear and that no
email addresses do.

## Guard triggers

| Trigger | Prevents |
|---|---|
| `guard_profile_changes` | self-promotion to admin; self-unsuspension; email/id tampering |
| `guard_event_insert` | submitting a pre-approved event |
| `guard_event_moderation` | a leader approving their own event; also stamps reviewer + notifies |
| `guard_registration_status` | self-verifying attendance; verified rows without provenance |
| `guard_seller_application` | self-approving as a seller |
| `guard_listing_moderation` | self-approving a listing |
| `handle_new_user` | admin at signup — the requested role is coerced to student or community_leader |

## Grants

Table privileges are checked *before* RLS, so policies alone are insufficient.
Rather than granting blanket access, each role receives only the verbs its
policies reference. `anon` gets `SELECT` on four tables. `notifications` grants
no `INSERT` to anyone.

Discovered during testing: with no grants at all, `authenticated` was blocked
before RLS applied. The grants migration exists because a test failed.

## Indexes

UUID primary keys throughout. Additional indexes on the access paths that
actually run: `events(status, date)`, `events(created_by)`,
`event_registrations(student_id, status)`, `event_registrations(event_id, status)`,
`opportunities(status, deadline)`, `opportunity_progress(student_id, status)`,
`notifications(user_id, read, created_at DESC)`, plus GIN indexes on the
`text[]` columns used for interest and skill matching.

## Testing

```bash
npm run db:test
```

46 assertions across five groups: student isolation, privilege escalation
attempts, leader scoping, admin capability, anonymous exposure. Each forbidden
action is wrapped so that *succeeding* fails the run.

Two of these tests initially failed for the right reason — a leader genuinely
cannot read a student's notifications, and `anon` has no grant on `profiles` at
all — which is why the assertions now verify side effects as the table owner.
