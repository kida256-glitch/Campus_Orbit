-- ===========================================================================
-- CampusOrbit — identity provisioning and state-transition guards
--
-- Two responsibilities:
--   1. Mirror every new `auth.users` row into `profiles` (+ a private
--      portfolio_visibility row) so a profile always exists after signup.
--   2. Guard privileged state transitions with triggers. RLS decides *which
--      rows* you may touch; these triggers decide *which transitions* are
--      legal. `WITH CHECK` cannot compare against the previous row, so
--      escalation guards have to live in triggers.
-- ===========================================================================

-- ---------------------------------------------------------------------------
-- Role helpers.
--
-- SECURITY DEFINER on purpose: these are called from RLS policies on
-- `profiles` itself, so a normal query would recurse into the very policy
-- being evaluated. `search_path` is pinned to defeat search-path hijacking.
-- ---------------------------------------------------------------------------
create or replace function public.current_role()
returns public.user_role
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select role from public.profiles where id = auth.uid();
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select coalesce(
    (select role = 'admin' and not suspended
     from public.profiles where id = auth.uid()),
    false
  );
$$;

create or replace function public.is_active_role(target public.user_role)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select coalesce(
    (select role = target and not suspended
     from public.profiles where id = auth.uid()),
    false
  );
$$;

/** True when the caller created the given event. Used by leader-scoped policies. */
create or replace function public.owns_event(event uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from public.events
    where id = event and created_by = auth.uid()
  );
$$;

/**
 * True when there is no end user behind the statement — i.e. the `service_role`
 * key or a direct superuser connection (migrations, seeds, admin server
 * actions). Safe as a trust signal because anonymous HTTP callers also have a
 * null `auth.uid()` but are stopped earlier by RLS, which grants `anon` no
 * write policies anywhere.
 */
create or replace function public.is_trusted_server()
returns boolean
language sql
stable
as $$
  select auth.uid() is null;
$$;

/** True when the caller has an approved seller application. */
create or replace function public.is_approved_seller()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from public.seller_applications
    where student_id = auth.uid() and status = 'approved'
  );
$$;

/**
 * Profile visibility rule, kept in one place:
 * yourself, an admin, a leader who owns an event you registered for, or the
 * seller behind an approved marketplace listing.
 */
create or replace function public.can_view_profile(target uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select
    target = auth.uid()
    or public.is_admin()
    or exists (
      select 1
      from public.event_registrations r
      join public.events e on e.id = r.event_id
      where r.student_id = target and e.created_by = auth.uid()
    )
    or exists (
      select 1 from public.marketplace_listings l
      where l.seller_id = target and l.status = 'approved'
    );
$$;

-- ---------------------------------------------------------------------------
-- Notification helper (SECURITY DEFINER: triggers write to other users' rows)
-- ---------------------------------------------------------------------------
create or replace function public.notify(
  target uuid,
  kind public.notification_type,
  title text,
  body text default null,
  link text default null
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  insert into public.notifications (user_id, type, title, body, link)
  values (target, kind, title, body, link);
end;
$$;

-- ---------------------------------------------------------------------------
-- Signup: auth.users -> profiles
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  requested text := coalesce(new.raw_user_meta_data ->> 'role', 'student');
  resolved  public.user_role;
  base_name text;
  candidate text;
  suffix    integer := 0;
begin
  -- Admin is never self-assignable at signup, regardless of client payload.
  resolved := case
    when requested = 'community_leader' then 'community_leader'::public.user_role
    else 'student'::public.user_role
  end;

  base_name := regexp_replace(
    lower(coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1))),
    '[^a-z0-9]+', '-', 'g'
  );
  base_name := trim(both '-' from base_name);
  if char_length(base_name) < 2 then
    base_name := 'orbiter';
  end if;
  base_name := left(base_name, 32);

  candidate := base_name;
  while exists (select 1 from public.profiles where username = candidate) loop
    suffix := suffix + 1;
    candidate := left(base_name, 30) || '-' || suffix::text;
  end loop;

  insert into public.profiles (id, full_name, email, role, username, university)
  values (
    new.id,
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''), 'CampusOrbit Member'),
    new.email,
    resolved,
    candidate,
    coalesce(
      nullif(trim(new.raw_user_meta_data ->> 'university'), ''),
      ''
    )
  );

  -- Portfolios start private.
  insert into public.portfolio_visibility (student_id) values (new.id);

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Guard: profiles — only admins may change role / suspension
-- ---------------------------------------------------------------------------
create or replace function public.guard_profile_changes()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if not (public.is_admin() or public.is_trusted_server()) then
    if new.role is distinct from old.role then
      raise exception 'Only administrators can change a user role';
    end if;
    if new.suspended is distinct from old.suspended then
      raise exception 'Only administrators can suspend or restore an account';
    end if;
    -- Identity columns stay pinned to Supabase Auth.
    new.id := old.id;
    new.email := old.email;
  end if;

  if new.role is distinct from old.role then
    perform public.notify(
      new.id,
      'role_changed',
      'Your CampusOrbit role changed',
      format('Your account is now a %s account.', replace(new.role::text, '_', ' ')),
      '/profile'
    );
  end if;

  return new;
