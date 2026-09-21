-- Migration: Drop legacy applications_type_check constraint
-- The application_type ENUM ('hacker', 'judge', 'mentor') already enforces valid values.
-- The legacy CHECK constraint on `type` causes case-sensitivity and insertion failures.

ALTER TABLE public.applications
  DROP CONSTRAINT IF EXISTS applications_type_check;
