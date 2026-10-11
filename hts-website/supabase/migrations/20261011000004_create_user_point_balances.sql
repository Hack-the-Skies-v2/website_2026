CREATE TABLE public.user_point_balances (
  user_id uuid PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  earned_points integer NOT NULL DEFAULT 0,
  adjustment_points integer NOT NULL DEFAULT 0,
  spent_points integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.user_point_balances ENABLE ROW LEVEL SECURITY;

CREATE POLICY user_point_balances_select_own_or_admin
  ON public.user_point_balances
  FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()) OR public.is_admin());

INSERT INTO public.user_point_balances (user_id, earned_points, adjustment_points, spent_points)
SELECT
  u.id,
  COALESCE(e.earned_points, 0)::integer,
  COALESCE(a.adjustment_points, 0)::integer,
  COALESCE(r.spent_points, 0)::integer
FROM public.users AS u
LEFT JOIN (
  SELECT user_id, SUM(points_awarded) AS earned_points
  FROM public.point_earnings
  GROUP BY user_id
) AS e ON e.user_id = u.id
LEFT JOIN (
  SELECT user_id, SUM(points) AS adjustment_points
  FROM public.point_adjustments
  GROUP BY user_id
) AS a ON a.user_id = u.id
LEFT JOIN (
  SELECT user_id, SUM(points_spent) AS spent_points
  FROM public.prize_redemptions
  GROUP BY user_id
) AS r ON r.user_id = u.id;

CREATE OR REPLACE FUNCTION public.apply_user_point_delta(
  p_user_id uuid,
  p_earned_delta integer,
  p_adjustment_delta integer,
  p_spent_delta integer
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_point_balances (
    user_id, earned_points, adjustment_points, spent_points, updated_at
  )
  VALUES (
    p_user_id, p_earned_delta, p_adjustment_delta, p_spent_delta, now()
  )
  ON CONFLICT (user_id) DO UPDATE
  SET earned_points = user_point_balances.earned_points + EXCLUDED.earned_points,
      adjustment_points = user_point_balances.adjustment_points + EXCLUDED.adjustment_points,
      spent_points = user_point_balances.spent_points + EXCLUDED.spent_points,
      updated_at = now();
END;
$$;

CREATE OR REPLACE FUNCTION public.sync_user_point_balance()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  old_user_id uuid;
  new_user_id uuid;
  old_earned integer := 0;
  new_earned integer := 0;
  old_adjustment integer := 0;
  new_adjustment integer := 0;
  old_spent integer := 0;
  new_spent integer := 0;
BEGIN
  IF TG_OP <> 'INSERT' THEN
    old_user_id := OLD.user_id;
    IF TG_TABLE_NAME = 'point_earnings' THEN old_earned := OLD.points_awarded;
    ELSIF TG_TABLE_NAME = 'point_adjustments' THEN old_adjustment := OLD.points;
    ELSE old_spent := OLD.points_spent;
    END IF;
    PERFORM public.apply_user_point_delta(old_user_id, -old_earned, -old_adjustment, -old_spent);
  END IF;

  IF TG_OP <> 'DELETE' THEN
    new_user_id := NEW.user_id;
    IF TG_TABLE_NAME = 'point_earnings' THEN new_earned := NEW.points_awarded;
    ELSIF TG_TABLE_NAME = 'point_adjustments' THEN new_adjustment := NEW.points;
    ELSE new_spent := NEW.points_spent;
    END IF;
    PERFORM public.apply_user_point_delta(new_user_id, new_earned, new_adjustment, new_spent);
  END IF;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.apply_user_point_delta(uuid, integer, integer, integer) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.sync_user_point_balance() FROM PUBLIC;

CREATE TRIGGER sync_point_earnings_balance
AFTER INSERT OR UPDATE OR DELETE ON public.point_earnings
FOR EACH ROW EXECUTE FUNCTION public.sync_user_point_balance();

CREATE TRIGGER sync_point_adjustments_balance
AFTER INSERT OR UPDATE OR DELETE ON public.point_adjustments
FOR EACH ROW EXECUTE FUNCTION public.sync_user_point_balance();

CREATE TRIGGER sync_prize_redemptions_balance
AFTER INSERT OR UPDATE OR DELETE ON public.prize_redemptions
FOR EACH ROW EXECUTE FUNCTION public.sync_user_point_balance();

DROP VIEW public.user_points;

CREATE VIEW public.user_points
WITH (security_invoker = true)
AS
SELECT
  u.id AS user_id,
  COALESCE(b.earned_points, 0)::integer AS earned_points,
  COALESCE(b.adjustment_points, 0)::integer AS adjustment_points,
  COALESCE(b.spent_points, 0)::integer AS spent_points,
  (
    COALESCE(b.earned_points, 0)
    + COALESCE(b.adjustment_points, 0)
    - COALESCE(b.spent_points, 0)
  )::integer AS balance
FROM public.users AS u
LEFT JOIN public.user_point_balances AS b ON b.user_id = u.id;

GRANT SELECT ON public.user_points TO authenticated;
GRANT SELECT ON public.user_point_balances TO authenticated;
