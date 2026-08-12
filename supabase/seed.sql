-- ===========================================================================
-- CampusOrbit — production seed
--
-- Creates the single administrator account.
--
-- All other accounts are created by real users through the sign-up flow.
-- No demo data, no sample events, no placeholder listings.
--
-- SECURITY: This file contains the admin account password. Keep it out of
-- public repositories and rotate the password after first login.
-- ===========================================================================

set search_path = public, extensions;

do $$
declare
  hashed text := crypt('CampusOrbit!2026', gen_salt('bf'));
  admin_id uuid := 'a0000000-0000-4000-8000-000000000001';
begin
  -- Create the auth user for the administrator.
  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password,
    email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
    created_at, updated_at
  ) values (
    '00000000-0000-0000-0000-000000000000',
    admin_id,
    'authenticated',
    'authenticated',
    'benwaeldon@gmail.com',
    hashed,
    now(),
    jsonb_build_object('provider', 'email', 'providers', array['email']),
    jsonb_build_object('full_name', 'Benjamin Wakid', 'role', 'admin'),
    now(),
    now()
  )
  on conflict (id) do nothing;

  -- Identity row required for password sign-in.
  insert into auth.identities (
    id, user_id, provider_id, provider, identity_data,
    last_sign_in_at, created_at, updated_at
  ) values (
    gen_random_uuid(),
    admin_id,
    admin_id::text,
    'email',
    jsonb_build_object(
      'sub', admin_id::text,
      'email', 'benwaeldon@gmail.com',
      'email_verified', true
    ),
    now(),
    now(),
    now()
  )
  on conflict do nothing;
end $$;

-- The handle_new_user trigger creates the profiles row automatically.
-- Promote the account to admin (the trigger defaults to student/leader),
-- and set the correct display name.
update public.profiles
set
  role        = 'admin',
  full_name   = 'Benjamin Wakid',
  username    = 'benjamin-wakid',
  bio         = 'CampusOrbit platform administrator.',
  onboarded   = true
where id = 'a0000000-0000-4000-8000-000000000001';
