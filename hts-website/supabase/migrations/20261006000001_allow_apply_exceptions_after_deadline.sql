CREATE OR REPLACE FUNCTION public.reject_closed_hacker_application()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF now() >= TIMESTAMPTZ '2026-10-06 04:00:00+00'
    AND NOT public.is_apply_exception() THEN
    RAISE EXCEPTION 'Hacker applications are closed'
      USING ERRCODE = 'P0001';
  END IF;

  RETURN NEW;
END;
$$;
