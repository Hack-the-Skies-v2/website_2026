ALTER TABLE public.point_adjustments
  ALTER COLUMN created_by DROP NOT NULL;

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

  UPDATE public.point_earnings
  SET created_by = NULL
  WHERE created_by = current_user_id;

  UPDATE public.point_adjustments
  SET created_by = NULL
  WHERE created_by = current_user_id;

  DELETE FROM public.point_earnings
  WHERE user_id = current_user_id;

  DELETE FROM public.point_adjustments
  WHERE user_id = current_user_id;

  DELETE FROM public.referrals
  WHERE referrer_user_id = current_user_id
     OR referred_user_id = current_user_id;

  DELETE FROM public.judging_scores
  WHERE judge_id = current_user_id;

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
