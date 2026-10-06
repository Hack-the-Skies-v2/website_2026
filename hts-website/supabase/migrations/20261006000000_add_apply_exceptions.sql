CREATE TABLE IF NOT EXISTS public.apply_exceptions (
  email TEXT PRIMARY KEY,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT apply_exceptions_email_lowercase CHECK (email = lower(trim(email))),
  CONSTRAINT apply_exceptions_email_valid CHECK (email ~* '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$')
);

ALTER TABLE public.apply_exceptions ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON public.apply_exceptions TO authenticated;

DROP POLICY IF EXISTS select_own_apply_exception ON public.apply_exceptions;
CREATE POLICY select_own_apply_exception
  ON public.apply_exceptions
  FOR SELECT
  TO authenticated
  USING (email = lower(trim(auth.jwt() ->> 'email')));

DROP POLICY IF EXISTS manage_apply_exceptions_admin ON public.apply_exceptions;
CREATE POLICY manage_apply_exceptions_admin
  ON public.apply_exceptions
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE OR REPLACE FUNCTION public.is_apply_exception()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.apply_exceptions
    WHERE email = lower(trim(auth.jwt() ->> 'email'))
      AND is_active = TRUE
  );
$$;

REVOKE EXECUTE ON FUNCTION public.is_apply_exception() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_apply_exception() TO authenticated;
