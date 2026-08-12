-- ===========================================================================
-- CampusOrbit — RLS and trigger assertions
--
-- Run with:  npm run db:test
--
-- Each block impersonates a real user the way PostgREST does (role
-- `authenticated` plus a JWT claims payload) and asserts on actual behaviour.
-- Anything that should be refused is wrapped so a *successful* forbidden
-- action fails the run loudly.
-- ===========================================================================

\set ON_ERROR_STOP on
\pset pager off

create or replace function pg_temp.as_user(uid uuid)
returns void language plpgsql as $$
begin
  perform set_config('role', 'authenticated', true);
  perform set_config(
    'request.jwt.claims',
    json_build_object('sub', uid::text, 'role', 'authenticated')::text,
    true
  );
end $$;

create or replace function pg_temp.as_anon()
returns void language plpgsql as $$
begin
  perform set_config('role', 'anon', true);
  perform set_config('request.jwt.claims', json_build_object('role', 'anon')::text, true);
end $$;

/**
 * Drop back to the table owner to observe side effects. Needed because
 * notifications are deliberately readable only by their recipient, so no
 * end-user role can assert that *another* user was notified.
 */
create or replace function pg_temp.as_owner()
returns void language plpgsql as $$
begin
  perform set_config('role', 'postgres', true);
  perform set_config('request.jwt.claims', '', true);
end $$;

create or replace function pg_temp.check(label text, condition boolean)
returns void language plpgsql as $$
begin
  if condition then
    raise notice 'PASS  %', label;
  else
    raise exception 'FAIL  %', label;
  end if;
end $$;

/**
 * Passes when the statement is refused outright (no GRANT) or returns nothing
 * (filtered by RLS). Both are acceptable ways to deny a read; asserting on
 * only one of them makes the test brittle.
 */
create or replace function pg_temp.cannot_read(label text, stmt text)
returns void language plpgsql as $$
declare
  found_rows integer;
begin
  execute format('select count(*) from (%s) probe', stmt) into found_rows;
  if found_rows = 0 then
    raise notice 'PASS  % (no rows visible)', label;
  else
    raise exception 'FAIL  % — % row(s) leaked', label, found_rows;
  end if;
exception
  when insufficient_privilege then
    raise notice 'PASS  % (permission denied)', label;
end $$;

\echo ''
\echo '=== Students ==='

begin;
  select pg_temp.as_user('c0000000-0000-4000-8000-000000000001');

  select pg_temp.check(
    'student sees only approved/completed events',
    not exists (select 1 from public.events where status in ('pending', 'rejected'))
  );

  select pg_temp.check(
    'student sees own registrations only',
    (select count(distinct student_id) from public.event_registrations) = 1
  );

  select pg_temp.check(
    'student cannot read another student''s certifications',
    not exists (
      select 1 from public.student_certifications
      where student_id <> 'c0000000-0000-4000-8000-000000000001'
    )
  );

  select pg_temp.check(
    'student cannot read another student''s opportunity progress',
    not exists (
      select 1 from public.opportunity_progress
      where student_id <> 'c0000000-0000-4000-8000-000000000001'
    )
  );

  select pg_temp.check(
    'student sees only published opportunities',
    not exists (select 1 from public.opportunities where status <> 'published')
  );

  select pg_temp.check(
    'student sees own notifications only',
    (select count(distinct user_id) from public.notifications) <= 1
  );

  select pg_temp.check(
    'student cannot read other profiles wholesale',
    (select count(*) from public.profiles) < 10
  );
rollback;

\echo ''
\echo '=== Privilege escalation attempts ==='

-- A student must not be able to promote themselves to admin.
begin;
  select pg_temp.as_user('c0000000-0000-4000-8000-000000000001');
  do $$
  begin
    update public.profiles set role = 'admin'
    where id = 'c0000000-0000-4000-8000-000000000001';
    raise exception 'FAIL  student self-promotion to admin was allowed';
  exception
    when raise_exception then
      if sqlerrm like 'FAIL%' then raise; end if;
      raise notice 'PASS  student cannot self-promote to admin (%)', sqlerrm;
  end $$;
rollback;

-- A student must not be able to lift their own suspension.
begin;
  select pg_temp.as_user('c0000000-0000-4000-8000-000000000002');
  do $$
  begin
    update public.profiles set suspended = true
    where id = 'c0000000-0000-4000-8000-000000000002';
    raise exception 'FAIL  student changed own suspension flag';
  exception
    when raise_exception then
      if sqlerrm like 'FAIL%' then raise; end if;
      raise notice 'PASS  student cannot change suspension (%)', sqlerrm;
  end $$;
