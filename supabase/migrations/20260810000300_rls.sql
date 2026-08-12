-- ===========================================================================
-- CampusOrbit — Row Level Security
--
-- Authorization is enforced here, not in the frontend. Every table below is
-- deny-by-default; each policy grants the narrowest useful access.
--
-- Anonymous visitors can read only what is genuinely public: approved events,
-- published opportunities, the certification catalog and approved listings.
-- Public portfolios are served through a SECURITY DEFINER function instead of
-- a table policy so that emails are never exposed by a row-level rule.
-- ===========================================================================

alter table public.profiles              enable row level security;
alter table public.events                enable row level security;
alter table public.event_registrations   enable row level security;
alter table public.opportunities         enable row level security;
alter table public.opportunity_progress  enable row level security;
alter table public.certifications        enable row level security;
alter table public.student_certifications enable row level security;
alter table public.seller_applications   enable row level security;
alter table public.marketplace_listings  enable row level security;
alter table public.portfolio_visibility  enable row level security;
alter table public.notifications         enable row level security;

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------
create policy profiles_select on public.profiles
  for select to authenticated
  using (public.can_view_profile(id));

create policy profiles_update_own on public.profiles
  for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

create policy profiles_admin_update on public.profiles
  for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Inserts happen through the auth trigger; deletes cascade from auth.users.
create policy profiles_admin_delete on public.profiles
  for delete to authenticated
  using (public.is_admin());

-- ---------------------------------------------------------------------------
-- events
-- ---------------------------------------------------------------------------
-- Public discovery: only events an admin has approved (or that have since
-- completed) are readable by anonymous visitors.
create policy events_select_public on public.events
  for select to anon, authenticated
  using (status in ('approved', 'completed'));

create policy events_select_own on public.events
  for select to authenticated
  using (created_by = auth.uid() or public.is_admin());

create policy events_insert on public.events
  for insert to authenticated
  with check (
    created_by = auth.uid()
    and (public.is_active_role('community_leader') or public.is_admin())
  );

-- Leaders may revise their own event while it is pending or after a rejection.
-- The status-transition guard trigger stops them from self-approving.
create policy events_update_own on public.events
  for update to authenticated
  using (created_by = auth.uid() and status in ('pending', 'rejected', 'approved'))
  with check (created_by = auth.uid());

create policy events_admin_update on public.events
  for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy events_delete_own on public.events
  for delete to authenticated
  using ((created_by = auth.uid() and status = 'pending') or public.is_admin());

-- ---------------------------------------------------------------------------
-- event_registrations
-- ---------------------------------------------------------------------------
create policy registrations_select on public.event_registrations
  for select to authenticated
  using (
    student_id = auth.uid()
    or public.is_admin()
    or public.owns_event(event_id)
  );

-- A student may only register themselves, and only for a live event.
create policy registrations_insert_own on public.event_registrations
  for insert to authenticated
  with check (
    student_id = auth.uid()
    and public.is_active_role('student')
    and exists (
      select 1 from public.events e
      where e.id = event_id and e.status in ('approved', 'completed')
    )
  );

create policy registrations_update_own on public.event_registrations
  for update to authenticated
  using (student_id = auth.uid())
  with check (student_id = auth.uid());

-- Organisers and admins verify attendance for their own events.
create policy registrations_verify on public.event_registrations
  for update to authenticated
  using (public.is_admin() or public.owns_event(event_id))
  with check (public.is_admin() or public.owns_event(event_id));

create policy registrations_insert_verifier on public.event_registrations
  for insert to authenticated
  with check (public.is_admin() or public.owns_event(event_id));

create policy registrations_delete_own on public.event_registrations
  for delete to authenticated
  using (
    -- Verified attendance is evidence; a student cannot delete it away.
    (student_id = auth.uid() and status in ('interested', 'registered'))
    or public.is_admin()
  );

-- ---------------------------------------------------------------------------
-- opportunities  (curated by admins)
-- ---------------------------------------------------------------------------
create policy opportunities_select_published on public.opportunities
  for select to anon, authenticated
  using (status = 'published');

create policy opportunities_select_admin on public.opportunities
  for select to authenticated
  using (public.is_admin());

