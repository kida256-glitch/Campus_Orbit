# CampusOrbit — Performance

Measure before changing anything: `npm run bench -- http://localhost:3000 3`.

## The headline finding

**`next dev` was the problem, not the application.** Same code, same database:

| Mode | Warm avg | Worst |
|---|---|---|
| `npm run dev` | 2,400–7,500 ms | 16,387 ms |
| `npm run start` (production build) | 146–397 ms | 513 ms |

That is a 10–20× difference. Supabase itself answers in 2–29 ms, so the database
was never the bottleneck.

`next dev` compiles each route on demand and re-reads thousands of small module
files per navigation. On this machine that is unusually expensive — see
*Environment* below.

**If the app feels slow, run a production build:**

```bash
npm run start:prod      # build, then serve
```

Use `npm run dev` only while editing code.

## Application optimisations

Measured against a production build, before and after:

| Surface | Before | After |
|---|---|---|
| Anonymous pages | 165 ms | 146 ms |
| Student pages | 539 ms | ~400 ms |
| Admin pages | 510 ms | 246 ms |
| Production build | 6.7 min | 66 s |

### 1. Request-scoped memoization (largest win)

A single signed-in navigation performed **three `auth.getUser()` calls and three
`profiles` selects** — the middleware, the layout, and the page's `requireRole()`
each fetched independently.

`getProfile()` and the server Supabase client are now wrapped in React `cache()`,
so each runs once per request. Locally this removed ~80 ms of pure duplication.
Against hosted Supabase, where a round trip is 100 ms+, it removes far more —
this is the fix that matters most once deployed.

### 2. `getClaims()` instead of `getUser()` in middleware

Middleware runs on **every** request. `getUser()` asks the Auth server to
validate the token; `getClaims()` verifies the JWT itself, locally against a
cached JWKS when asymmetric signing keys are enabled. With symmetric keys it
falls back to a server call, so it is never less safe.

It answers only "is there a valid session". The role is still read from the
database, never from token metadata.

### 3. Public catalogs cached and shared

`listEvents`, `listOpportunities`, `listCertifications` and `listListings` depend
only on their filters, never on who is asking. They now run through
`unstable_cache` with a cookie-free `anon` client, so one result is shared by
every visitor.

Correctness is preserved by tag invalidation: approving, rejecting or editing an
event calls `revalidateTag(CACHE_TAGS.events)`, and the equivalent for
opportunities and listings. Moderation still takes effect immediately.

**Caching is disabled in development on purpose.** `npm run db:reset` and direct
SQL cannot fire `revalidateTag`, so a cached dev server would serve pre-reset
data for up to a minute. Predictable local behaviour is worth more than the
milliseconds.

### 4. Notifications streamed off the critical path

The notification bell issued two queries that every navigation waited for, for a
control most visitors never open. It now renders inside `<Suspense>` with a
same-size placeholder, so the page body no longer blocks on it and the header
does not shift when it arrives.

### 5. Parallelised page data

Several pages awaited sequentially — `searchParams`, then the profile, then the
catalog, then the viewer's own state. Independent reads now go out together.
`/discover` was the worst case at three sequential waves and up to seven queries;
it is now a single wave.

### 6. `optimizePackageImports`

`lucide-react` ships ~3,500 icons behind one entry point, so importing six pulled
the whole barrel into the module graph. Adding `lucide-react`, `recharts` and
`date-fns` to `experimental.optimizePackageImports` is the main reason the
production build fell from 6.7 min to 66 s.

## Environment

Two machine-level factors dominate dev-server responsiveness here, and neither is
fixable in application code.

**Small-file I/O is ~20× slower than a healthy SSD.** A 400 × 4 KB write/read/delete
cycle takes ~2 s even in `%TEMP%`, which is about 2.5 ms per file where a normal
SSD manages ~0.1 ms. That signature is real-time antivirus scanning every file
Next.js touches — and a dev rebuild touches thousands.

**The project lives in OneDrive**, which adds a further 1.6× on top: OneDrive
watches and uploads every file written under `Desktop\Projects`, and `.next` is
302 MB across 263 files that get rewritten constantly.

Both are worth fixing if you develop here regularly:

1. **Move the project out of OneDrive**, e.g. to `C:\dev\campusorbit`. Biggest and
   safest win.
2. **Exclude the build directories from Windows Defender.** In an
   *Administrator* PowerShell:

   ```powershell
   Add-MpPreference -ExclusionPath "C:\dev\campusorbit\.next"
   Add-MpPreference -ExclusionPath "C:\dev\campusorbit\node_modules"
   Add-MpPreference -ExclusionProcess "node.exe"
   ```

   Review these against your own security policy — excluding `node.exe` is a
   real reduction in coverage, so decide deliberately rather than by default.

Neither change was made for you: one moves your files, the other alters
antivirus settings.

## Turbopack

`npm run dev` uses `--turbopack`, with `npm run dev:webpack` as a fallback.

Honest result: **Turbopack did not clearly help on this machine.** Warm dev
requests measured 2,245–4,746 ms with Turbopack versus 2,384–3,008 ms with
webpack — within the noise, and its 95 s cold start was worse. Both are
dominated by file I/O rather than by the bundler.

It stays the default because it is the recommended path and wins on machines
without an I/O bottleneck. If dev feels worse for you, switch to
`npm run dev:webpack` and compare with `npm run bench`.

## What was not done

**Static generation of catalog pages.** `/events` and `/opportunities` call
`getProfile()` to overlay the viewer's registration state, which makes them
dynamic. Splitting each into a static shell plus a streamed personalised layer
would cut anonymous responses further, but they already answer in ~146 ms and the
added indirection is not yet justified.

**Materialised portfolio projection.** Portfolio aggregation runs per request.
At current data volumes it is a few milliseconds and indexed; a materialised view
refreshed on verification is the escape hatch if it ever matters.
