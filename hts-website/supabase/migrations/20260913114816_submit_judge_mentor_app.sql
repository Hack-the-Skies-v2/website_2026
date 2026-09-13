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