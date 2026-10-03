CREATE TABLE public.point_prizes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  points_required integer NOT NULL,
  quantity integer,
  max_redemptions integer,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT point_prizes_positive_values
    CHECK (
      points_required > 0
      AND (quantity IS NULL OR quantity >= 0)
      AND (max_redemptions IS NULL OR max_redemptions > 0)
    )
);

CREATE TABLE public.prize_redemptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  prize_id uuid NOT NULL REFERENCES public.point_prizes(id),
  points_spent integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION public.set_prize_redemption_points()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  prize_points integer;
  prize_quantity integer;
  prize_max_redemptions integer;
  redemption_count integer;
BEGIN
  SELECT points_required, quantity, max_redemptions
  INTO prize_points, prize_quantity, prize_max_redemptions
  FROM public.point_prizes
  WHERE id = NEW.prize_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Point prize not found';
  END IF;

  SELECT count(*)
  INTO redemption_count
  FROM public.prize_redemptions
  WHERE prize_id = NEW.prize_id
    AND (TG_OP = 'INSERT' OR id <> NEW.id);

  IF prize_quantity IS NOT NULL AND redemption_count >= prize_quantity THEN
    RAISE EXCEPTION 'Point prize quantity exhausted';
  END IF;

  IF prize_max_redemptions IS NOT NULL THEN
    SELECT count(*)
    INTO redemption_count
    FROM public.prize_redemptions
    WHERE user_id = NEW.user_id
      AND prize_id = NEW.prize_id
      AND (TG_OP = 'INSERT' OR id <> NEW.id);

    IF redemption_count >= prize_max_redemptions THEN
      RAISE EXCEPTION 'Point prize redemption limit reached';
    END IF;
  END IF;

  NEW.points_spent := prize_points;
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_prize_redemption_points_before_write
BEFORE INSERT OR UPDATE ON public.prize_redemptions
FOR EACH ROW
EXECUTE FUNCTION public.set_prize_redemption_points();

CREATE INDEX prize_redemptions_user_id_idx
  ON public.prize_redemptions(user_id);

CREATE INDEX prize_redemptions_prize_id_idx
  ON public.prize_redemptions(prize_id);

ALTER TABLE public.point_prizes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prize_redemptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY point_prizes_select_active
  ON public.point_prizes
  FOR SELECT TO authenticated
  USING (active OR public.is_admin());

CREATE POLICY point_prizes_manage_admin
  ON public.point_prizes
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY prize_redemptions_select_own
  ON public.prize_redemptions
  FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY prize_redemptions_manage_admin
  ON public.prize_redemptions
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY prize_redemptions_insert_own
  ON public.prize_redemptions
  FOR INSERT TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

GRANT SELECT, INSERT, UPDATE, DELETE ON public.point_prizes TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.prize_redemptions TO authenticated;

INSERT INTO public.point_prizes (name, points_required, quantity, max_redemptions)
VALUES
  ('Stickers (each type)', 250, 150, NULL),
  ('Interview Cake free subscription', 250, NULL, 1),
  ('Rulers', 250, NULL, NULL),
  ('TT Math gift card - $100', 500, 5, 1),
  ('Jiffy gift card', 500, 2, NULL),
  ('Sticker sheet', 500, 75, NULL),
  ('HTS poster', 750, 50, NULL),
  ('O''Reilly book (choose from 9 titles)', 750, 9, NULL),
  ('Siemens pack', 1000, 2, 1),
  ('Egg Farmers pack', 1000, 1, NULL);
