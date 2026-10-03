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

  SELECT points
  INTO current_points
  FROM public.users
  WHERE id = current_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'User profile not found';
  END IF;

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

  UPDATE public.users
  SET points = points - prize_points
  WHERE id = current_user_id;

  INSERT INTO public.prize_redemptions (user_id, prize_id, points_spent)
  VALUES (current_user_id, p_prize_id, prize_points);

  RETURN current_points - prize_points;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.redeem_point_prize(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.redeem_point_prize(uuid) TO authenticated;

DROP POLICY prize_redemptions_insert_own
  ON public.prize_redemptions;
