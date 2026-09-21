-- Organizer review: grades table for live applications schema.
-- Live applications PK is `id` (not user_id). Decision columns may already exist.

ALTER TABLE public.applications
  ADD COLUMN IF NOT EXISTS submitted_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS decided_at timestamptz,
  ADD COLUMN IF NOT EXISTS notification_sent_at timestamptz,
  ADD COLUMN IF NOT EXISTS notification_error text;

CREATE TABLE IF NOT EXISTS public.application_grades (
  application_user_id uuid NOT NULL REFERENCES public.applications(user_id) ON DELETE CASCADE,
  grader_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  scores jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (application_user_id, grader_id)
);

ALTER TABLE public.application_grades ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admins_read_application_grades" ON public.application_grades;
CREATE POLICY "admins_read_application_grades"
  ON public.application_grades FOR SELECT TO authenticated
  USING ((SELECT public.is_admin()));

DROP POLICY IF EXISTS "admins_insert_own_application_grades" ON public.application_grades;
CREATE POLICY "admins_insert_own_application_grades"
  ON public.application_grades FOR INSERT TO authenticated
  WITH CHECK (
    grader_id = (SELECT auth.uid())
    AND (SELECT public.is_admin())
  );

DROP POLICY IF EXISTS "admins_update_own_application_grades" ON public.application_grades;
CREATE POLICY "admins_update_own_application_grades"
  ON public.application_grades FOR UPDATE TO authenticated
  USING (
    grader_id = (SELECT auth.uid())
    AND (SELECT public.is_admin())
  )
  WITH CHECK (
    grader_id = (SELECT auth.uid())
    AND (SELECT public.is_admin())
  );

DROP POLICY IF EXISTS "admins_delete_own_application_grades" ON public.application_grades;
CREATE POLICY "admins_delete_own_application_grades"
  ON public.application_grades FOR DELETE TO authenticated
  USING (
    grader_id = (SELECT auth.uid())
    AND (SELECT public.is_admin())
  );

CREATE INDEX IF NOT EXISTS application_grades_application_user_id_idx
  ON public.application_grades (application_user_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.application_grades TO authenticated;
