---
inclusion: always
---

# CampusOrbit — Project context

This is a full-stack Next.js 15 web application called **CampusOrbit**.

## Stack
- Next.js 15 App Router, TypeScript (strict), Tailwind CSS
- Supabase: PostgreSQL, Auth, RLS, Storage
- Radix UI primitives, Lucide React icons, Recharts, Three.js (WebGL shader)
- Zod for validation, Sonner for toasts

## Key conventions

### Server actions
All mutations use Server Actions returning `ActionState<T>`:
```ts
type ActionState<T> = { ok: true; message?: string; data?: T }
                    | { ok: false; message: string; fieldErrors?: Record<string, string> }
```
Import helpers from `@/lib/actions/types`: `ok()`, `fail()`, `humanizeDbError()`.

### Supabase clients
- `createClient()` from `@/lib/supabase/server` — per-request, session-aware
- `createPublicClient()` from `@/lib/supabase/public` — cookie-free, for public catalogs
- `createAdminClient()` from `@/lib/supabase/admin` — service role, server-only
- Never use the service role client in a Server Component or Action unless RLS cannot help

### Auth helpers
- `getProfile()` — memoised with React `cache()`, returns null if unauthenticated
- `requireProfile()` — redirects to /login if no session
- `requireRole(...roles)` — redirects to the user's own dashboard if wrong role

### Cache invalidation
Public catalog mutations must call both `revalidatePath` and `revalidateTag`:
```ts
revalidateTag(CACHE_TAGS.events);   // invalidates unstable_cache
revalidatePath("/events");           // invalidates rendered pages
```

### Forms in dialogs
Use `onSubmit` + `e.preventDefault()` + `new FormData(e.currentTarget)` — never
pass a startTransition wrapper as the form `action` prop inside a Radix Dialog portal.

## Project file structure

```
src/
  app/                    # Next.js App Router pages
    (auth)/               # login, signup, onboarding
    (main)/               # all authenticated routes
    api/assistant/        # CampusOrbit AI route handler
  components/
    ui/                   # base primitives (button, card, dialog, etc.)
    shared/               # cross-feature components (EventCard, StatCard, etc.)
    shell/                # sidebar, topbar, mobile nav
    events/               # registration buttons, attendance sheet, event form
    opportunities/        # progress buttons
    portfolio/            # portfolio view, privacy panel, cert manager
    marketplace/          # listing card, seller panel
    assistant/            # AI chat component
    forms/                # Field, TagPicker, ImagePicker
    landing/              # portfolio preview
    brand/                # Logo, OrbitMark
  lib/
    actions/              # server action modules
    ai/                   # retrieval, assistant, utils
    auth.ts               # getProfile, requireProfile, requireRole
    constants.ts          # enums, labels, options (mirrors DB enums)
    navigation.ts         # nav items per role
    portfolio.ts          # skillProficiency, careerSnapshot, achievements
    queries/              # server-side data fetching
    supabase/             # client, server, admin, middleware, public
    types/                # database.ts (generated from schema)
    utils.ts              # cn, greeting, slugify, percent, daysUntil
    validation.ts         # Zod schemas
supabase/
  migrations/             # 6 SQL migrations applied in order
  seed.sql                # admin account seed
  tests/rls_checks.sql    # 55 RLS assertions
scripts/                  # smoke.mjs, demo-flow.mjs, bench.mjs, db-test.mjs
docs/                     # architecture, database, decisions, demo, performance
```

## Design tokens

Colors: `navy-*` (deep blue text/backgrounds), `orbit-*` (blue accent), `emeraldx-*` (green accent)
Gradients: `bg-orbit-gradient` (135° navy→blue→emerald), `bg-mesh-strong` (radial glows)
Shadows: `shadow-soft`, `shadow-card`, `shadow-glow`, `shadow-lift`
Animations: `animate-fade-up`, `animate-slide-in-left`, `animate-float`, `animate-pulse-glow`
Utilities: `glass`, `shimmer`, `scrollbar-slim`, `stagger-1` through `stagger-8`
