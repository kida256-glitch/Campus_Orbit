-- ===========================================================================
-- CampusOrbit — initial schema
--
-- Design notes:
--   * Every table uses a UUID primary key. `profiles.id` is a 1:1 mirror of
--     `auth.users.id` so Supabase Auth remains the single source of identity.
--   * Authorization lives in the database (see the RLS migration). The
--     frontend never decides what a role may do; it only renders what the
--     database returns.
--   * The attendance ladder (interested -> registered -> attended -> verified)
--     is modelled as an enum so that only `verified` can feed the portfolio.
-- ===========================================================================

create extension if not exists "pgcrypto";
create extension if not exists "citext";

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
create type public.user_role as enum ('student', 'community_leader', 'admin');

create type public.event_category as enum (
  'AI', 'Web3', 'Cloud', 'Software Development', 'Data',
  'Cybersecurity', 'Design', 'Entrepreneurship', 'Career', 'Other'
);

create type public.event_status as enum (
  'pending', 'approved', 'rejected', 'completed'
);

create type public.registration_status as enum (
  'interested', 'registered', 'attended', 'verified'
);

create type public.opportunity_type as enum (
  'Internship', 'Fellowship', 'Hackathon', 'Scholarship',
  'Certification', 'Competition', 'Grant', 'Course'
);

create type public.opportunity_status as enum ('draft', 'published', 'archived');

create type public.progress_status as enum ('saved', 'in_progress', 'completed');

create type public.certification_status as enum ('in_progress', 'completed');

create type public.marketplace_category as enum (
  'Laptops', 'Phones', 'Accessories', 'Networking Equipment', 'Software', 'Other'
);

create type public.listing_condition as enum ('new', 'like_new', 'good', 'fair');

create type public.moderation_status as enum ('pending', 'approved', 'rejected');

create type public.contact_method as enum ('whatsapp', 'phone', 'email');

create type public.notification_type as enum (
  'event_approved', 'event_rejected', 'event_reminder', 'attendance_verified',
  'opportunity_deadline', 'portfolio_updated', 'seller_approved',
  'seller_rejected', 'listing_approved', 'listing_removed', 'role_changed'
);

-- ---------------------------------------------------------------------------
-- Shared trigger: keep `updated_at` honest
-- ---------------------------------------------------------------------------
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------
create table public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  full_name   text        not null check (char_length(trim(full_name)) between 2 and 120),
  email       citext      not null unique,
  role        public.user_role not null default 'student',
  username    text        unique check (username ~ '^[a-z0-9](?:[a-z0-9-]{1,38}[a-z0-9])$'),
  avatar_url  text,
  bio         text        check (bio is null or char_length(bio) <= 600),
  university  text        not null default '',
  interests   text[]      not null default '{}',
  skills      text[]      not null default '{}',
  links       jsonb       not null default '{}'::jsonb,
  onboarded   boolean     not null default false,
  suspended   boolean     not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

comment on column public.profiles.username is
  'Stable slug for the public portfolio route /portfolio/[username].';
comment on column public.profiles.links is
  'Optional social links, e.g. {"github":"...","linkedin":"..."}.';

create index profiles_role_idx on public.profiles (role);
create index profiles_interests_idx on public.profiles using gin (interests);
create index profiles_skills_idx on public.profiles using gin (skills);

create trigger profiles_touch
  before update on public.profiles
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- events
-- ---------------------------------------------------------------------------
create table public.events (
  id                uuid primary key default gen_random_uuid(),
  title             text        not null check (char_length(trim(title)) between 4 and 160),
  description       text        not null check (char_length(description) >= 20),
  date              date        not null,
  start_time        time        not null,
  end_time          time,
  location          text        not null,
  category          public.event_category not null default 'Other',
  banner_image      text,
  organizer         text        not null,
  external_rsvp_url text,
  status            public.event_status not null default 'pending',
  rejection_note    text,
  created_by        uuid        not null references public.profiles (id) on delete cascade,
  reviewed_by       uuid        references public.profiles (id) on delete set null,
  reviewed_at       timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  constraint events_time_order check (end_time is null or end_time > start_time),
  -- A rejection must always explain itself; moderation notes are not optional.
  constraint events_rejection_note_required
    check (status <> 'rejected' or char_length(coalesce(trim(rejection_note), '')) > 0)
);

create index events_status_date_idx on public.events (status, date);
create index events_created_by_idx on public.events (created_by);
create index events_category_idx on public.events (category);

create trigger events_touch
  before update on public.events
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- event_registrations  (the attendance ladder)
-- ---------------------------------------------------------------------------
create table public.event_registrations (
  id          uuid primary key default gen_random_uuid(),
  event_id    uuid        not null references public.events (id) on delete cascade,
  student_id  uuid        not null references public.profiles (id) on delete cascade,
  status      public.registration_status not null default 'interested',
  verified_by uuid        references public.profiles (id) on delete set null,
  verified_at timestamptz,
  -- Reserved for future QR-code check-in; unused by the MVP UI.
  check_in_token uuid     not null default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (event_id, student_id),
  -- `verified` is the only state that counts as proof, so it must record who
  -- signed off and when.
  constraint registrations_verified_provenance
    check (status <> 'verified' or (verified_by is not null and verified_at is not null))
);

create index event_registrations_student_idx on public.event_registrations (student_id, status);
create index event_registrations_event_idx on public.event_registrations (event_id, status);

