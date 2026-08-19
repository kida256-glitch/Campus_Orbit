# CampusOrbit — Requirements

## Overview

CampusOrbit is a campus technology ecosystem for students, community leaders,
and administrators at any school, university or college.

The central product thesis: **campus participation automatically becomes career
proof**. A student should never have to manually create their portfolio. If they
attend events, complete certifications, participate in opportunities, or
contribute to communities, CampusOrbit builds their portfolio from those
verified activities.

## Functional requirements

### FR-1 Authentication
- Users can sign up with name, email, password, and role (Student or Community Leader)
- Admin role is not self-assignable — enforced at the database trigger level
- After sign-in, users are redirected to their role-specific dashboard
- Suspended accounts are redirected to a suspended page

### FR-2 Student dashboard
- Shows personalised greeting, profile completion percentage
- Displays upcoming approved events
- Shows AI-matched opportunity recommendations based on interests and evidenced skills
- Shows a portfolio preview with auto-derived skills and career snapshot

### FR-3 Events system
- Community leaders can submit events for review
- Submitted events enter a `pending` queue — never published directly
- Admins approve or reject with mandatory notes
- Only `approved` and `completed` events are visible to students
- Students can mark themselves Interested or Registered
- Attendance ladder: `interested → registered → attended → verified`
- Only `verified` attendance becomes portfolio evidence
- Community leaders can verify attendance individually or in bulk

### FR-4 Opportunities
- Admins curate an opportunities directory (internships, fellowships, hackathons, etc.)
- Students can save, mark in-progress, or mark completed
- Completed opportunities contribute to portfolio evidence
- Recommendations are scored against verified skills, declared skills, and interests

### FR-5 Auto-built portfolio (core differentiator)
- No portfolio table — portfolio is a read-time SQL projection
- Skills derived from event categories, certification skills, and opportunity tags
- Proficiency reflects evidence count, not self-assessment
- Private by default; students opt in to publish
- Show-contact is a separate consent from publishing
- Public URL: `/portfolio/[username]`

### FR-6 CampusOrbit AI
- Answers only from the signed-in student's own CampusOrbit data
- 8 intents: upcoming, recommend, portfolio, next_skill, certifications, achievements, attended, search
- Deterministic built-in reasoner as default (no API key required, cannot hallucinate)
- Optional LLM upgrade (OpenAI / Groq) with same context
- Every answer shows which retrieval sections it used

### FR-7 Admin dashboard
- Event moderation with mandatory rejection notes
- Opportunity CRUD with publish/unpublish
- Seller and listing approval
- User management: role changes, suspension
- Platform analytics (verification rate as the key metric)

### FR-8 Community leader dashboard
- View own events with moderation status
- Attendance sheet with verify / bulk-verify
- Event submission form

### FR-9 Marketplace
- Seller application → admin review → approval
- Approved sellers can list items
- Listings go through moderation before appearing
- No payments — contact hand-off only

### FR-10 Notifications
- In-app only (no email/SMS)
- Written exclusively by database triggers — clients cannot forge notifications

## Non-functional requirements

### NFR-1 Security
- Authorization in PostgreSQL (RLS + guard triggers), not in React
- Admin self-assignment blocked at trigger level
- Student cannot self-verify attendance
- Verified evidence cannot be deleted by the student
- `anon` role has no INSERT anywhere
- Profiles readable only by owner and admins — cross-user reads go through display-only views

### NFR-2 Performance
- Public catalog pages cached with `unstable_cache` + tag invalidation
- Three.js shader lazy-loaded (does not block initial bundle)
- Production build target: < 400 ms per authenticated route
- DNS preconnect to Supabase

### NFR-3 Accessibility
- Keyboard navigation throughout
- ARIA labels on all interactive elements
- Skip-to-content link
- `prefers-reduced-motion` respected

### NFR-4 Consistency
- Roles always read from database row, never JWT metadata
- All form errors surfaced to UI via discriminated `ActionState`
- Every mutation calls `revalidatePath` / `revalidateTag`
