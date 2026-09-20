-- Graduation year and school city are no longer collected on the hacker form.

ALTER TABLE public.hacker_applications
  ALTER COLUMN graduation_year DROP NOT NULL,
  ALTER COLUMN school_city DROP NOT NULL;