create trigger event_registrations_touch
  before update on public.event_registrations
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- opportunities
-- ---------------------------------------------------------------------------
create table public.opportunities (
  id              uuid primary key default gen_random_uuid(),
  title           text        not null check (char_length(trim(title)) between 4 and 160),
  description     text        not null,
  organization    text        not null,
  type            public.opportunity_type not null,
  deadline        date,
  skill_tags      text[]      not null default '{}',
  application_url text,
  image           text,
  status          public.opportunity_status not null default 'published',
  created_by      uuid        references public.profiles (id) on delete set null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index opportunities_status_deadline_idx on public.opportunities (status, deadline);
create index opportunities_type_idx on public.opportunities (type);
create index opportunities_skill_tags_idx on public.opportunities using gin (skill_tags);

create trigger opportunities_touch
  before update on public.opportunities
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- opportunity_progress
-- ---------------------------------------------------------------------------
create table public.opportunity_progress (
  id             uuid primary key default gen_random_uuid(),
  opportunity_id uuid        not null references public.opportunities (id) on delete cascade,
  student_id     uuid        not null references public.profiles (id) on delete cascade,
  status         public.progress_status not null default 'saved',
  evidence_url   text,
  completed_at   timestamptz,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  unique (opportunity_id, student_id),
  constraint progress_completed_at_required
    check (status <> 'completed' or completed_at is not null)
);

create index opportunity_progress_student_idx on public.opportunity_progress (student_id, status);

create trigger opportunity_progress_touch
  before update on public.opportunity_progress
  for each row execute function public.touch_updated_at();

-- Completion timestamps are derived, never trusted from the client.
create or replace function public.stamp_progress_completion()
returns trigger
language plpgsql
as $$
begin
  if new.status = 'completed' and new.completed_at is null then
    new.completed_at := now();
  elsif new.status <> 'completed' then
    new.completed_at := null;
  end if;
  return new;
end;
$$;

create trigger opportunity_progress_stamp
  before insert or update on public.opportunity_progress
  for each row execute function public.stamp_progress_completion();

-- ---------------------------------------------------------------------------
-- certifications  (shared catalog)
-- ---------------------------------------------------------------------------
create table public.certifications (
  id          uuid primary key default gen_random_uuid(),
  name        text        not null,
  provider    text        not null,
  skills      text[]      not null default '{}',
  description text,
  url         text,
  created_at  timestamptz not null default now(),
  unique (name, provider)
);

create index certifications_skills_idx on public.certifications using gin (skills);

-- ---------------------------------------------------------------------------
-- student_certifications
-- ---------------------------------------------------------------------------
create table public.student_certifications (
  id               uuid primary key default gen_random_uuid(),
  student_id       uuid        not null references public.profiles (id) on delete cascade,
  -- Null when a student tracks a certification that is not in the catalog.
  certification_id uuid        references public.certifications (id) on delete set null,
  name             text        not null,
  provider         text        not null,
  skills           text[]      not null default '{}',
  started_date     date,
  completion_date  date,
  credential_url   text,
  status           public.certification_status not null default 'in_progress',
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  constraint student_certifications_completion_required
    check (status <> 'completed' or completion_date is not null),
  constraint student_certifications_date_order
    check (completion_date is null or started_date is null or completion_date >= started_date)
);

create index student_certifications_student_idx
  on public.student_certifications (student_id, status);

create trigger student_certifications_touch
  before update on public.student_certifications
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- seller_applications
-- ---------------------------------------------------------------------------
create table public.seller_applications (
  id            uuid primary key default gen_random_uuid(),
  student_id    uuid        not null unique references public.profiles (id) on delete cascade,
  business_name text        not null,
  description   text        not null,
  contact_method public.contact_method not null default 'whatsapp',
  contact_value text        not null,
  status        public.moderation_status not null default 'pending',
  review_note   text,
  reviewed_by   uuid        references public.profiles (id) on delete set null,
  reviewed_at   timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index seller_applications_status_idx on public.seller_applications (status);

create trigger seller_applications_touch
  before update on public.seller_applications
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- marketplace_listings
-- ---------------------------------------------------------------------------
create table public.marketplace_listings (
  id             uuid primary key default gen_random_uuid(),
  seller_id      uuid        not null references public.profiles (id) on delete cascade,
  product_name   text        not null check (char_length(trim(product_name)) between 3 and 140),
  description    text        not null,
  price          numeric(12, 2) not null check (price >= 0),
  currency       text        not null default 'UGX',
  condition      public.listing_condition not null default 'good',
  category       public.marketplace_category not null default 'Other',
  images         text[]      not null default '{}',
  contact_method public.contact_method not null default 'whatsapp',
  contact_value  text        not null,
  status         public.moderation_status not null default 'pending',
  review_note    text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index marketplace_listings_status_idx on public.marketplace_listings (status, category);
create index marketplace_listings_seller_idx on public.marketplace_listings (seller_id);

create trigger marketplace_listings_touch
  before update on public.marketplace_listings
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- portfolio_visibility  (private by default)
-- ---------------------------------------------------------------------------
create table public.portfolio_visibility (
  student_id          uuid primary key references public.profiles (id) on delete cascade,
  is_public           boolean     not null default false,
  show_events         boolean     not null default true,
  show_opportunities  boolean     not null default true,
  show_certifications boolean     not null default true,
  show_contact        boolean     not null default false,
  updated_at          timestamptz not null default now()
);

comment on table public.portfolio_visibility is
  'A portfolio is private until the student opts in. `show_contact` gates email exposure.';

create trigger portfolio_visibility_touch
  before update on public.portfolio_visibility
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- notifications  (in-app only for v1)
-- ---------------------------------------------------------------------------
create table public.notifications (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid        not null references public.profiles (id) on delete cascade,
  type       public.notification_type not null,
  title      text        not null,
  body       text,
  link       text,
  read       boolean     not null default false,
  created_at timestamptz not null default now()
);

create index notifications_user_idx on public.notifications (user_id, read, created_at desc);
