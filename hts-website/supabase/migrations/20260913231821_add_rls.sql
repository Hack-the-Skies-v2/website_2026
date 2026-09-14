CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.users
    WHERE id = auth.uid()
      AND admin = TRUE
  );
$$;

REVOKE EXECUTE ON FUNCTION public.is_admin() FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.is_admin() TO authenticated;

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY select_own_user ON public.users
  FOR SELECT TO authenticated USING (auth.uid() = id);

CREATE POLICY update_own_user ON public.users
  FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    AND admin     = (SELECT u.admin     FROM public.users u WHERE u.id = auth.uid())
    AND judge     = (SELECT u.judge     FROM public.users u WHERE u.id = auth.uid())
    AND mentor    = (SELECT u.mentor    FROM public.users u WHERE u.id = auth.uid())
    AND hacker    = (SELECT u.hacker    FROM public.users u WHERE u.id = auth.uid())
    AND checked_in = (SELECT u.checked_in FROM public.users u WHERE u.id = auth.uid())
    AND qr_code_link IS NOT DISTINCT FROM (SELECT u.qr_code_link FROM public.users u WHERE u.id = auth.uid())
    AND team_id   IS NOT DISTINCT FROM (SELECT u.team_id   FROM public.users u WHERE u.id = auth.uid())
    AND points    = (SELECT u.points    FROM public.users u WHERE u.id = auth.uid())
  );


CREATE POLICY select_all_users_admin ON public.users
  FOR SELECT TO authenticated USING (public.is_admin());

CREATE POLICY update_all_users_admin ON public.users
  FOR UPDATE TO authenticated USING (public.is_admin());

ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;

CREATE POLICY select_teams ON public.teams
  FOR SELECT TO authenticated USING (true);

CREATE POLICY insert_teams_admin ON public.teams
  FOR INSERT TO authenticated WITH CHECK (public.is_admin());

CREATE POLICY update_teams_admin ON public.teams
  FOR UPDATE TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY delete_teams_admin ON public.teams
  FOR DELETE TO authenticated USING (public.is_admin());

ALTER TABLE public.meals ENABLE ROW LEVEL SECURITY;

CREATE POLICY select_meals ON public.meals
  FOR SELECT TO authenticated USING (true);

CREATE POLICY insert_meals_admin ON public.meals
  FOR INSERT TO authenticated WITH CHECK (public.is_admin());

CREATE POLICY update_meals_admin ON public.meals
  FOR UPDATE TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY delete_meals_admin ON public.meals
  FOR DELETE TO authenticated USING (public.is_admin());

ALTER TABLE public.meal_attendance ENABLE ROW LEVEL SECURITY;

CREATE POLICY select_own_meal_attendance ON public.meal_attendance
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY select_all_meal_attendance_admin ON public.meal_attendance
  FOR SELECT TO authenticated USING (public.is_admin());

CREATE POLICY manage_meal_attendance_admin ON public.meal_attendance
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

ALTER TABLE public.workshops ENABLE ROW LEVEL SECURITY;

CREATE POLICY select_workshops ON public.workshops
  FOR SELECT TO authenticated USING (true);

CREATE POLICY insert_workshops_admin ON public.workshops
  FOR INSERT TO authenticated WITH CHECK (public.is_admin());

CREATE POLICY update_workshops_admin ON public.workshops
  FOR UPDATE TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY delete_workshops_admin ON public.workshops
  FOR DELETE TO authenticated USING (public.is_admin());

ALTER TABLE public.workshop_attendance ENABLE ROW LEVEL SECURITY;

CREATE POLICY select_own_workshop_attendance ON public.workshop_attendance
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY select_all_workshop_attendance_admin ON public.workshop_attendance
  FOR SELECT TO authenticated USING (public.is_admin());

CREATE POLICY manage_workshop_attendance_admin ON public.workshop_attendance
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

CREATE POLICY select_own_referrals ON public.referrals
  FOR SELECT TO authenticated USING (auth.uid() = referrer_user_id);

CREATE POLICY select_all_referrals_admin ON public.referrals
  FOR SELECT TO authenticated USING (public.is_admin());

CREATE POLICY manage_referrals_admin ON public.referrals
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

