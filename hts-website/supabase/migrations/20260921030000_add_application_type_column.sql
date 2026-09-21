-- Migration: Ensure application_type exists on public.applications
-- Restores application_type (enum: 'hacker', 'judge', 'mentor') and keeps it
-- synchronized with the organizer review console's 'type' field.

DO $$
BEGIN
  -- 1. Ensure the application_type ENUM exists
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'application_type') THEN
    CREATE TYPE application_type AS ENUM ('hacker', 'judge', 'mentor');
  END IF;

  -- 2. Add application_type column to public.applications if not present
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'applications' AND column_name = 'application_type'
  ) THEN
    ALTER TABLE public.applications ADD COLUMN application_type application_type;

    -- If the table had a 'type' column, backfill application_type from it
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = 'applications' AND column_name = 'type'
    ) THEN
      BEGIN
        EXECUTE 'UPDATE public.applications SET application_type = lower(type)::application_type WHERE application_type IS NULL AND type IS NOT NULL';
      EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Could not backfill application_type from type: %', SQLERRM;
      END;
    END IF;
  END IF;

  -- 3. If 'type' column does not exist at all, add it as a generated column mirroring application_type
  -- so organizer console queries selecting 'type' succeed automatically
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'applications' AND column_name = 'type'
  ) THEN
    ALTER TABLE public.applications ADD COLUMN type TEXT GENERATED ALWAYS AS (application_type::text) STORED;
  END IF;
END $$;

-- 4. If 'type' is a regular column (not generated), create a trigger to keep application_type and type in sync
DO $$
DECLARE
  v_is_generated BOOLEAN;
BEGIN
  SELECT (is_generated = 'ALWAYS') INTO v_is_generated
  FROM information_schema.columns
  WHERE table_schema = 'public' AND table_name = 'applications' AND column_name = 'type';

  IF v_is_generated IS FALSE THEN
    -- Sync function
    EXECUTE $func$
      CREATE OR REPLACE FUNCTION public.sync_application_type_columns()
      RETURNS TRIGGER
      LANGUAGE plpgsql
      AS $trig$
      BEGIN
        IF NEW.application_type IS NOT NULL AND (NEW.type IS NULL OR NEW.type = '') THEN
          NEW.type := NEW.application_type::text;
        ELSIF NEW.type IS NOT NULL AND NEW.application_type IS NULL THEN
          BEGIN
            NEW.application_type := lower(NEW.type)::application_type;
          EXCEPTION WHEN OTHERS THEN
            -- Ignore invalid cast
          END;
        END IF;
        RETURN NEW;
      END;
      $trig$;
    $func$;

    DROP TRIGGER IF EXISTS trg_sync_application_type ON public.applications;
    CREATE TRIGGER trg_sync_application_type
      BEFORE INSERT OR UPDATE ON public.applications
      FOR EACH ROW
      EXECUTE FUNCTION public.sync_application_type_columns();
  END IF;
END $$;