rollback;

-- A student must not be able to self-verify attendance into their portfolio.
begin;
  select pg_temp.as_user('c0000000-0000-4000-8000-000000000001');
  do $$
  begin
    update public.event_registrations set status = 'verified'
    where student_id = 'c0000000-0000-4000-8000-000000000001'
      and event_id = 'e0000000-0000-4000-8000-000000000004';
    raise exception 'FAIL  student self-verified attendance';
  exception
    when raise_exception then
      if sqlerrm like 'FAIL%' then raise; end if;
      raise notice 'PASS  student cannot self-verify attendance (%)', sqlerrm;
  end $$;
rollback;

-- Verified attendance is evidence and must not be deletable by the student.
begin;
  select pg_temp.as_user('c0000000-0000-4000-8000-000000000001');
  delete from public.event_registrations
  where student_id = 'c0000000-0000-4000-8000-000000000001' and status = 'verified';
  select pg_temp.check(
    'student cannot delete verified attendance',
    (select count(*) from public.event_registrations
     where student_id = 'c0000000-0000-4000-8000-000000000001' and status = 'verified') = 3
  );
rollback;

-- A student cannot register on someone else's behalf.
begin;
  select pg_temp.as_user('c0000000-0000-4000-8000-000000000001');
  do $$
  begin
    insert into public.event_registrations (event_id, student_id, status)
    values ('e0000000-0000-4000-8000-000000000005',
            'c0000000-0000-4000-8000-000000000002', 'registered');
    raise exception 'FAIL  student registered another student';
  exception
    when insufficient_privilege or check_violation then
      raise notice 'PASS  student cannot register another student';
    when raise_exception then
      if sqlerrm like 'FAIL%' then raise; end if;
      raise notice 'PASS  student cannot register another student (%)', sqlerrm;
  end $$;
rollback;

-- Only approved sellers may list. Benjamin has no seller application.
begin;
  select pg_temp.as_user('c0000000-0000-4000-8000-000000000001');
  do $$
  begin
    insert into public.marketplace_listings
      (seller_id, product_name, description, price, contact_value)
    values ('c0000000-0000-4000-8000-000000000001', 'Unapproved laptop',
            'Should be refused because there is no approved seller application.',
            100000, '+256700000000');
    raise exception 'FAIL  non-seller created a listing';
  exception
    when insufficient_privilege then
      raise notice 'PASS  non-approved seller cannot create a listing';
    when raise_exception then
      if sqlerrm like 'FAIL%' then raise; end if;
      raise notice 'PASS  non-approved seller cannot create a listing (%)', sqlerrm;
  end $$;
rollback;

\echo ''
\echo '=== Community leaders ==='

begin;
  select pg_temp.as_user('b0000000-0000-4000-8000-000000000002');

  select pg_temp.check(
    'leader sees own pending events',
    exists (select 1 from public.events
            where created_by = 'b0000000-0000-4000-8000-000000000002' and status = 'pending')
  );

  select pg_temp.check(
    'leader cannot see another leader''s pending event',
    not exists (select 1 from public.events
                where created_by <> 'b0000000-0000-4000-8000-000000000002' and status = 'pending')
  );

  select pg_temp.check(
    'leader sees registrations for own events',
    exists (select 1 from public.event_registrations r
            join public.events e on e.id = r.event_id
            where e.created_by = 'b0000000-0000-4000-8000-000000000002')
  );

  -- Participant identity comes from a display-only view, not from `profiles`,
  -- so a leader learns names without learning email addresses.
  select pg_temp.check(
    'leader sees participant names via the view',
    exists (select 1 from public.event_participants
            where student_id = 'c0000000-0000-4000-8000-000000000001')
  );
  select pg_temp.cannot_read(
    'leader cannot read a participant''s profile row',
    'select 1 from public.profiles where id = ''c0000000-0000-4000-8000-000000000001'''
  );
  select pg_temp.check(
    'participant view is scoped to own events',
    not exists (select 1 from public.event_participants
                where event_owner <> 'b0000000-0000-4000-8000-000000000002')
  );
rollback;