ALTER TABLE public.tracks ENABLE ROW LEVEL SECURITY;

CREATE POLICY select_tracks_admin ON public.tracks
  FOR SELECT TO authenticated USING (public.is_admin());

CREATE POLICY insert_tracks_admin ON public.tracks
  FOR INSERT TO authenticated WITH CHECK (public.is_admin());

CREATE POLICY update_tracks_admin ON public.tracks
  FOR UPDATE TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY delete_tracks_admin ON public.tracks
  FOR DELETE TO authenticated USING (public.is_admin());

ALTER TABLE public.team_tracks ENABLE ROW LEVEL SECURITY;

CREATE POLICY select_own_team_tracks ON public.team_tracks
  FOR SELECT TO authenticated
  USING (
    team_id IN (
      SELECT team_id FROM public.users WHERE id = auth.uid()
    )
  );

CREATE POLICY select_all_team_tracks_admin ON public.team_tracks
  FOR SELECT TO authenticated USING (public.is_admin());

CREATE POLICY manage_team_tracks_admin ON public.team_tracks
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

ALTER TABLE public.judging_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY select_judging_scores_admin ON public.judging_scores
  FOR SELECT TO authenticated USING (public.is_admin());

CREATE POLICY select_own_judging_scores ON public.judging_scores
  FOR SELECT TO authenticated USING (judge_id = auth.uid());

CREATE POLICY insert_judging_score_judge ON public.judging_scores
  FOR INSERT TO authenticated
  WITH CHECK (
    judge_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.users WHERE id = auth.uid() AND judge = TRUE
    )
  );

CREATE POLICY update_judging_score_judge ON public.judging_scores
  FOR UPDATE TO authenticated
  USING (
    judge_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.users WHERE id = auth.uid() AND judge = TRUE
    )
  )
  WITH CHECK (
    judge_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.users WHERE id = auth.uid() AND judge = TRUE
    )
  );

CREATE POLICY manage_judging_scores_admin ON public.judging_scores
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY select_own_application ON public.applications
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY update_own_application ON public.applications
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id AND status = 'draft')
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY select_all_applications_admin ON public.applications
  FOR SELECT TO authenticated USING (public.is_admin());

CREATE POLICY manage_applications_admin ON public.applications
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

ALTER TABLE public.hacker_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY select_own_hacker_app ON public.hacker_applications
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY update_own_hacker_app ON public.hacker_applications
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY manage_hacker_app_admin ON public.hacker_applications
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

ALTER TABLE public.judge_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY select_own_judge_app ON public.judge_applications
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY update_own_judge_app ON public.judge_applications
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY manage_judge_app_admin ON public.judge_applications
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

ALTER TABLE public.mentor_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY select_own_mentor_app ON public.mentor_applications
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY update_own_mentor_app ON public.mentor_applications
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY manage_mentor_app_admin ON public.mentor_applications
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

ALTER TABLE public.points_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY select_own_points ON public.points_transactions
  FOR SELECT TO authenticated USING (auth.uid() = affected_user_id);

CREATE POLICY select_all_points_admin ON public.points_transactions
  FOR SELECT TO authenticated USING (public.is_admin());

CREATE POLICY manage_points_admin ON public.points_transactions
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

GRANT SELECT, UPDATE ON public.users TO authenticated;
GRANT SELECT ON public.teams TO authenticated;
GRANT SELECT ON public.meals TO authenticated;
GRANT SELECT ON public.meal_attendance TO authenticated;
GRANT SELECT ON public.workshops TO authenticated;
GRANT SELECT ON public.workshop_attendance TO authenticated;
GRANT SELECT ON public.referrals TO authenticated;
GRANT SELECT ON public.tracks TO authenticated;
GRANT SELECT ON public.team_tracks TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.judging_scores TO authenticated;
GRANT SELECT, UPDATE ON public.applications TO authenticated;
GRANT SELECT, UPDATE ON public.hacker_applications TO authenticated;
GRANT SELECT, UPDATE ON public.judge_applications TO authenticated;
GRANT SELECT, UPDATE ON public.mentor_applications TO authenticated;
GRANT SELECT ON public.points_transactions TO authenticated;
