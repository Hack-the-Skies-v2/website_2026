ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS select_own_application ON public.applications;
CREATE POLICY select_own_application
  ON public.applications
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

GRANT SELECT ON public.applications TO authenticated;
