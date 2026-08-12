-- ===========================================================================
-- CampusOrbit — the portfolio engine
--
-- A portfolio is never authored. It is a projection over evidence the student
-- already produced:
--
--   verified event attendance  +  completed opportunities
--   +  completed certifications  +  self-declared profile skills
--
-- Only `verified` registrations and `completed` records qualify. Everything is
-- derived at read time, so a portfolio can never drift out of sync with the
-- underlying activity.
-- ===========================================================================

-- ---------------------------------------------------------------------------
-- Skill derivation
--
-- Each event category implies a small set of skills; certifications and
-- opportunities carry their own tags. Evidence count drives the proficiency
-- bar in the UI, so a skill backed by five activities outranks a self-claim.
-- ---------------------------------------------------------------------------
create or replace function public.category_skills(cat public.event_category)
returns text[]
language sql
immutable
as $$
  select case cat
    when 'AI' then array['Machine Learning', 'Python', 'Deep Learning']
    when 'Web3' then array['Solidity', 'Smart Contracts', 'Blockchain']
    when 'Cloud' then array['AWS', 'Cloud Computing', 'Docker']
    when 'Software Development' then array['JavaScript', 'Git', 'React']
    when 'Data' then array['SQL', 'Data Visualisation', 'Python']
    when 'Cybersecurity' then array['Networking', 'Penetration Testing', 'Linux']
    when 'Design' then array['Figma', 'UI/UX Design']
    when 'Entrepreneurship' then array['Project Management', 'Public Speaking']
    when 'Career' then array['Technical Writing', 'Public Speaking']
    else array['Community Building']
  end;
$$;

create or replace function public.portfolio_skills(target uuid)
returns table (
  skill          text,
  evidence_count integer,
  verified_count integer,
  sources        text[]
)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  -- CTE columns are deliberately prefixed (`ev_`) so they can never be confused
  -- with this function's RETURNS TABLE output names.
  with evidence as (
    -- Verified event attendance
    select unnest(public.category_skills(e.category)) as ev_skill,
           'event'::text as ev_source,
           true as ev_verified
    from public.event_registrations r
    join public.events e on e.id = r.event_id
    where r.student_id = target and r.status = 'verified'

    union all

    -- Completed certifications
    select unnest(sc.skills), 'certification'::text, true
    from public.student_certifications sc
    where sc.student_id = target
      and sc.status = 'completed'
      and cardinality(sc.skills) > 0

    union all

    -- Completed opportunities
    select unnest(o.skill_tags), 'opportunity'::text, true
    from public.opportunity_progress p
    join public.opportunities o on o.id = p.opportunity_id
    where p.student_id = target
      and p.status = 'completed'
      and cardinality(o.skill_tags) > 0

    union all

    -- Self-declared profile skills carry no verification weight on their own.
    select unnest(pr.skills), 'profile'::text, false
    from public.profiles pr
    where pr.id = target
  )
  select
    ev.ev_skill,
    count(*)::integer,
    count(*) filter (where ev.ev_verified)::integer,
    array_agg(distinct ev.ev_source order by ev.ev_source)
  from evidence ev
  where coalesce(trim(ev.ev_skill), '') <> ''
  group by ev.ev_skill
  order by count(*) filter (where ev.ev_verified) desc, count(*) desc, ev.ev_skill;
$$;

-- ---------------------------------------------------------------------------
-- Verified experience timeline
-- ---------------------------------------------------------------------------
create or replace function public.portfolio_experience(target uuid)
returns table (
  kind         text,
  title        text,
  subtitle     text,
  category     text,
  occurred_on  date,
  verified     boolean,
  reference_id uuid
)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  -- Aliases matter: in a UNION, ORDER BY can only reference the output names
  -- established by the first branch.
  select 'event'::text  as kind,
         e.title        as title,
         e.organizer    as subtitle,
         e.category::text as category,
         e.date         as occurred_on,
         true           as verified,
         e.id           as reference_id
  from public.event_registrations r
  join public.events e on e.id = r.event_id
  where r.student_id = target and r.status = 'verified'

  union all

  select 'opportunity'::text,
         o.title,
         o.organization,
         o.type::text,
         p.completed_at::date,
         true,
         o.id
  from public.opportunity_progress p
  join public.opportunities o on o.id = p.opportunity_id
  where p.student_id = target and p.status = 'completed'

  -- Ordinal, not a name: avoids clashing with the output parameter.
  order by 5 desc nulls last;
