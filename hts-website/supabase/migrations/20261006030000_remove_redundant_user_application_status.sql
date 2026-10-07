DROP TRIGGER IF EXISTS sync_user_application_status ON public.applications;
DROP FUNCTION IF EXISTS public.sync_user_application_status();

DROP POLICY IF EXISTS update_own_user ON public.users;

CREATE POLICY update_own_user ON public.users
  FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    AND admin = (SELECT u.admin FROM public.users u WHERE u.id = auth.uid())
    AND qr_code_link IS NOT DISTINCT FROM (SELECT u.qr_code_link FROM public.users u WHERE u.id = auth.uid())
    AND team_id IS NOT DISTINCT FROM (SELECT u.team_id FROM public.users u WHERE u.id = auth.uid())
  );

DROP POLICY IF EXISTS schedule_events_select_authorized ON public.schedule_events;

CREATE POLICY schedule_events_select_authorized
  ON public.schedule_events FOR SELECT TO authenticated
  USING (
    public.is_admin()
    OR EXISTS (
      SELECT 1
      FROM public.applications a
      WHERE a.user_id = (SELECT auth.uid())
        AND a.application_type = 'judge'
        AND a.status = 'accepted'
    )
    OR EXISTS (
      SELECT 1
      FROM public.applications a
      WHERE a.user_id = (SELECT auth.uid())
        AND a.application_type IN ('hacker', 'mentor')
    )
  );

DROP POLICY IF EXISTS insert_judging_score_judge ON public.judging_scores;
CREATE POLICY insert_judging_score_judge ON public.judging_scores
  FOR INSERT TO authenticated
  WITH CHECK (
    judge_id = auth.uid()
    AND EXISTS (
      SELECT 1
      FROM public.applications a
      WHERE a.user_id = auth.uid()
        AND a.application_type = 'judge'
        AND a.status = 'accepted'
    )
  );

DROP POLICY IF EXISTS update_judging_score_judge ON public.judging_scores;
CREATE POLICY update_judging_score_judge ON public.judging_scores
  FOR UPDATE TO authenticated
  USING (
    judge_id = auth.uid()
    AND EXISTS (
      SELECT 1
      FROM public.applications a
      WHERE a.user_id = auth.uid()
        AND a.application_type = 'judge'
        AND a.status = 'accepted'
    )
  )
  WITH CHECK (
    judge_id = auth.uid()
    AND EXISTS (
      SELECT 1
      FROM public.applications a
      WHERE a.user_id = auth.uid()
        AND a.application_type = 'judge'
        AND a.status = 'accepted'
    )
  );

ALTER TABLE public.users
  DROP CONSTRAINT IF EXISTS users_application_status_check,
  DROP COLUMN IF EXISTS application_status;
