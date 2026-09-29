ALTER TABLE public.hacker_applications
  DROP COLUMN IF EXISTS emergency_contact_name,
  DROP COLUMN IF EXISTS emergency_contact_phone,
  DROP COLUMN IF EXISTS emergency_contact_relationship,
  DROP COLUMN IF EXISTS emergency_contact_relationship_other,
  DROP COLUMN IF EXISTS parent_name,
  DROP COLUMN IF EXISTS parent_email,
  DROP COLUMN IF EXISTS parent_phone;

ALTER TABLE public.draft_hacker_applications
  DROP COLUMN IF EXISTS emergency_contact_name,
  DROP COLUMN IF EXISTS emergency_contact_phone,
  DROP COLUMN IF EXISTS emergency_contact_relationship,
  DROP COLUMN IF EXISTS emergency_contact_relationship_other,
  DROP COLUMN IF EXISTS parent_name,
  DROP COLUMN IF EXISTS parent_email,
  DROP COLUMN IF EXISTS parent_phone;
