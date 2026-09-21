-- Migration: Fix applications table primary key to user_id
-- In the core schema, `applications` is 1-to-1 with `users`, keyed on `user_id`.
-- This migration ensures `user_id` exists, is the primary identifier, and provides
-- a generated `id` column for backward compatibility with organizer review queries.

DO $$
BEGIN
  -- 1. If `id` exists but `user_id` does not, rename `id` to `user_id`
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'applications' AND column_name = 'id'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'applications' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE public.applications RENAME COLUMN id TO user_id;
  END IF;

  -- 2. Ensure `user_id` column exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'applications' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE public.applications ADD COLUMN user_id UUID REFERENCES public.users(id) ON DELETE CASCADE;
  END IF;

  -- 3. Ensure `id` column exists (mirroring `user_id`) so organizer queries selecting `id` continue to work
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'applications' AND column_name = 'id'
  ) THEN
    ALTER TABLE public.applications ADD COLUMN id UUID GENERATED ALWAYS AS (user_id) STORED;
  END IF;
END $$;

-- 4. Ensure delete_current_user function properly deletes by user_id
CREATE OR REPLACE FUNCTION public.delete_current_user()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  current_user_id UUID := auth.uid();
BEGIN
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'You must be signed in to delete your account';
  END IF;

  DELETE FROM public.meal_attendance
  WHERE user_id = current_user_id;

  DELETE FROM public.workshop_attendance
  WHERE user_id = current_user_id;

  DELETE FROM public.referrals
  WHERE referrer_user_id = current_user_id
     OR referred_user_id = current_user_id;

  DELETE FROM public.judging_scores
  WHERE judge_id = current_user_id;

  DELETE FROM public.points_transactions
  WHERE affected_user_id = current_user_id
     OR admin_id = current_user_id;

  DELETE FROM public.draft_hacker_applications
  WHERE user_id = current_user_id;

  DELETE FROM public.hacker_applications
  WHERE user_id = current_user_id;

  DELETE FROM public.judge_applications
  WHERE user_id = current_user_id;

  DELETE FROM public.mentor_applications
  WHERE user_id = current_user_id;

  DELETE FROM public.applications
  WHERE user_id = current_user_id;

  DELETE FROM public.users
  WHERE id = current_user_id;

  DELETE FROM auth.users
  WHERE id = current_user_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.delete_current_user() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.delete_current_user() TO authenticated;
