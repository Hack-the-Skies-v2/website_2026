CREATE TABLE public.schedule_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  type text NOT NULL CHECK (type IN ('workshop', 'event', 'meal', 'ceremony', 'check_in', 'other')),
  start_time timestamptz NOT NULL,
  end_time timestamptz NOT NULL,
  location text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT schedule_events_time_order CHECK (end_time > start_time)
);

CREATE TABLE public.schedule_attendance (
  event_id uuid NOT NULL REFERENCES public.schedule_events(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (event_id, user_id)
);

CREATE INDEX schedule_events_start_time_idx
  ON public.schedule_events(start_time);

CREATE INDEX schedule_attendance_user_id_idx
  ON public.schedule_attendance(user_id);

ALTER TABLE public.schedule_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedule_attendance ENABLE ROW LEVEL SECURITY;

CREATE POLICY schedule_events_select_authorized
  ON public.schedule_events FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.users AS u
      WHERE u.id = (SELECT auth.uid())
        AND (u.admin OR u.hacker OR u.judge OR u.mentor)
    )
  );

CREATE POLICY schedule_events_insert_admin
  ON public.schedule_events FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.users AS u
      WHERE u.id = (SELECT auth.uid())
        AND u.admin
    )
  );

CREATE POLICY schedule_events_update_admin
  ON public.schedule_events FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.users AS u
      WHERE u.id = (SELECT auth.uid())
        AND u.admin
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.users AS u
      WHERE u.id = (SELECT auth.uid())
        AND u.admin
    )
  );

CREATE POLICY schedule_events_delete_admin
  ON public.schedule_events FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.users AS u
      WHERE u.id = (SELECT auth.uid())
        AND u.admin
    )
  );

CREATE POLICY schedule_attendance_select_own
  ON public.schedule_attendance FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY schedule_attendance_select_admin
  ON public.schedule_attendance FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.users AS u
      WHERE u.id = (SELECT auth.uid())
        AND u.admin
    )
  );

CREATE POLICY schedule_attendance_insert_admin
  ON public.schedule_attendance FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.users AS u
      WHERE u.id = (SELECT auth.uid())
        AND u.admin
    )
  );

CREATE POLICY schedule_attendance_delete_admin
  ON public.schedule_attendance FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.users AS u
      WHERE u.id = (SELECT auth.uid())
        AND u.admin
    )
  );

GRANT SELECT, INSERT, UPDATE, DELETE ON public.schedule_events TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.schedule_attendance TO authenticated;