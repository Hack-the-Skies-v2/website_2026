-- Phone, t-shirt, home city, province, and DOB are no longer collected on the hacker form.
-- School city remains required (school_city). Contact city may still be filled from school city by the app.

ALTER TABLE public.hacker_applications
  ALTER COLUMN phone_number DROP NOT NULL,
  ALTER COLUMN date_of_birth DROP NOT NULL,
  ALTER COLUMN t_shirt_size DROP NOT NULL,
  ALTER COLUMN city DROP NOT NULL,
  ALTER COLUMN province DROP NOT NULL;

-- If submit_hacker_application still requires these fields, update its validation to allow nulls
-- for phone_number / date_of_birth / t_shirt_size / province (and city when schoolCity is set).
