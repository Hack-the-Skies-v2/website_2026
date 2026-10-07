ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS application_status TEXT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'users_application_status_check'
      AND conrelid = 'public.users'::regclass
  ) THEN
    ALTER TABLE public.users
      ADD CONSTRAINT users_application_status_check
      CHECK (application_status IS NULL OR application_status IN ('accepted', 'rejected'));
  END IF;
END
$$;

UPDATE public.users u
SET application_status = CASE
  WHEN a.status::text IN ('accepted', 'rejected') THEN a.status::text
  ELSE NULL
END
FROM public.applications a
WHERE a.user_id = u.id;

CREATE OR REPLACE FUNCTION public.sync_user_application_status()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.users
  SET application_status = CASE
    WHEN NEW.status::text IN ('accepted', 'rejected') THEN NEW.status::text
    ELSE NULL
  END
  WHERE id = NEW.user_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS sync_user_application_status ON public.applications;
CREATE TRIGGER sync_user_application_status
AFTER INSERT OR UPDATE OF status ON public.applications
FOR EACH ROW
EXECUTE FUNCTION public.sync_user_application_status();
