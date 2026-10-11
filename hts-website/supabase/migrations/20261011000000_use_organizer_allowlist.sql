CREATE TABLE IF NOT EXISTS public.organizer_allowlist (
  email text PRIMARY KEY,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT organizer_allowlist_email_not_blank CHECK (btrim(email) <> '')
);

CREATE UNIQUE INDEX IF NOT EXISTS organizer_allowlist_email_normalized_idx
  ON public.organizer_allowlist (lower(btrim(email)));

ALTER TABLE public.organizer_allowlist ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS organizer_allowlist_select_admin ON public.organizer_allowlist;
DROP POLICY IF EXISTS organizer_allowlist_manage_admin ON public.organizer_allowlist;

CREATE POLICY organizer_allowlist_select_own ON public.organizer_allowlist
  FOR SELECT TO authenticated
  USING (lower(btrim(email)) = lower(btrim(auth.jwt() ->> 'email')));

-- Allowlist membership is checked by the security-definer function below.
-- Service role manages the table; regular users can only read their own match.

-- These policies reference users.admin directly, so they must be removed before
-- the column is dropped and recreated below without that column dependency.
DROP POLICY IF EXISTS update_own_user ON public.users;
DROP POLICY IF EXISTS schedule_events_select_authorized ON public.schedule_events;
DROP POLICY IF EXISTS schedule_events_insert_admin ON public.schedule_events;
DROP POLICY IF EXISTS schedule_events_update_admin ON public.schedule_events;
DROP POLICY IF EXISTS schedule_events_delete_admin ON public.schedule_events;
DROP POLICY IF EXISTS schedule_attendance_select_admin ON public.schedule_attendance;
DROP POLICY IF EXISTS schedule_attendance_insert_admin ON public.schedule_attendance;
DROP POLICY IF EXISTS schedule_attendance_delete_admin ON public.schedule_attendance;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.organizer_allowlist
    WHERE lower(btrim(email)) = lower(btrim(auth.jwt() ->> 'email'))
  );
$$;

ALTER TABLE public.users
  DROP COLUMN IF EXISTS admin;

REVOKE EXECUTE ON FUNCTION public.is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

CREATE POLICY update_own_user ON public.users
  FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    AND qr_code_link IS NOT DISTINCT FROM (SELECT u.qr_code_link FROM public.users u WHERE u.id = auth.uid())
    AND team_id IS NOT DISTINCT FROM (SELECT u.team_id FROM public.users u WHERE u.id = auth.uid())
  );

CREATE POLICY schedule_events_select_authorized
  ON public.schedule_events FOR SELECT TO authenticated
  USING (
    public.is_admin()
    OR EXISTS (
      SELECT 1
      FROM public.applications a
      WHERE a.user_id = auth.uid()
        AND a.application_type = 'judge'
        AND a.status = 'accepted'
    )
    OR EXISTS (
      SELECT 1
      FROM public.applications a
      WHERE a.user_id = auth.uid()
        AND a.application_type IN ('hacker', 'mentor')
    )
  );

CREATE POLICY schedule_events_insert_admin
  ON public.schedule_events FOR INSERT TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY schedule_events_update_admin
  ON public.schedule_events FOR UPDATE TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY schedule_events_delete_admin
  ON public.schedule_events FOR DELETE TO authenticated
  USING (public.is_admin());

CREATE POLICY schedule_attendance_select_admin
  ON public.schedule_attendance FOR SELECT TO authenticated
  USING (public.is_admin());

CREATE POLICY schedule_attendance_insert_admin
  ON public.schedule_attendance FOR INSERT TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY schedule_attendance_delete_admin
  ON public.schedule_attendance FOR DELETE TO authenticated
  USING (public.is_admin());