$$;

-- ---------------------------------------------------------------------------
-- Achievement counters
-- ---------------------------------------------------------------------------
create or replace function public.portfolio_stats(target uuid)
returns jsonb
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select jsonb_build_object(
    'verified_events', (
      select count(*) from public.event_registrations r
      where r.student_id = target and r.status = 'verified'
    ),
    'events_registered', (
      select count(*) from public.event_registrations r
      where r.student_id = target and r.status in ('registered', 'attended', 'verified')
    ),
    'certifications_completed', (
      select count(*) from public.student_certifications
      where student_id = target and status = 'completed'
    ),
    'certifications_in_progress', (
      select count(*) from public.student_certifications
      where student_id = target and status = 'in_progress'
    ),
    'opportunities_completed', (
      select count(*) from public.opportunity_progress
      where student_id = target and status = 'completed'
    ),
    'opportunities_in_progress', (
      select count(*) from public.opportunity_progress
      where student_id = target and status = 'in_progress'
    ),
    'opportunities_saved', (
      select count(*) from public.opportunity_progress
      where student_id = target and status = 'saved'
    ),
    'hackathons', (
      select count(*) from (
        select 1
        from public.event_registrations r
        join public.events e on e.id = r.event_id
        where r.student_id = target and r.status = 'verified'
          and (e.title ilike '%hackathon%' or e.title ilike '%hack %')
        union all
        select 1
        from public.opportunity_progress p
        join public.opportunities o on o.id = p.opportunity_id
        where p.student_id = target and p.status = 'completed'
          and o.type in ('Hackathon', 'Competition')
      ) hack
    ),
    'workshops', (
      select count(*)
      from public.event_registrations r
      join public.events e on e.id = r.event_id
      where r.student_id = target and r.status = 'verified'
        and (e.title ilike '%workshop%' or e.title ilike '%bootcamp%' or e.title ilike '%masterclass%')
    ),
    'community_activities', (
      select count(*)
      from public.event_registrations r
      join public.events e on e.id = r.event_id
      where r.student_id = target and r.status = 'verified'
        and e.category in ('Career', 'Entrepreneurship', 'Other')
    ),
    'skills', (
      select count(*) from public.portfolio_skills(target) where verified_count > 0
    ),
    'top_categories', coalesce((
      select jsonb_agg(t)
      from (
        select e.category::text as category, count(*)::int as count
        from public.event_registrations r
        join public.events e on e.id = r.event_id
        where r.student_id = target and r.status = 'verified'
        group by e.category
        order by count(*) desc
        limit 4
      ) t
    ), '[]'::jsonb)
  );
$$;

-- ---------------------------------------------------------------------------
-- Profile completion (drives the dashboard progress bar)
-- ---------------------------------------------------------------------------
create or replace function public.profile_completion(target uuid)
returns integer
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select coalesce((
    select least(100, (
        -- Baseline identity, always present after signup.
        20
      + case when coalesce(trim(p.bio), '') <> '' then 20 else 0 end
      + case when p.avatar_url is not null then 10 else 0 end
      + case when cardinality(p.interests) >= 3 then 20
             when cardinality(p.interests) > 0 then 10 else 0 end
      + case when cardinality(p.skills) >= 3 then 15
             when cardinality(p.skills) > 0 then 8 else 0 end
      + case when p.links <> '{}'::jsonb then 5 else 0 end
      + case when exists (
              select 1 from public.event_registrations r
              where r.student_id = target
            ) then 5 else 0 end
      + case when exists (
              select 1 from public.portfolio_visibility v
              where v.student_id = target and v.is_public
            ) then 5 else 0 end
    ))
    from public.profiles p
    where p.id = target
  ), 0);
