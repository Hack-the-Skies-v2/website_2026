-- A legacy trigger function attempted to mirror allowlist rows into the
-- removed public.organizers table. Allowlist membership is now checked
-- directly by public.is_admin(), so the trigger and function are obsolete.
DROP FUNCTION IF EXISTS public.link_existing_organizer_on_allowlist() CASCADE;

DROP POLICY IF EXISTS organizer_allowlist_select_admin ON public.organizer_allowlist;
DROP POLICY IF EXISTS organizer_allowlist_manage_admin ON public.organizer_allowlist;
DROP POLICY IF EXISTS organizer_allowlist_select_own ON public.organizer_allowlist;

ALTER TABLE public.organizer_allowlist ENABLE ROW LEVEL SECURITY;

CREATE POLICY organizer_allowlist_select_own
  ON public.organizer_allowlist
  FOR SELECT TO authenticated
  USING (
    lower(btrim(email)) = lower(btrim(auth.jwt() ->> 'email'))
  );
