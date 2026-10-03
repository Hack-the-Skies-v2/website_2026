DROP POLICY schedule_events_select_authorized
  ON public.schedule_events;

CREATE POLICY schedule_events_select_authenticated
  ON public.schedule_events
  FOR SELECT TO authenticated
  USING (true);
