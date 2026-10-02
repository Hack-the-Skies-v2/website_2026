CREATE TABLE public.point_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  points integer NOT NULL,
  max_redemptions integer,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT point_actions_positive_values
    CHECK (points > 0 AND (max_redemptions IS NULL OR max_redemptions > 0))
);

INSERT INTO public.point_actions (name, points, max_redemptions)
VALUES
  ('Check in', 25, 1),
  ('Submit a team form', 25, 1),
  ('Prove HTS Instagram follow', 10, 1),
  ('Prove HTS LinkedIn follow', 10, 1),
  ('Attend a workshop', 75, NULL),
  ('Submit a project', 200, 1),
  ('Participate in an activity', 50, NULL),
  ('Win an activity', 25, NULL),
  ('Participate in aerospace theme', 100, 1),
  ('Talk to a mentor', 50, 3),
  ('Submit 5 photos to the photo form', 50, 1),
  ('Use Backboard.io credits in project', 25, 1),
  ('Get an organizer to sign passport', 25, 4);

CREATE TABLE public.point_redemptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  point_action_id uuid NOT NULL REFERENCES public.point_actions(id),
  points_awarded integer NOT NULL,
  created_by uuid REFERENCES public.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.point_adjustments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  points integer NOT NULL,
  reason text NOT NULL,
  created_by uuid NOT NULL REFERENCES public.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION public.set_point_redemption_points()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  action_points integer;
  action_max_redemptions integer;
  redemption_count integer;
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
    INTO redemption_count
    FROM public.point_redemptions
    WHERE user_id = NEW.user_id
      AND point_action_id = NEW.point_action_id;

    IF redemption_count >= action_max_redemptions THEN
      RAISE EXCEPTION 'Point action redemption limit reached';
    END IF;
  END IF;

  NEW.points_awarded := action_points;
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_point_redemption_points_before_insert
BEFORE INSERT ON public.point_redemptions
FOR EACH ROW
EXECUTE FUNCTION public.set_point_redemption_points();

CREATE INDEX point_redemptions_user_id_idx
  ON public.point_redemptions(user_id);

CREATE INDEX point_redemptions_point_action_id_idx
  ON public.point_redemptions(point_action_id);

CREATE INDEX point_adjustments_user_id_idx
  ON public.point_adjustments(user_id);

ALTER TABLE public.point_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.point_redemptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.point_adjustments ENABLE ROW LEVEL SECURITY;

CREATE POLICY point_actions_select_authenticated
  ON public.point_actions
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY point_redemptions_select_own
  ON public.point_redemptions
  FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY point_redemptions_select_admin
  ON public.point_redemptions
  FOR SELECT TO authenticated
  USING (public.is_admin());

CREATE POLICY point_redemptions_insert_admin
  ON public.point_redemptions
  FOR INSERT TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY point_redemptions_delete_admin
  ON public.point_redemptions
  FOR DELETE TO authenticated
  USING (public.is_admin());

CREATE POLICY point_adjustments_select_own
  ON public.point_adjustments
  FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY point_adjustments_select_admin
  ON public.point_adjustments
  FOR SELECT TO authenticated
  USING (public.is_admin());

CREATE POLICY point_adjustments_insert_admin
  ON public.point_adjustments
  FOR INSERT TO authenticated
  WITH CHECK (public.is_admin());

GRANT SELECT ON public.point_actions TO authenticated;
GRANT SELECT, INSERT, DELETE ON public.point_redemptions TO authenticated;
GRANT SELECT, INSERT ON public.point_adjustments TO authenticated;