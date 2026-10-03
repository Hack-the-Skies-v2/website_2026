ALTER TABLE public.point_redemptions
  RENAME TO point_earnings;

ALTER INDEX public.point_redemptions_user_id_idx
  RENAME TO point_earnings_user_id_idx;

ALTER INDEX public.point_redemptions_point_action_id_idx
  RENAME TO point_earnings_point_action_id_idx;

ALTER TRIGGER set_point_redemption_points_before_insert
  ON public.point_earnings
  RENAME TO set_point_earning_points_before_insert;

ALTER FUNCTION public.set_point_redemption_points()
  RENAME TO set_point_earning_points;

CREATE OR REPLACE FUNCTION public.set_point_earning_points()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  action_points integer;
  action_max_redemptions integer;
  earning_count integer;
BEGIN
  SELECT points, max_redemptions
  INTO action_points, action_max_redemptions
  FROM public.point_actions
  WHERE id = NEW.point_action_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Point action not found';
  END IF;

  IF action_max_redemptions IS NOT NULL THEN
    SELECT count(*)
    INTO earning_count
    FROM public.point_earnings
    WHERE user_id = NEW.user_id
      AND point_action_id = NEW.point_action_id;

    IF earning_count >= action_max_redemptions THEN
      RAISE EXCEPTION 'Point action redemption limit reached';
    END IF;
  END IF;

  NEW.points_awarded := action_points;
  RETURN NEW;
END;
$$;

ALTER POLICY point_redemptions_select_own
  ON public.point_earnings
  RENAME TO point_earnings_select_own;

ALTER POLICY point_redemptions_select_admin
  ON public.point_earnings
  RENAME TO point_earnings_select_admin;

ALTER POLICY point_redemptions_insert_admin
  ON public.point_earnings
  RENAME TO point_earnings_insert_admin;

ALTER POLICY point_redemptions_delete_admin
  ON public.point_earnings
  RENAME TO point_earnings_delete_admin;
