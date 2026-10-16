-- Keep Auth signups compatible with the current public.users schema.
-- The admin column and legacy organizers table were removed in later migrations,
-- but older trigger definitions can remain in an already-migrated database.

DROP TRIGGER IF EXISTS link_organizer_after_signup ON auth.users;
DROP FUNCTION IF EXISTS public.link_organizer_from_allowlist();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id)
  VALUES (NEW.id)
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;