create policy opportunities_admin_write on public.opportunities
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- opportunity_progress  (private to the student)
-- ---------------------------------------------------------------------------
create policy progress_select on public.opportunity_progress
  for select to authenticated
  using (student_id = auth.uid() or public.is_admin());

create policy progress_insert_own on public.opportunity_progress
  for insert to authenticated
  with check (student_id = auth.uid() and public.is_active_role('student'));

create policy progress_update_own on public.opportunity_progress
  for update to authenticated
  using (student_id = auth.uid())
  with check (student_id = auth.uid());

create policy progress_delete_own on public.opportunity_progress
  for delete to authenticated
  using (student_id = auth.uid() or public.is_admin());

-- ---------------------------------------------------------------------------
-- certifications  (shared catalog)
-- ---------------------------------------------------------------------------
create policy certifications_select on public.certifications
  for select to anon, authenticated
  using (true);

create policy certifications_admin_write on public.certifications
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- student_certifications
-- ---------------------------------------------------------------------------
create policy student_certifications_select on public.student_certifications
  for select to authenticated
  using (student_id = auth.uid() or public.is_admin());

create policy student_certifications_insert_own on public.student_certifications
  for insert to authenticated
  with check (student_id = auth.uid() and public.is_active_role('student'));

create policy student_certifications_update_own on public.student_certifications
  for update to authenticated
  using (student_id = auth.uid())
  with check (student_id = auth.uid());

create policy student_certifications_delete_own on public.student_certifications
  for delete to authenticated
  using (student_id = auth.uid() or public.is_admin());

-- ---------------------------------------------------------------------------
-- seller_applications
-- ---------------------------------------------------------------------------
create policy seller_applications_select on public.seller_applications
  for select to authenticated
  using (student_id = auth.uid() or public.is_admin());

create policy seller_applications_insert_own on public.seller_applications
  for insert to authenticated
  with check (student_id = auth.uid());

-- Applicants may edit their own pending application; admins review it.
create policy seller_applications_update_own on public.seller_applications
  for update to authenticated
  using (student_id = auth.uid() and status = 'pending')
  with check (student_id = auth.uid());

create policy seller_applications_admin_update on public.seller_applications
  for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- marketplace_listings
-- ---------------------------------------------------------------------------
create policy listings_select_approved on public.marketplace_listings
  for select to anon, authenticated
  using (status = 'approved');

create policy listings_select_own on public.marketplace_listings
  for select to authenticated
  using (seller_id = auth.uid() or public.is_admin());

-- Only an approved seller can create a listing.
create policy listings_insert_seller on public.marketplace_listings
  for insert to authenticated
  with check (seller_id = auth.uid() and public.is_approved_seller());

create policy listings_update_own on public.marketplace_listings
  for update to authenticated
  using (seller_id = auth.uid() and status in ('pending', 'approved'))
  with check (seller_id = auth.uid());

create policy listings_admin_write on public.marketplace_listings
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy listings_delete_own on public.marketplace_listings
  for delete to authenticated
  using (seller_id = auth.uid() or public.is_admin());

-- ---------------------------------------------------------------------------
-- portfolio_visibility
-- ---------------------------------------------------------------------------
create policy portfolio_visibility_select on public.portfolio_visibility
  for select to authenticated
  using (student_id = auth.uid() or public.is_admin());

create policy portfolio_visibility_insert_own on public.portfolio_visibility
  for insert to authenticated
  with check (student_id = auth.uid());

create policy portfolio_visibility_update_own on public.portfolio_visibility
  for update to authenticated
  using (student_id = auth.uid())
  with check (student_id = auth.uid());

-- ---------------------------------------------------------------------------
-- notifications
-- ---------------------------------------------------------------------------
-- Rows are written by SECURITY DEFINER triggers, never by the client, so there
-- is deliberately no INSERT policy here.
create policy notifications_select_own on public.notifications
  for select to authenticated
  using (user_id = auth.uid());

create policy notifications_update_own on public.notifications
  for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy notifications_delete_own on public.notifications
  for delete to authenticated
  using (user_id = auth.uid());