$$;

-- ---------------------------------------------------------------------------
-- Public portfolio
--
-- Deliberately a function rather than a table policy: it resolves the handle,
-- enforces the student's own visibility toggles, and strips contact details
-- unless they were explicitly shared. Anonymous callers can therefore read a
-- shared portfolio without `profiles` ever being exposed to `anon`.
-- ---------------------------------------------------------------------------
create or replace function public.public_portfolio(handle text)
returns jsonb
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  p   public.profiles;
  vis public.portfolio_visibility;
begin
  select * into p from public.profiles
  where username = lower(handle) and not suspended;

  if p.id is null then
    return null;
  end if;

  select * into vis from public.portfolio_visibility where student_id = p.id;

  -- Private unless the student opted in. Owners and admins always get through.
  if not coalesce(vis.is_public, false)
     and p.id is distinct from auth.uid()
     and not public.is_admin() then
    return jsonb_build_object('private', true, 'full_name', p.full_name);
  end if;

  return jsonb_build_object(
    'private', false,
    'is_public', coalesce(vis.is_public, false),
    'profile', jsonb_build_object(
      'id', p.id,
      'full_name', p.full_name,
      'username', p.username,
      'avatar_url', p.avatar_url,
      'bio', p.bio,
      'university', p.university,
      'links', p.links,
      -- Contact details are opt-in, separately from publishing the portfolio.
      'email', case when coalesce(vis.show_contact, false) then p.email::text else null end
    ),
    'stats', public.portfolio_stats(p.id),
    'skills', coalesce((
      select jsonb_agg(jsonb_build_object(
               'skill', s.skill,
               'evidence_count', s.evidence_count,
               'verified_count', s.verified_count,
               'sources', s.sources
             ))
      from public.portfolio_skills(p.id) s
    ), '[]'::jsonb),
    'experience', case when coalesce(vis.show_events, true) or coalesce(vis.show_opportunities, true) then
      coalesce((
        select jsonb_agg(jsonb_build_object(
                 'kind', x.kind,
                 'title', x.title,
                 'subtitle', x.subtitle,
                 'category', x.category,
                 'occurred_on', x.occurred_on,
                 'verified', x.verified
               ))
        from public.portfolio_experience(p.id) x
        where (x.kind = 'event' and coalesce(vis.show_events, true))
           or (x.kind = 'opportunity' and coalesce(vis.show_opportunities, true))
      ), '[]'::jsonb)
    else '[]'::jsonb end,
    'certifications', case when coalesce(vis.show_certifications, true) then
      coalesce((
        select jsonb_agg(jsonb_build_object(
                 'name', sc.name,
                 'provider', sc.provider,
                 'skills', sc.skills,
                 'completion_date', sc.completion_date,
                 'credential_url', sc.credential_url
               ) order by sc.completion_date desc)
        from public.student_certifications sc
        where sc.student_id = p.id and sc.status = 'completed'
      ), '[]'::jsonb)
    else '[]'::jsonb end
  );
end;
$$;

