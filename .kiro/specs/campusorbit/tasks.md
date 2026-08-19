# CampusOrbit — Implementation Tasks

## Status legend
- [x] Completed
- [ ] Not started

---

## Phase 1 — Foundation
- [x] Project configuration (Next.js 15, TypeScript, Tailwind, shadcn)
- [x] Supabase CLI setup and local Docker stack
- [x] Design token system (navy/orbit/emerald palette, shadows, gradients)
- [x] Global CSS (animations, glassmorphism, stagger utilities)
- [x] Root layout with Inter font and TooltipProvider

## Phase 2 — Database
- [x] Migration 1: schema (11 tables, enums, indexes, constraints)
- [x] Migration 2: auth guards and SECURITY DEFINER triggers
- [x] Migration 3: Row Level Security policies (all 11 tables)
- [x] Migration 4: portfolio projection SQL functions
- [x] Migration 5: table grants per role
- [x] Migration 6: display-only views (event_participants, marketplace_public_listings)
- [x] Seed file: admin account (benwaeldon@gmail.com)
- [x] RLS test suite (55 assertions)

## Phase 3 — Authentication
- [x] Signup form with role picker (Student / Community Leader only)
- [x] Login form
- [x] Onboarding flow (interests + skills)
- [x] Auth layout with animated brand panel
- [x] Middleware (session refresh + role-scoped redirects)
- [x] `getProfile()` with React `cache()` memoisation

## Phase 4 — Core queries and actions
- [x] Server action pattern (`ActionState<T>` discriminated result)
- [x] Auth actions (signIn, signUp, signOut, onboarding)
- [x] Registration actions (setRegistration, verifyAttendance, verifyAll)
- [x] Opportunity actions (setProgress, removeProgress)
- [x] Certification actions (save, delete)
- [x] Profile actions (updateProfile, updateUsername, updatePortfolioVisibility)
- [x] Event actions (submit, update, delete, complete, approve, reject)
- [x] Marketplace actions (applyAsSeller, createListing, reviewSeller, reviewListing)
- [x] Admin actions (saveOpportunity, setOpportunityStatus, changeUserRole, setUserSuspended)

## Phase 5 — App shell
- [x] Sidebar (animated, gradient active state, role label)
- [x] Topbar (glass effect, gradient top line, notifications off critical path)
- [x] Mobile nav
- [x] Notification bell (streamed via Suspense)
- [x] User menu

## Phase 6 — Student routes
- [x] Dashboard (animated header, stat cards, recommendations, portfolio preview, AI card)
- [x] Events page (filter bar, registration buttons)
- [x] Event detail page
- [x] Opportunities page (filter bar, progress buttons)
- [x] Opportunity detail page
- [x] Portfolio page (own — privacy panel, certification manager)
- [x] Public portfolio page (`/portfolio/[username]`)
- [x] AI assistant page (chat UI, suggested prompts, grounded responses)
- [x] Discover page (unified tabbed feed, personalised strip)
- [x] Marketplace page (seller panel with prominent apply-to-sell)
- [x] Profile page (edit form with university field)

## Phase 7 — Community leader routes
- [x] Leader dashboard
- [x] My events list
- [x] Event detail + attendance sheet
- [x] Submit event form (with ImagePicker)
- [x] Edit event form

## Phase 8 — Admin routes
- [x] Admin dashboard
- [x] Event approvals (status filter tabs, moderation actions)
- [x] Opportunity management (CRUD with ImagePicker)
- [x] Marketplace moderation (sellers + listings)
- [x] Users page (search, role change, suspend)
- [x] Analytics (charts, verification rate, platform stats)

## Phase 9 — Shared components
- [x] Button (lift + shadow on hover, all variants)
- [x] Card (interactive hover)
- [x] StatCard (gradient backgrounds per tone)
- [x] EventCard (scale-up on image hover)
- [x] OpportunityCard
- [x] ListingCard
- [x] FilterBar (URL-driven, debounced search)
- [x] EmptyState
- [x] PageHeader
- [x] ImagePicker (upload to Supabase Storage or paste URL)
- [x] PortfolioView (shared between own and public pages)
- [x] AttendanceSheet
- [x] CertificationManager
- [x] PrivacyPanel
- [x] AnimatedShaderBackground (Three.js WebGL, lazy-loaded)

## Phase 10 — AI assistant
- [x] Retrieval context builder (scoped SQL through student's session)
- [x] Context renderer (plain text, explicit "none recorded")
- [x] Deterministic reasoner (8 intents, cannot hallucinate)
- [x] LLM path (OpenAI / Groq, fallback on error)
- [x] `/api/assistant` route handler

## Phase 11 — Performance
- [x] Landing stats cached with `unstable_cache` + cache tags
- [x] Catalog queries cached via `cachedCatalog` wrapper
- [x] Three.js lazy-loaded via `next/dynamic({ ssr: false })`
- [x] FPS cap (60fps delta timing), pixel ratio cap (1.5x), tab-hidden pause
- [x] DNS preconnect to Supabase
- [x] AVIF + WebP image formats, immutable static asset headers

## Phase 12 — Deployment
- [x] Supabase Storage bucket provisioned (images, public)
- [x] Schema pushed to hosted Supabase project
- [x] Vercel deployment
- [x] GitHub repository (public, auto-deploy on push)
- [x] `NEXT_PUBLIC_SITE_URL` set in Vercel
- [x] Supabase Auth redirect URLs configured

## Phase 13 — Quality
- [x] `npm run verify` passes (typecheck + lint + build)
- [x] 55 RLS assertions all pass
- [x] 29 smoke tests all pass
- [x] 20 flow tests all pass
- [x] Seller application flow tested (10 assertions)
- [x] `db:test` script portable (dynamic container discovery)
