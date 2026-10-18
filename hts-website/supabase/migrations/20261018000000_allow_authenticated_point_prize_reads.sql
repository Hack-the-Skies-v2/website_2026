-- Point and prize data is readable by every signed-in user. Write access
-- remains restricted by the existing insert, update, and delete policies.

DROP POLICY IF EXISTS point_actions_select_authenticated
  ON public.point_actions;
CREATE POLICY point_actions_select_authenticated
  ON public.point_actions
  FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS point_earnings_select_own
  ON public.point_earnings;
DROP POLICY IF EXISTS point_earnings_select_admin
  ON public.point_earnings;
CREATE POLICY point_earnings_select_authenticated
  ON public.point_earnings
  FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS point_adjustments_select_own
  ON public.point_adjustments;
DROP POLICY IF EXISTS point_adjustments_select_admin
  ON public.point_adjustments;
CREATE POLICY point_adjustments_select_authenticated
  ON public.point_adjustments
  FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS point_prizes_select_active
  ON public.point_prizes;
CREATE POLICY point_prizes_select_authenticated
  ON public.point_prizes
  FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS prize_redemptions_select_own
  ON public.prize_redemptions;
CREATE POLICY prize_redemptions_select_authenticated
  ON public.prize_redemptions
  FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS user_point_balances_select_own_or_admin
  ON public.user_point_balances;
CREATE POLICY user_point_balances_select_authenticated
  ON public.user_point_balances
  FOR SELECT TO authenticated
  USING (true);