-- A leader must not be able to approve their own event.
begin;
  select pg_temp.as_user('b0000000-0000-4000-8000-000000000002');
  do $$
  begin
    update public.events set status = 'approved'
    where id = 'e0000000-0000-4000-8000-00000000000a';
    raise exception 'FAIL  leader self-approved an event';
  exception
    when raise_exception then
      if sqlerrm like 'FAIL%' then raise; end if;
      raise notice 'PASS  leader cannot self-approve (%)', sqlerrm;
  end $$;
rollback;

-- New submissions are forced to `pending` regardless of the payload.
begin;
  select pg_temp.as_user('b0000000-0000-4000-8000-000000000002');
  insert into public.events (title, description, date, start_time, location,
                             category, organizer, status, created_by)
  values ('Injected Pre-Approved Event',
          'A leader submitting this with status=approved must still land in the moderation queue.',
          current_date + 40, '10:00', 'MUBS', 'Cloud', 'Test', 'approved',
          'b0000000-0000-4000-8000-000000000002');
  select pg_temp.check(
    'leader submission is forced to pending',
    (select status from public.events where title = 'Injected Pre-Approved Event') = 'pending'
  );
rollback;

-- A leader may verify attendance, but only for their own event.
begin;
  select pg_temp.as_user('b0000000-0000-4000-8000-000000000003');
  update public.event_registrations set status = 'verified'
  where event_id = 'e0000000-0000-4000-8000-000000000002'
    and student_id = 'c0000000-0000-4000-8000-000000000003';
  select pg_temp.check(
    'leader verifies attendance for own event',
    (select status from public.event_registrations
     where event_id = 'e0000000-0000-4000-8000-000000000002'
       and student_id = 'c0000000-0000-4000-8000-000000000003') = 'verified'
  );
  select pg_temp.check(
    'verification records provenance',
    (select verified_by from public.event_registrations
     where event_id = 'e0000000-0000-4000-8000-000000000002'
       and student_id = 'c0000000-0000-4000-8000-000000000003')
    = 'b0000000-0000-4000-8000-000000000003'
  );
  -- The leader cannot read the student's inbox, which is itself the correct
  -- behaviour, so verify the side effect as the owner.
  select pg_temp.check(
    'leader cannot read the student''s notifications',
    not exists (select 1 from public.notifications
                where user_id = 'c0000000-0000-4000-8000-000000000003')
  );
  select pg_temp.as_owner();
  select pg_temp.check(
    'verification notifies the student',
    exists (select 1 from public.notifications
            where user_id = 'c0000000-0000-4000-8000-000000000003'
              and type = 'attendance_verified')
  );
  select pg_temp.check(
    'verification also flags a portfolio update',
    exists (select 1 from public.notifications
            where user_id = 'c0000000-0000-4000-8000-000000000003'
              and type = 'portfolio_updated')
  );
  select pg_temp.check(
    'newly verified attendance becomes portfolio evidence',
    exists (select 1 from public.portfolio_experience('c0000000-0000-4000-8000-000000000003')
            where title = 'MUBS Web3 Builders Hackathon')
  );
rollback;

-- A leader must not verify attendance for an event they do not own.
begin;
  select pg_temp.as_user('b0000000-0000-4000-8000-000000000003');
  -- The row is not even visible to this leader, so the UPDATE matches nothing
  -- rather than raising. Confirm the absence of any effect as the owner.
  update public.event_registrations set status = 'verified'
  where event_id = 'e0000000-0000-4000-8000-000000000003'
    and student_id = 'c0000000-0000-4000-8000-000000000004';

  select pg_temp.check(
    'another leader''s registration row is invisible',
    not exists (select 1 from public.event_registrations
                where event_id = 'e0000000-0000-4000-8000-000000000003'
                  and student_id = 'c0000000-0000-4000-8000-000000000004')
  );

  select pg_temp.as_owner();
  select pg_temp.check(
    'leader cannot verify another leader''s event',
    (select status from public.event_registrations
     where event_id = 'e0000000-0000-4000-8000-000000000003'
       and student_id = 'c0000000-0000-4000-8000-000000000004') = 'attended'
  );
rollback;

\echo ''
\echo '=== Admin ==='

