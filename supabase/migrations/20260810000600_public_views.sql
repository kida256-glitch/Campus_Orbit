-- ===========================================================================
-- CampusOrbit — narrowed profile exposure
--
-- Problem with the original `can_view_profile`: to let a leader see who
-- registered, and to show a seller's name on a listing, it granted SELECT on
-- whole `profiles` rows — including `email`. That contradicts the rule that
-- contact details are opt-in (see `portfolio_visibility.show_contact`).
--
-- Fix: `profiles` becomes strictly self-or-admin, and the two legitimate
-- cross-user reads go through views that project only display fields. The
-- views are SECURITY DEFINER (security_invoker = false), so they run with the
-- owner's privileges and carry their own access predicate.
-- ===========================================================================

create or replace function public.can_view_profile(target uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select target = auth.uid() or public.is_admin();
$$;

-- ---------------------------------------------------------------------------
-- Participants for events you organise
--
-- Name and avatar only — enough to check someone in, nothing more. The
-- predicate restricts rows to the caller's own events (or any event, for
-- admins), replacing what the old profiles policy allowed.
-- ---------------------------------------------------------------------------
create view public.event_participants
with (security_invoker = false) as
select
  r.id,
  r.event_id,
  r.student_id,
  r.status,
  r.verified_at,
  r.verified_by,
  r.created_at,
  p.full_name  as student_name,
  p.username   as student_username,
  p.avatar_url as student_avatar,
  e.title      as event_title,
  e.date       as event_date,
  e.status     as event_status,
  e.created_by as event_owner
from public.event_registrations r
join public.profiles p on p.id = r.student_id
join public.events   e on e.id = r.event_id
where e.created_by = auth.uid() or public.is_admin();

comment on view public.event_participants is
  'Display-only participant list for an organiser''s own events. Excludes email.';

grant select on public.event_participants to authenticated;

-- ---------------------------------------------------------------------------
-- Marketplace feed
--
-- Sellers publish a contact method deliberately (`contact_value`); their
-- account email is not part of that bargain, so it is absent here.
-- ---------------------------------------------------------------------------
create view public.marketplace_public_listings
with (security_invoker = false) as
select
  l.id,
  l.product_name,
  l.description,
  l.price,
  l.currency,
  l.condition,
  l.category,
  l.images,
  l.contact_method,
  l.contact_value,
  l.created_at,
  l.seller_id,
  p.full_name  as seller_name,
  p.username   as seller_username,
  p.avatar_url as seller_avatar,
  s.business_name as seller_business
from public.marketplace_listings l
join public.profiles p on p.id = l.seller_id
left join public.seller_applications s
  on s.student_id = l.seller_id and s.status = 'approved'
where l.status = 'approved';

comment on view public.marketplace_public_listings is
  'Approved listings with the seller''s display name. Excludes email.';

grant select on public.marketplace_public_listings to anon, authenticated;
