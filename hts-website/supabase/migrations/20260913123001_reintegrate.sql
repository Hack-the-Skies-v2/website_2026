CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
	INSERT INTO public.users (id)
	VALUES (NEW.id);

	RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();

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

ALTER TABLE users
ADD COLUMN hacker BOOLEAN NOT NULL DEFAULT FALSE,
ADD COLUMN points INTEGER NOT NULL DEFAULT 0,
ADD COLUMN rsvp BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE users
ADD CONSTRAINT users_points_non_negative CHECK (points >= 0);

CREATE OR REPLACE FUNCTION public.submit_role_application(
	p_application_type application_type,
	p_email TEXT,
	p_data JSONB
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
	current_user_id UUID := auth.uid();
BEGIN
	IF current_user_id IS NULL THEN
		RAISE EXCEPTION 'You must be signed in to submit an application';
	END IF;

	INSERT INTO public.applications (user_id, application_type, status, email)
	VALUES (current_user_id, p_application_type, 'pending', p_email);

	IF p_application_type = 'judge' THEN
		INSERT INTO public.judge_applications (
			user_id,
			name,
			company_organization,
			job_title,
			linkedin_url,
			industry_field,
			expertise,
			years_of_professional_experience,
			strong_project_description,
			professional_background,
			judging_experience,
			available_for_full_judging_period,
			terms_agreed,
			eligibility_confirm,
			information_confirm,
			participation_confirm
		)
		VALUES (
			current_user_id,
			p_data->>'name',
			p_data->>'companyOrganization',
			p_data->>'jobTitle',
			NULLIF(p_data->>'linkedinUrl', ''),
			p_data->>'industryField',
			ARRAY(SELECT jsonb_array_elements_text(p_data->'areas')),
			p_data->>'yearsOfExperience',
			p_data->>'strongProjectDescription',
			p_data->>'professionalBackground',
			p_data->>'judgingExperience',
			(p_data->>'availableForFullJudgingPeriod')::BOOLEAN,
			(p_data->>'termsAgreed')::BOOLEAN,
			(p_data->>'eligibilityConfirmed')::BOOLEAN,
			(p_data->>'informationConfirmed')::BOOLEAN,
			(p_data->>'participationConfirmed')::BOOLEAN
		);
	ELSIF p_application_type = 'mentor' THEN
		INSERT INTO public.mentor_applications (
			user_id,
			name,
			university_college,
			program_and_year_of_study,
			linkedin_portfolio_github_url,
			mentoring_areas,
			technologies_and_tools,
			mentoring_experience,
			mentoring_goals,
			available_for_full_event,
			times_unavailable,
			terms_agreed,
			eligibility_confirm,
			information_confirm,
			participation_confirm
		)
		VALUES (
			current_user_id,
			p_data->>'name',
			p_data->>'universityCollege',
			p_data->>'programAndYear',
			NULLIF(p_data->>'linkedinPortfolioGithub', ''),
			ARRAY(SELECT jsonb_array_elements_text(p_data->'areas')),
			p_data->>'technologiesAndTools',
			p_data->>'mentoringExperience',
			p_data->>'mentoringGoals',
			(p_data->>'availableForFullEvent')::BOOLEAN,
			NULLIF(p_data->>'timesUnavailable', ''),
			(p_data->>'termsAgreed')::BOOLEAN,
			(p_data->>'eligibilityConfirmed')::BOOLEAN,
			(p_data->>'informationConfirmed')::BOOLEAN,
			(p_data->>'participationConfirmed')::BOOLEAN
		);
	ELSE
		RAISE EXCEPTION 'Unsupported application type';
	END IF;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.submit_role_application(application_type, TEXT, JSONB) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.submit_role_application(application_type, TEXT, JSONB) TO authenticated;