-- Apply after the existing application schema is in place.
-- This script never creates or accepts public applications.

create table if not exists public.organizer_allowlist (
  email text primary key check (email = lower(email)),
  created_at timestamptz not null default now()
);

create table if not exists public.organizers (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.organizer_allowlist enable row level security;
alter table public.organizers enable row level security;

create or replace function public.is_organizer()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.organizers where user_id = (select auth.uid()));
$$;

drop policy if exists "organizers_can_read_their_membership" on public.organizers;
create policy "organizers_can_read_their_membership"
  on public.organizers for select to authenticated
  using (user_id = (select auth.uid()));

create or replace function public.link_organizer_from_allowlist()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.organizers (user_id)
  select new.id
  where exists (select 1 from public.organizer_allowlist where email = lower(new.email))
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists link_organizer_after_signup on auth.users;
create trigger link_organizer_after_signup
  after insert on auth.users
  for each row execute function public.link_organizer_from_allowlist();

-- Ensure the public.applications table has the expected schema
drop table if exists public.applications cascade;

create table public.applications (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('hacker', 'mentor')),
  status text not null default 'pending' check (status in ('pending', 'accepted', 'rejected')),
  first_name text not null,
  last_name text not null,
  email text not null,
  school_or_organization text,
  details jsonb,
  answers jsonb,
  submitted_at timestamptz not null default now(),
  decided_at timestamptz,
  notification_sent_at timestamptz,
  notification_error text
);

alter table public.applications enable row level security;
drop policy if exists "organizers_can_read_applications" on public.applications;
create policy "organizers_can_read_applications"
  on public.applications for select to authenticated
  using ((select public.is_organizer()));
drop policy if exists "organizers_can_update_applications" on public.applications;
create policy "organizers_can_update_applications"
  on public.applications for update to authenticated
  using ((select public.is_organizer()))
  with check ((select public.is_organizer()));

-- Also link any user already created in auth.users if their email is added to allowlist
create or replace function public.link_existing_organizer_on_allowlist()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.organizers (user_id)
  select id from auth.users where lower(email) = lower(new.email)
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists link_existing_organizer_on_allowlist_insert on public.organizer_allowlist;
create trigger link_existing_organizer_on_allowlist_insert
  after insert or update on public.organizer_allowlist
  for each row execute function public.link_existing_organizer_on_allowlist();

-- Allowlisted organizer:
insert into public.organizer_allowlist (email)
values ('ali@hacktheskies.com')
on conflict (email) do nothing;

