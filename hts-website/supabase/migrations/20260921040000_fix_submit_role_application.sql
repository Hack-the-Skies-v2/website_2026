-- Migration: Robust submit_role_application RPC
-- Ensures submit_role_application accepts (TEXT, JSONB) so PostgREST cleanly binds
-- the RPC without enum casting or signature mismatches. Also validates existing applications.

DROP FUNCTION IF EXISTS public.submit_role_application(application_type, TEXT, JSONB);
DROP FUNCTION IF EXISTS public.submit_role_application(application_type, JSONB);
DROP FUNCTION IF EXISTS public.submit_role_application(TEXT, JSONB);

CREATE OR REPLACE FUNCTION public.submit_role_application(
  p_application_type TEXT,
  p_data JSONB
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_user_id UUID := auth.uid();
  v_app_type application_type;
BEGIN
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'You must be signed in to submit an application';
  END IF;

  -- Validate application type
  BEGIN
    v_app_type := lower(trim(p_application_type))::application_type;
  EXCEPTION WHEN OTHERS THEN
    RAISE EXCEPTION 'Invalid application type: %', p_application_type;
  END;

  -- Check if user already submitted an application
  IF EXISTS (SELECT 1 FROM public.applications WHERE user_id = current_user_id) THEN
    RAISE EXCEPTION 'You have already submitted an application'
      USING ERRCODE = '23505';
  END IF;

  -- Insert base application record
  INSERT INTO public.applications (user_id, application_type, status)
  VALUES (current_user_id, v_app_type, 'pending');

  IF v_app_type = 'judge' THEN
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
      COALESCE(p_data->>'name', ''),
      COALESCE(p_data->>'companyOrganization', ''),
      COALESCE(p_data->>'jobTitle', ''),
      NULLIF(trim(COALESCE(p_data->>'linkedinUrl', '')), ''),
      COALESCE(p_data->>'industryField', ''),
      ARRAY(SELECT jsonb_array_elements_text(COALESCE(p_data->'areas', '[]'::JSONB))),
      COALESCE(p_data->>'yearsOfExperience', ''),
      COALESCE(p_data->>'strongProjectDescription', ''),
      COALESCE(p_data->>'professionalBackground', ''),
      COALESCE(p_data->>'judgingExperience', ''),
      CASE WHEN lower(trim(COALESCE(p_data->>'availableForFullJudgingPeriod', ''))) IN ('yes', 'true', '1') THEN TRUE ELSE FALSE END,
      CASE WHEN lower(trim(COALESCE(p_data->>'termsAgreed', ''))) IN ('yes', 'true', '1') THEN TRUE ELSE FALSE END,
      CASE WHEN lower(trim(COALESCE(p_data->>'eligibilityConfirmed', ''))) IN ('yes', 'true', '1') THEN TRUE ELSE FALSE END,
      CASE WHEN lower(trim(COALESCE(p_data->>'informationConfirmed', ''))) IN ('yes', 'true', '1') THEN TRUE ELSE FALSE END,
      CASE WHEN lower(trim(COALESCE(p_data->>'participationConfirmed', ''))) IN ('yes', 'true', '1') THEN TRUE ELSE FALSE END
    );
  ELSIF v_app_type = 'mentor' THEN
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
      COALESCE(p_data->>'name', ''),
      COALESCE(p_data->>'universityCollege', ''),
      COALESCE(p_data->>'programAndYear', ''),
      NULLIF(trim(COALESCE(p_data->>'linkedinPortfolioGithub', '')), ''),
      ARRAY(SELECT jsonb_array_elements_text(COALESCE(p_data->'areas', '[]'::JSONB))),
      COALESCE(p_data->>'technologiesAndTools', ''),
      COALESCE(p_data->>'mentoringExperience', ''),
      COALESCE(p_data->>'mentoringGoals', ''),
      CASE WHEN lower(trim(COALESCE(p_data->>'availableForFullEvent', ''))) IN ('yes', 'true', '1') THEN TRUE ELSE FALSE END,
      NULLIF(trim(COALESCE(p_data->>'timesUnavailable', '')), ''),
      CASE WHEN lower(trim(COALESCE(p_data->>'termsAgreed', ''))) IN ('yes', 'true', '1') THEN TRUE ELSE FALSE END,
      CASE WHEN lower(trim(COALESCE(p_data->>'eligibilityConfirmed', ''))) IN ('yes', 'true', '1') THEN TRUE ELSE FALSE END,
      CASE WHEN lower(trim(COALESCE(p_data->>'informationConfirmed', ''))) IN ('yes', 'true', '1') THEN TRUE ELSE FALSE END,
      CASE WHEN lower(trim(COALESCE(p_data->>'participationConfirmed', ''))) IN ('yes', 'true', '1') THEN TRUE ELSE FALSE END
    );
  ELSE
    RAISE EXCEPTION 'Unsupported application type: %', p_application_type;
  END IF;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.submit_role_application(TEXT, JSONB) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.submit_role_application(TEXT, JSONB) TO authenticated;
