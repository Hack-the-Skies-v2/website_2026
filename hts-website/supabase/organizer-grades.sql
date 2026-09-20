-- Grades for organizer review. Apply after organizer-access.sql.
-- One row per (application, grader). Scores are raw 1–10 values keyed by question id.

create table if not exists public.application_grades (
  application_id uuid not null references public.applications(id) on delete cascade,
  grader_id uuid not null references auth.users(id) on delete cascade,
  scores jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (application_id, grader_id)
);

alter table public.application_grades enable row level security;

drop policy if exists "organizers_can_read_grades" on public.application_grades;
create policy "organizers_can_read_grades"
  on public.application_grades for select to authenticated
  using ((select public.is_organizer()));

drop policy if exists "organizers_can_upsert_own_grades" on public.application_grades;
create policy "organizers_can_upsert_own_grades"
  on public.application_grades for insert to authenticated
  with check (
    grader_id = (select auth.uid())
    and (select public.is_organizer())
  );

drop policy if exists "organizers_can_update_own_grades" on public.application_grades;
create policy "organizers_can_update_own_grades"
  on public.application_grades for update to authenticated
  using (
    grader_id = (select auth.uid())
    and (select public.is_organizer())
  )
  with check (
    grader_id = (select auth.uid())
    and (select public.is_organizer())
  );

drop policy if exists "organizers_can_delete_own_grades" on public.application_grades;
create policy "organizers_can_delete_own_grades"
  on public.application_grades for delete to authenticated
  using (
    grader_id = (select auth.uid())
    and (select public.is_organizer())
  );

create index if not exists application_grades_application_id_idx
  on public.application_grades (application_id);