end;
$$;

create trigger profiles_guard
  before update on public.profiles
  for each row execute function public.guard_profile_changes();

-- ---------------------------------------------------------------------------
-- Guard: events — moderation is admin-only, and it always notifies
-- ---------------------------------------------------------------------------
create or replace function public.guard_event_moderation()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if new.status is distinct from old.status then
    -- Leaders may retire their own event as `completed`; approve/reject is
    -- reserved for admins so nobody can publish their own event.
    if new.status in ('approved', 'rejected') and not (public.is_admin() or public.is_trusted_server()) then
      raise exception 'Only administrators can approve or reject events';
    end if;

    if new.status in ('approved', 'rejected') then
      new.reviewed_by := auth.uid();
      new.reviewed_at := now();
    end if;

    if new.status = 'approved' then
      new.rejection_note := null;
      perform public.notify(
        new.created_by,
        'event_approved',
        'Event approved',
        format('"%s" is now live on CampusOrbit.', new.title),
        '/my-events'
      );
    elsif new.status = 'rejected' then
      perform public.notify(
        new.created_by,
        'event_rejected',
        'Event needs changes',
        coalesce(new.rejection_note, 'An administrator requested changes.'),
        '/my-events'
      );
    end if;
  end if;

  return new;
end;
$$;

create trigger events_guard
  before update on public.events
  for each row execute function public.guard_event_moderation();

/** Non-admin authors always start at `pending`, whatever the client sends. */
create or replace function public.guard_event_insert()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if not (public.is_admin() or public.is_trusted_server()) then
    new.status := 'pending';
    new.reviewed_by := null;
    new.reviewed_at := null;
    new.rejection_note := null;
  end if;
  return new;
end;
$$;

create trigger events_insert_guard
  before insert on public.events
  for each row execute function public.guard_event_insert();

-- ---------------------------------------------------------------------------
-- Guard: registrations — students claim, organisers verify
-- ---------------------------------------------------------------------------
create or replace function public.guard_registration_status()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  is_verifier boolean;
begin
  is_verifier := public.is_admin()
    or public.is_trusted_server()
    or public.owns_event(new.event_id);

  -- `attended` and `verified` are attestations, not self-service states.
  if tg_op = 'INSERT' and new.status in ('attended', 'verified') and not is_verifier then
    raise exception 'Attendance can only be recorded by the organiser or an administrator';
  end if;

  if tg_op = 'UPDATE' and new.status is distinct from old.status then
    if new.status in ('attended', 'verified') and not is_verifier then
      raise exception 'Attendance can only be verified by the organiser or an administrator';
    end if;
  end if;

  if new.status = 'verified' then
    if new.verified_by is null then
      new.verified_by := auth.uid();
    end if;
    if new.verified_at is null then
      new.verified_at := now();
    end if;

    if tg_op = 'INSERT' or old.status is distinct from 'verified' then
      perform public.notify(
        new.student_id,
        'attendance_verified',
        'Attendance verified',
        'Verified participation was added to your portfolio as evidence.',
        '/portfolio'
      );
      perform public.notify(
        new.student_id,
        'portfolio_updated',
        'Your portfolio grew',
        'A new verified experience now appears on your CampusOrbit portfolio.',
        '/portfolio'
      );
    end if;
  else
    new.verified_by := null;
    new.verified_at := null;
  end if;

  return new;
