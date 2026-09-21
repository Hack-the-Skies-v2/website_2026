-- Emergency and parent contact information is no longer collected on the hacker application form.
-- Drop all emergency contact and parent contact columns from hacker_applications and draft_hacker_applications.

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