grant execute on function public.public_portfolio(text) to anon, authenticated;
grant execute on function public.portfolio_skills(uuid) to authenticated;
grant execute on function public.portfolio_experience(uuid) to authenticated;
grant execute on function public.portfolio_stats(uuid) to authenticated;
grant execute on function public.profile_completion(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Personalised opportunity recommendations
--
-- Scores published opportunities against the student's interests, declared
-- skills and demonstrated (verified) skills. Deadline proximity is a mild
-- tiebreak so the feed stays actionable.
-- ---------------------------------------------------------------------------
create or replace function public.recommended_opportunities(target uuid, max_rows integer default 6)
returns table (
  id           uuid,
  title        text,
  organization text,
  type         public.opportunity_type,
  deadline     date,
  skill_tags   text[],
  image        text,
  score        integer,
  matched      text[]
)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  with signals as (
    select
      coalesce((select interests from public.profiles where id = target), '{}') as interests,
      coalesce((select skills from public.profiles where id = target), '{}') as skills,
      coalesce((
        select array_agg(s.skill) from public.portfolio_skills(target) s where s.verified_count > 0
      ), '{}') as demonstrated
  )
  select
    o.id,
    o.title,
    o.organization,
    o.type,
    o.deadline,
    o.skill_tags,
    o.image,
    (
      -- Demonstrated skills are the strongest signal, then declared skills,
      -- then stated interests.
      3 * cardinality(array(select unnest(o.skill_tags) intersect select unnest(s.demonstrated)))
      + 2 * cardinality(array(select unnest(o.skill_tags) intersect select unnest(s.skills)))
      + 2 * cardinality(array(select unnest(o.skill_tags) intersect select unnest(s.interests)))
      + case
          when o.deadline is null then 0
          when o.deadline < current_date then -5
          when o.deadline <= current_date + 21 then 1
          else 0
        end
    )::integer as score,
    array(
      select distinct tag from unnest(o.skill_tags) tag
      where tag = any(s.interests) or tag = any(s.skills) or tag = any(s.demonstrated)
    ) as matched
  from public.opportunities o
  cross join signals s
  where o.status = 'published'
    and (o.deadline is null or o.deadline >= current_date)
    and not exists (
      select 1 from public.opportunity_progress p
      where p.opportunity_id = o.id and p.student_id = target and p.status = 'completed'
    )
  -- Position 8 is `score`; referencing it by name would be ambiguous against
  -- the output parameter of the same name.
  order by 8 desc, o.deadline asc nulls last, o.created_at desc
  limit greatest(1, max_rows);
$$;

grant execute on function public.recommended_opportunities(uuid, integer) to authenticated;

-- ---------------------------------------------------------------------------
-- Admin analytics, computed in one round trip
-- ---------------------------------------------------------------------------
create or replace function public.platform_analytics()
returns jsonb
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
begin
  if not public.is_admin() then
    raise exception 'Administrator access required';
  end if;

  return jsonb_build_object(
    'students', (select count(*) from public.profiles where role = 'student'),
    'community_leaders', (select count(*) from public.profiles where role = 'community_leader'),
    'admins', (select count(*) from public.profiles where role = 'admin'),
    'suspended', (select count(*) from public.profiles where suspended),
    'events_total', (select count(*) from public.events),
    'events_pending', (select count(*) from public.events where status = 'pending'),
    'events_approved', (select count(*) from public.events where status = 'approved'),
    'events_rejected', (select count(*) from public.events where status = 'rejected'),
    'events_completed', (select count(*) from public.events where status = 'completed'),
    'registrations', (select count(*) from public.event_registrations),
    'verified_attendance', (select count(*) from public.event_registrations where status = 'verified'),
    'opportunities', (select count(*) from public.opportunities where status = 'published'),
    'opportunities_completed', (select count(*) from public.opportunity_progress where status = 'completed'),
    'certifications_completed', (select count(*) from public.student_certifications where status = 'completed'),
    'listings', (select count(*) from public.marketplace_listings where status = 'approved'),
    'listings_pending', (select count(*) from public.marketplace_listings where status = 'pending'),
    'sellers_pending', (select count(*) from public.seller_applications where status = 'pending'),
    'public_portfolios', (select count(*) from public.portfolio_visibility where is_public),
    'events_by_category', coalesce((
      select jsonb_agg(t) from (
        select category::text as category, count(*)::int as count
        from public.events where status in ('approved', 'completed')
        group by category order by count(*) desc
      ) t
    ), '[]'::jsonb),
    'registrations_by_status', coalesce((
      select jsonb_agg(t) from (
        select status::text as status, count(*)::int as count
        from public.event_registrations group by status
      ) t
    ), '[]'::jsonb),
    'signups_by_week', coalesce((
      select jsonb_agg(t) from (
        select to_char(date_trunc('week', created_at), 'YYYY-MM-DD') as week,
               count(*)::int as count
        from public.profiles
        where created_at >= now() - interval '8 weeks'
        group by 1 order by 1
      ) t
    ), '[]'::jsonb)
  );
end;
$$;

grant execute on function public.platform_analytics() to authenticated;