end;
$$;

create trigger event_registrations_guard
  before insert or update on public.event_registrations
  for each row execute function public.guard_registration_status();

-- ---------------------------------------------------------------------------
-- Portfolio-growth notifications for completed work
-- ---------------------------------------------------------------------------
create or replace function public.notify_progress_completed()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if new.status = 'completed' and (tg_op = 'INSERT' or old.status is distinct from 'completed') then
    perform public.notify(
      new.student_id,
      'portfolio_updated',
      'Opportunity completed',
      'Your completed opportunity is now portfolio evidence.',
      '/portfolio'
    );
  end if;
  return new;
end;
$$;

create trigger opportunity_progress_notify
  after insert or update on public.opportunity_progress
  for each row execute function public.notify_progress_completed();

create or replace function public.notify_certification_completed()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if new.status = 'completed' and (tg_op = 'INSERT' or old.status is distinct from 'completed') then
    perform public.notify(
      new.student_id,
      'portfolio_updated',
      format('%s certification added', new.name),
      'Your certification now appears on your CampusOrbit portfolio.',
      '/portfolio'
    );
  end if;
  return new;
end;
$$;

create trigger student_certifications_notify
  after insert or update on public.student_certifications
  for each row execute function public.notify_certification_completed();

-- ---------------------------------------------------------------------------
-- Marketplace moderation guards
-- ---------------------------------------------------------------------------
create or replace function public.guard_seller_application()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if tg_op = 'INSERT' and not (public.is_admin() or public.is_trusted_server()) then
    new.status := 'pending';
  end if;

  if tg_op = 'UPDATE' and new.status is distinct from old.status then
    if not (public.is_admin() or public.is_trusted_server()) then
      raise exception 'Only administrators can review seller applications';
    end if;
    new.reviewed_by := auth.uid();
    new.reviewed_at := now();

    if new.status = 'approved' then
      perform public.notify(
        new.student_id,
        'seller_approved',
        'You are a verified seller',
        'You can now publish listings on the CampusOrbit marketplace.',
        '/marketplace'
      );
    elsif new.status = 'rejected' then
      perform public.notify(
        new.student_id,
        'seller_rejected',
        'Seller application declined',
        coalesce(new.review_note, 'An administrator declined your application.'),
        '/marketplace'
      );
    end if;
  end if;

  return new;
end;
$$;

create trigger seller_applications_guard
  before insert or update on public.seller_applications
  for each row execute function public.guard_seller_application();

create or replace function public.guard_listing_moderation()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if tg_op = 'INSERT' and not (public.is_admin() or public.is_trusted_server()) then
    new.status := 'pending';
  end if;

  if tg_op = 'UPDATE' and new.status is distinct from old.status then
    if not (public.is_admin() or public.is_trusted_server()) then
      raise exception 'Only administrators can moderate listings';
    end if;

    if new.status = 'approved' then
      perform public.notify(
        new.seller_id,
        'listing_approved',
        'Listing approved',
        format('"%s" is now visible in the marketplace.', new.product_name),
        '/marketplace'
      );
    elsif new.status = 'rejected' then
      perform public.notify(
        new.seller_id,
        'listing_removed',
        'Listing removed',
        coalesce(new.review_note, 'An administrator removed this listing.'),
        '/marketplace'
      );
    end if;
  end if;

  return new;
end;
$$;

create trigger marketplace_listings_guard
  before insert or update on public.marketplace_listings
  for each row execute function public.guard_listing_moderation();
