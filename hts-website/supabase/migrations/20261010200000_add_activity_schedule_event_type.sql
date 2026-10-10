ALTER TABLE public.schedule_events
  DROP CONSTRAINT IF EXISTS schedule_events_type_check;

ALTER TABLE public.schedule_events
  ADD CONSTRAINT schedule_events_type_check
  CHECK (type IN ('workshop', 'event', 'meal', 'ceremony', 'check_in', 'activity', 'other'));
