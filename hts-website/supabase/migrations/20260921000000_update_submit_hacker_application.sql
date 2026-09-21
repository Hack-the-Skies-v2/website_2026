-- Rewrite submit_hacker_application to match the current hacker application form.
-- Old version required fields no longer collected (phone, DOB, t-shirt, city, province,
-- graduation year, school city, parent/emergency contacts, hackathon experience, 5 questions).
-- New version matches what submitHackerApplication.ts actually sends.

DROP FUNCTION IF EXISTS public.submit_hacker_application(JSONB);

CREATE OR REPLACE FUNCTION public.submit_hacker_application(p_data JSONB)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'You must be signed in to submit an application';
  END IF;

  IF EXISTS (SELECT 1 FROM public.applications WHERE user_id = v_user_id) THEN
    RAISE EXCEPTION 'You have already submitted an application'
      USING ERRCODE = '23505';
  END IF;

  INSERT INTO public.applications (user_id, application_type, status)
  VALUES (v_user_id, 'hacker', 'pending');

  INSERT INTO public.hacker_applications (
    user_id,
    first_name,
    last_name,
    preferred_name,
    dietary_restrictions,
    dietary_other,
    accessibility_accommodations,
    accessibility_other,
    school_name,
    grade,
    heard_about_hts,
    heard_about_hts_other,
    application_questions_1,
    application_questions_2,
    application_questions_3,
    application_questions_4,
    application_questions_5,
    eligibility_confirm,
    information_confirm,
    parental_confirm,
    terms_agreed
  )
  VALUES (
    v_user_id,
    sanitize_text(p_data->>'firstName', 200),
    sanitize_text(p_data->>'lastName', 200),
    sanitize_text(p_data->>'preferredName', 200),
    ARRAY(SELECT sanitize_text(val, 200) FROM jsonb_array_elements_text(COALESCE(p_data->'dietaryRestrictions', '[]'::JSONB)) AS val),
    sanitize_text(p_data->>'dietaryOther', 500),
    ARRAY(SELECT sanitize_text(val, 200) FROM jsonb_array_elements_text(COALESCE(p_data->'accessibilityAccommodations', '[]'::JSONB)) AS val),
    sanitize_text(p_data->>'accessibilityOther', 500),
    sanitize_text(p_data->>'schoolName', 200),
    sanitize_text(p_data->>'grade', 50),
    sanitize_text(p_data->>'heardAboutHTS', 200),
    sanitize_text(p_data->>'heardAboutHTSOther', 500),
    sanitize_text(p_data->>'applicationQuestions1', 5000),
    sanitize_text(p_data->>'applicationQuestions2', 5000),
    NULL,
    NULL,
    NULL,
    COALESCE((p_data->>'eligibilityConfirm')::BOOLEAN, FALSE),
    COALESCE((p_data->>'informationConfirm')::BOOLEAN, FALSE),
    COALESCE((p_data->>'parentalConfirm')::BOOLEAN, FALSE),
    COALESCE((p_data->>'termsAgreed')::BOOLEAN, FALSE)
  );

  DELETE FROM public.draft_hacker_applications WHERE user_id = v_user_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.submit_hacker_application(JSONB) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.submit_hacker_application(JSONB) TO authenticated;