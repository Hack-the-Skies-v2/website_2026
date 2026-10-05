CREATE OR REPLACE FUNCTION public.reject_closed_hacker_application()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF now() >= TIMESTAMPTZ '2026-10-06 04:00:00+00' THEN
    RAISE EXCEPTION 'Hacker applications are closed'
      USING ERRCODE = 'P0001';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS reject_closed_hacker_application_trigger
  ON public.applications;

CREATE TRIGGER reject_closed_hacker_application_trigger
BEFORE INSERT ON public.applications
FOR EACH ROW
WHEN (NEW.application_type = 'hacker')
EXECUTE FUNCTION public.reject_closed_hacker_application();
