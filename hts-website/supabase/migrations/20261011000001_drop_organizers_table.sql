-- The organizer console uses organizer_allowlist and does not depend on this
-- legacy table. CASCADE also removes any stale policies or constraints attached
-- to the table if it exists outside the migration history.
DROP TABLE IF EXISTS public.organizers CASCADE;
