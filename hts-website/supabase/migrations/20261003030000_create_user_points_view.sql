CREATE VIEW public.user_points
WITH (security_invoker = true)
AS
SELECT
  u.id AS user_id,
  COALESCE(earnings.earned_points, 0)::integer AS earned_points,
  COALESCE(adjustments.adjustment_points, 0)::integer AS adjustment_points,
  COALESCE(spending.spent_points, 0)::integer AS spent_points,
  (
    COALESCE(earnings.earned_points, 0)
    + COALESCE(adjustments.adjustment_points, 0)
    - COALESCE(spending.spent_points, 0)
  )::integer AS balance
FROM public.users AS u
LEFT JOIN (
  SELECT user_id, SUM(points_awarded) AS earned_points
  FROM public.point_earnings
  GROUP BY user_id
) AS earnings ON earnings.user_id = u.id
LEFT JOIN (
  SELECT user_id, SUM(points) AS adjustment_points
  FROM public.point_adjustments
  GROUP BY user_id
) AS adjustments ON adjustments.user_id = u.id
LEFT JOIN (
  SELECT user_id, SUM(points_spent) AS spent_points
  FROM public.prize_redemptions
  GROUP BY user_id
) AS spending ON spending.user_id = u.id;

GRANT SELECT ON public.user_points TO authenticated;

DROP POLICY update_own_user
  ON public.users;

ALTER TABLE public.users
  DROP CONSTRAINT IF EXISTS users_points_non_negative,
  DROP COLUMN IF EXISTS points;

CREATE POLICY update_own_user ON public.users
  FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    AND admin = (SELECT u.admin FROM public.users u WHERE u.id = auth.uid())
    AND judge = (SELECT u.judge FROM public.users u WHERE u.id = auth.uid())
    AND mentor = (SELECT u.mentor FROM public.users u WHERE u.id = auth.uid())
    AND hacker = (SELECT u.hacker FROM public.users u WHERE u.id = auth.uid())
    AND checked_in = (SELECT u.checked_in FROM public.users u WHERE u.id = auth.uid())
    AND qr_code_link IS NOT DISTINCT FROM (SELECT u.qr_code_link FROM public.users u WHERE u.id = auth.uid())
    AND team_id IS NOT DISTINCT FROM (SELECT u.team_id FROM public.users u WHERE u.id = auth.uid())
  );

CREATE OR REPLACE FUNCTION public.redeem_point_prize(p_prize_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_user_id uuid := auth.uid();
  current_points integer;
  prize_points integer;
  prize_quantity integer;
  prize_max_redemptions integer;
  redemption_count integer;
BEGIN
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'You must be signed in to redeem a prize';
  END IF;

  PERFORM 1
  FROM public.users
  WHERE id = current_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'User profile not found';
  END IF;

  SELECT balance
  INTO current_points
  FROM public.user_points
  WHERE user_id = current_user_id;

  SELECT points_required, quantity, max_redemptions
  INTO prize_points, prize_quantity, prize_max_redemptions
  FROM public.point_prizes
  WHERE id = p_prize_id
    AND active = true
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Prize is not available';
  END IF;

  IF current_points < prize_points THEN
    RAISE EXCEPTION 'You do not have enough points';
  END IF;

  IF prize_quantity IS NOT NULL THEN
    SELECT count(*)
    INTO redemption_count
    FROM public.prize_redemptions
    WHERE prize_id = p_prize_id;

    IF redemption_count >= prize_quantity THEN
      RAISE EXCEPTION 'Prize quantity exhausted';
    END IF;
  END IF;

  IF prize_max_redemptions IS NOT NULL THEN
    SELECT count(*)
    INTO redemption_count
    FROM public.prize_redemptions
    WHERE prize_id = p_prize_id
      AND user_id = current_user_id;

    IF redemption_count >= prize_max_redemptions THEN
      RAISE EXCEPTION 'You have reached the redemption limit for this prize';
    END IF;
  END IF;

  INSERT INTO public.prize_redemptions (user_id, prize_id, points_spent)
  VALUES (current_user_id, p_prize_id, prize_points);

  RETURN current_points - prize_points;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.redeem_point_prize(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.redeem_point_prize(uuid) TO authenticated;