begin;
  select pg_temp.as_user('a0000000-0000-4000-8000-000000000001');

  -- Counts use >= because the HTTP smoke test may have added signup rows.
  select pg_temp.check('admin sees every profile',
    (select count(*) from public.profiles) >= 10);
  select pg_temp.check('admin sees pending and rejected events',
    (select count(*) from public.events) >= 11
    and exists (select 1 from public.events where status = 'pending')
    and exists (select 1 from public.events where status = 'rejected'));
  select pg_temp.check('admin sees draft opportunities',
    exists (select 1 from public.opportunities where status = 'draft'));
  select pg_temp.check('admin analytics is callable',
    (public.platform_analytics() -> 'students')::int >= 6);

  update public.events set status = 'approved'
  where id = 'e0000000-0000-4000-8000-00000000000a';
  select pg_temp.check('admin approves an event',
    (select status from public.events where id = 'e0000000-0000-4000-8000-00000000000a') = 'approved');

  select pg_temp.as_owner();
  select pg_temp.check('approval stamps the reviewer',
    (select reviewed_by from public.events where id = 'e0000000-0000-4000-8000-00000000000a')
    = 'a0000000-0000-4000-8000-000000000001');
  select pg_temp.check('approval notifies the organiser',
    exists (select 1 from public.notifications
            where user_id = 'b0000000-0000-4000-8000-000000000002'
              and type = 'event_approved'));
rollback;

-- Rejections must carry a moderation note.
begin;
  select pg_temp.as_user('a0000000-0000-4000-8000-000000000001');
  do $$
  begin
    update public.events set status = 'rejected', rejection_note = null
    where id = 'e0000000-0000-4000-8000-000000000009';
    raise exception 'FAIL  rejection accepted without a note';
  exception
    when check_violation then
      raise notice 'PASS  rejection requires a moderation note';
    when raise_exception then
      if sqlerrm like 'FAIL%' then raise; end if;
      raise notice 'PASS  rejection requires a moderation note (%)', sqlerrm;
  end $$;
rollback;

-- Analytics must refuse non-admins.
begin;
  select pg_temp.as_user('c0000000-0000-4000-8000-000000000001');
  do $$
  begin
    perform public.platform_analytics();
    raise exception 'FAIL  student called platform_analytics';
  exception
    when raise_exception then
      if sqlerrm like 'FAIL%' then raise; end if;
      raise notice 'PASS  platform_analytics refuses non-admins (%)', sqlerrm;
  end $$;
rollback;

\echo ''
\echo '=== Anonymous visitors ==='

begin;
  select pg_temp.as_anon();

  select pg_temp.check('anon sees approved events',
    exists (select 1 from public.events));
  select pg_temp.check('anon sees no pending events',
    not exists (select 1 from public.events where status = 'pending'));
  select pg_temp.check('anon sees published opportunities only',
    not exists (select 1 from public.opportunities where status <> 'published'));
  select pg_temp.check('anon sees approved listings only',
    not exists (select 1 from public.marketplace_listings where status <> 'approved'));
  select pg_temp.cannot_read('anon cannot read profiles',
    'select 1 from public.profiles');
  select pg_temp.cannot_read('anon cannot read registrations',
    'select 1 from public.event_registrations');
  select pg_temp.cannot_read('anon cannot read notifications',
    'select 1 from public.notifications');
  select pg_temp.cannot_read('anon cannot read opportunity progress',
    'select 1 from public.opportunity_progress');
  select pg_temp.cannot_read('anon cannot read student certifications',
    'select 1 from public.student_certifications');
  select pg_temp.cannot_read('anon cannot read seller applications',
    'select 1 from public.seller_applications');
  select pg_temp.cannot_read('anon cannot read portfolio visibility',
    'select 1 from public.portfolio_visibility');

  -- Public portfolio is reachable by handle...
  select pg_temp.check('anon reads a published portfolio',
    (public.public_portfolio('benjamin-ssekandi') ->> 'private') = 'false');
  select pg_temp.check('published portfolio hides email by default',
    (public.public_portfolio('benjamin-ssekandi') -> 'profile' ->> 'email') is null);
  select pg_temp.check('published portfolio carries verified evidence',
    jsonb_array_length(public.public_portfolio('benjamin-ssekandi') -> 'experience') = 5);

  -- ...but a private one reveals nothing beyond the name.
  select pg_temp.check('private portfolio stays private',
    (public.public_portfolio('aisha-nakato') ->> 'private') = 'true');
  select pg_temp.check('private portfolio leaks no stats',
    (public.public_portfolio('aisha-nakato') -> 'stats') is null);
  select pg_temp.check('unknown handle returns null',
    public.public_portfolio('no-such-student') is null);
rollback;

\echo ''
\echo 'All RLS checks passed.'
