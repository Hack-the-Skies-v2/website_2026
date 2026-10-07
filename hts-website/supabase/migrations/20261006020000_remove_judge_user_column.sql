DROP POLICY IF EXISTS update_own_user ON public.users;
DROP POLICY IF EXISTS schedule_events_select_authorized ON public.schedule_events;

CREATE POLICY update_own_user ON public.users
  FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    AND admin = (SELECT u.admin FROM public.users u WHERE u.id = auth.uid())
    AND qr_code_link IS NOT DISTINCT FROM (SELECT u.qr_code_link FROM public.users u WHERE u.id = auth.uid())
    AND team_id IS NOT DISTINCT FROM (SELECT u.team_id FROM public.users u WHERE u.id = auth.uid())
    AND application_status IS NOT DISTINCT FROM (
      SELECT u.application_status FROM public.users u WHERE u.id = auth.uid()
    )
  );

CREATE POLICY schedule_events_select_authorized
  ON public.schedule_events FOR SELECT TO authenticated
  USING (
    public.is_admin()
    OR EXISTS (
      SELECT 1
      FROM public.judge_applications ja
      JOIN public.users u ON u.id = ja.user_id
      WHERE ja.user_id = (SELECT auth.uid())
        AND u.application_status = 'accepted'
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
      FROM public.judge_applications ja
      JOIN public.users u ON u.id = ja.user_id
      WHERE ja.user_id = auth.uid()
        AND u.application_status = 'accepted'
    )
  );

DROP POLICY IF EXISTS update_judging_score_judge ON public.judging_scores;
CREATE POLICY update_judging_score_judge ON public.judging_scores
  FOR UPDATE TO authenticated
  USING (
    judge_id = auth.uid()
    AND EXISTS (
      SELECT 1
      FROM public.judge_applications ja
      JOIN public.users u ON u.id = ja.user_id
      WHERE ja.user_id = auth.uid()
        AND u.application_status = 'accepted'
    )
  )
  WITH CHECK (
    judge_id = auth.uid()
    AND EXISTS (
      SELECT 1
      FROM public.judge_applications ja
      JOIN public.users u ON u.id = ja.user_id
      WHERE ja.user_id = auth.uid()
        AND u.application_status = 'accepted'
    )
  );

ALTER TABLE public.users
  DROP COLUMN IF EXISTS judge;
