-- ===========================================================================
-- CampusOrbit — table privileges
--
-- Postgres checks GRANTs *before* RLS, so policies alone are not enough.
-- Rather than granting blanket access and leaning entirely on RLS, each role
-- gets only the verbs it could ever legitimately use. The two layers agree:
--
--   * `anon` may read exactly the four public catalogs and nothing else. It
--     has no write verb anywhere, which is what makes `is_trusted_server()`
--     safe as a trust signal.
--   * `authenticated` gets the verbs its policies reference; RLS then narrows
--     those to the specific rows.
--   * `notifications` grants no INSERT to anyone: rows are written only by
--     SECURITY DEFINER triggers.
-- ===========================================================================

grant usage on schema public to anon, authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Anonymous visitors: read-only, public catalogs only.
-- ---------------------------------------------------------------------------
grant select on public.events               to anon;
grant select on public.opportunities        to anon;
grant select on public.certifications       to anon;
grant select on public.marketplace_listings to anon;

-- ---------------------------------------------------------------------------
-- Signed-in users. RLS decides which rows; these are the permitted verbs.
-- ---------------------------------------------------------------------------
grant select, update, delete         on public.profiles               to authenticated;
grant select, insert, update, delete on public.events                 to authenticated;
grant select, insert, update, delete on public.event_registrations    to authenticated;
grant select, insert, update, delete on public.opportunities          to authenticated;
grant select, insert, update, delete on public.opportunity_progress   to authenticated;
grant select, insert, update, delete on public.certifications         to authenticated;
grant select, insert, update, delete on public.student_certifications to authenticated;
grant select, insert, update          on public.seller_applications    to authenticated;
grant select, insert, update, delete on public.marketplace_listings   to authenticated;
grant select, insert, update          on public.portfolio_visibility   to authenticated;
grant select,         update, delete on public.notifications          to authenticated;

-- ---------------------------------------------------------------------------
-- Service role: used by admin-only server actions, bypasses RLS by design.
-- ---------------------------------------------------------------------------
grant all on all tables in schema public to service_role;
grant all on all routines in schema public to service_role;
