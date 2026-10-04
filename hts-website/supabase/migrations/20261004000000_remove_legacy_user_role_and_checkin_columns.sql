-- Attendance records are the source of truth for check-in status.
-- Application type and the judge profile flag are the source of truth for roles.

DROP POLICY IF EXISTS update_own_user ON public.users;
DROP POLICY IF EXISTS schedule_events_select_authorized ON public.schedule_events;
DROP POLICY IF EXISTS schedule_attendance_select_admin ON public.schedule_attendance;

ALTER TABLE public.users
  DROP COLUMN IF EXISTS hacker,
  DROP COLUMN IF EXISTS mentor,
  DROP COLUMN IF EXISTS checked_in;

CREATE POLICY update_own_user ON public.users
  FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    AND admin = (SELECT u.admin FROM public.users u WHERE u.id = auth.uid())
    AND judge = (SELECT u.judge FROM public.users u WHERE u.id = auth.uid())
    AND qr_code_link IS NOT DISTINCT FROM (SELECT u.qr_code_link FROM public.users u WHERE u.id = auth.uid())
    AND team_id IS NOT DISTINCT FROM (SELECT u.team_id FROM public.users u WHERE u.id = auth.uid())
  );

CREATE POLICY schedule_events_select_authorized
  ON public.schedule_events FOR SELECT TO authenticated
  USING (
    public.is_admin()
    OR EXISTS (
      SELECT 1
      FROM public.users AS u
      WHERE u.id = (SELECT auth.uid())
        AND u.judge
    )
    OR EXISTS (
      SELECT 1
      FROM public.applications AS a
      WHERE a.user_id = (SELECT auth.uid())
        AND a.application_type IN ('hacker', 'mentor')
    )
  );

CREATE POLICY schedule_attendance_select_admin
  ON public.schedule_attendance FOR SELECT TO authenticated
  USING ((SELECT public.is_admin()));
