DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN (
    SELECT column_name
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'applications'
      AND is_nullable = 'NO'
      AND column_name NOT IN ('user_id', 'id', 'application_type', 'type')
  ) LOOP
    BEGIN
      EXECUTE format('ALTER TABLE public.applications ALTER COLUMN %I DROP NOT NULL', r.column_name);
      RAISE NOTICE 'Dropped NOT NULL constraint on public.applications.%', r.column_name;
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Could not drop NOT NULL on public.applications.%: %', r.column_name, SQLERRM;
    END;
  END LOOP;
END $$;
