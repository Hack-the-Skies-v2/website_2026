-- Add columns that the current hacker application form collects but were never stored
-- in hacker_applications. These fields exist in draft_hacker_applications already but
-- were missing from the final submissions table and the submit_hacker_application RPC.

ALTER TABLE public.hacker_applications
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

-- Rewrite submit_hacker_application to include all fields the current form collects.
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
    pronouns,
    pronouns_other,
    email,
    teammates,
    dietary_restrictions,
    dietary_other,
    accessibility_accommodations,
    accessibility_other,
    heard_about_hts,
    heard_about_hts_other,
    school_name,
    grade,
    coding_experience,
    goals,
    goals_other,
    want_to_see,
    favourite_song,
    application_questions_1,
    application_questions_2,
    resume_path,
    resume_name,
    linkedin_portfolio,
    github_devpost,
    other_comments,
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
    ARRAY(SELECT sanitize_text(val, 200) FROM jsonb_array_elements_text(COALESCE(p_data->'pronouns', '[]'::JSONB)) AS val),
    sanitize_text(p_data->>'pronounsOther', 500),
    sanitize_text(p_data->>'email', 320),
    ARRAY(SELECT sanitize_text(val, 200) FROM jsonb_array_elements_text(COALESCE(p_data->'teammates', '[]'::JSONB)) AS val),
    ARRAY(SELECT sanitize_text(val, 200) FROM jsonb_array_elements_text(COALESCE(p_data->'dietaryRestrictions', '[]'::JSONB)) AS val),
    sanitize_text(p_data->>'dietaryOther', 500),
    ARRAY(SELECT sanitize_text(val, 200) FROM jsonb_array_elements_text(COALESCE(p_data->'accessibilityAccommodations', '[]'::JSONB)) AS val),
    sanitize_text(p_data->>'accessibilityOther', 500),
    sanitize_text(p_data->>'heardAboutHTS', 200),
    sanitize_text(p_data->>'heardAboutHTSOther', 500),
    sanitize_text(p_data->>'schoolName', 200),
    sanitize_text(p_data->>'grade', 50),
    sanitize_text(p_data->>'codingExperience', 200),
    ARRAY(SELECT sanitize_text(val, 200) FROM jsonb_array_elements_text(COALESCE(p_data->'goals', '[]'::JSONB)) AS val),
    sanitize_text(p_data->>'goalsOther', 500),
    sanitize_text(p_data->>'wantToSee', 1000),
    sanitize_text(p_data->>'favouriteSong', 200),
    sanitize_text(p_data->>'applicationQuestions1', 5000),
    sanitize_text(p_data->>'applicationQuestions2', 5000),
    sanitize_text(p_data->>'resumePath', 300),
    sanitize_text(p_data->>'resumeName', 200),
    sanitize_text(p_data->>'linkedinPortfolio', 500),
    sanitize_text(p_data->>'githubDevpost', 500),
    sanitize_text(p_data->>'otherComments', 2000),
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
