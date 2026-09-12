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
