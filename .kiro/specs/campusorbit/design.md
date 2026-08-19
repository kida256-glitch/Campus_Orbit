# CampusOrbit — Design

## Architecture decisions

### Authorization lives in Postgres, not React

Every table is RLS deny-by-default. Frontend role checks exist only for UX
(routing). Deleting them would not change what any user can read or write.

Three cooperating layers:
1. `GRANT` — which SQL verbs may this role ever issue?
2. RLS policy — which rows?
3. Guard trigger — which state transitions?

Guard triggers are needed because `WITH CHECK` cannot see the previous row value.

### The portfolio is a projection, not a table

There is no `portfolio` table. The portfolio is computed at read time from:
- `event_registrations` where `status = 'verified'`
- `opportunity_progress` where `status = 'completed'`
- `student_certifications` where `status = 'completed'`
- `profiles.skills` (self-declared, shown as unverified)

SQL functions: `portfolio_skills()`, `portfolio_experience()`, `portfolio_stats()`, `public_portfolio()`.

### The attendance ladder

```
interested → registered → attended → verified
└── student's own claim ──┘   └── organiser's attestation ──┘
```

Only `verified` rows feed the portfolio. The `verified_by` and `verified_at`
columns have a CHECK constraint — a verified row cannot exist without them.

### CampusOrbit AI: RAG without a vector store

One student's corpus is small and fully structured. Scoped SQL retrieves more
accurately than similarity search and inherits RLS for free. The deterministic
reasoner has no generative step, so it cannot hallucinate.

### Public portfolios via SECURITY DEFINER function

`public_portfolio(handle text)` is a SQL function rather than a table policy
because the rule is "this row, but not this column, only if published, with
sections filtered". Row-level policies cannot express column-level exclusions.
This means `anon` needs no grant on `profiles` at all.

## Data model summary

```
profiles (1:1 with auth.users)
  └── events (created_by)
        └── event_registrations (event_id, student_id)
  └── opportunity_progress (student_id, opportunity_id)
        └── opportunities
  └── student_certifications (student_id)
        └── certifications (catalog)
  └── seller_applications (student_id)
        └── marketplace_listings (seller_id)
  └── portfolio_visibility (student_id, 1:1)
  └── notifications (user_id)
```

## Request lifecycle

1. `middleware.ts` → `getClaims()` to check session (no network call with asymmetric keys)
2. For role-scoped routes → one `profiles` SELECT to get role
3. Server Component → `requireRole()` (memoised with React `cache()`)
4. Data queries via `createClient()` (anon key + user JWT, RLS applies)
5. Mutations via Server Actions → `ActionState<T>` discriminated result
6. Actions call `revalidatePath` / `revalidateTag` on success
