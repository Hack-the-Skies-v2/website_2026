-- Add new columns to draft_hacker_applications that the updated form collects.
-- These are the fields introduced by the ApplicationForm rewrite that were not
-- present in the original draft table schema.

ALTER TABLE public.draft_hacker_applications
  ADD COLUMN IF NOT EXISTS pronouns              TEXT[],
  ADD COLUMN IF NOT EXISTS pronouns_other        TEXT,
  ADD COLUMN IF NOT EXISTS email                 TEXT,
  ADD COLUMN IF NOT EXISTS teammates             TEXT[],
  ADD COLUMN IF NOT EXISTS coding_experience     TEXT,
  ADD COLUMN IF NOT EXISTS goals                 TEXT[],
  ADD COLUMN IF NOT EXISTS goals_other           TEXT,
  ADD COLUMN IF NOT EXISTS want_to_see           TEXT,
  ADD COLUMN IF NOT EXISTS favourite_song        TEXT,
  ADD COLUMN IF NOT EXISTS resume_path           TEXT,
  ADD COLUMN IF NOT EXISTS resume_name           TEXT,
  ADD COLUMN IF NOT EXISTS linkedin_portfolio    TEXT,
  ADD COLUMN IF NOT EXISTS github_devpost        TEXT,
  ADD COLUMN IF NOT EXISTS other_comments        TEXT;