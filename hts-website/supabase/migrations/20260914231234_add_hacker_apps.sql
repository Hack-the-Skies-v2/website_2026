
CREATE OR REPLACE FUNCTION public.sanitize_text(val TEXT, max_len INTEGER DEFAULT 2000)
RETURNS TEXT
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT left(trim(regexp_replace(COALESCE(val, ''), '<[^>]*>', '', 'g')), max_len);
$$;

CREATE TABLE public.draft_hacker_applications (
  user_id                              UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  first_name                           TEXT,
  last_name                            TEXT,
  preferred_name                       TEXT,
  phone_number                         TEXT,
  date_of_birth                        DATE,
  t_shirt_size                         TEXT,
  city                                 TEXT,
  province                             TEXT,
  dietary_restrictions                  TEXT[],
  dietary_other                        TEXT,
  accessibility_accommodations          TEXT[],
  accessibility_other                  TEXT,
  school_name                          TEXT,
  grade                                TEXT,
  graduation_year                      TEXT,
  school_city                          TEXT,
  parent_name                          TEXT,
  parent_email                         TEXT,
  parent_phone                         TEXT,
  emergency_contact_name               TEXT,
  emergency_contact_phone              TEXT,
  emergency_contact_relationship       TEXT,
  emergency_contact_relationship_other TEXT,
  hackathon_experience                 TEXT,
  heard_about_hts                      TEXT,
  heard_about_hts_other                TEXT,
  application_questions_1              TEXT,
  application_questions_2              TEXT,
  application_questions_3              TEXT,
  application_questions_4              TEXT,
  application_questions_5              TEXT,
  eligibility_confirm                  BOOLEAN,
  information_confirm                  BOOLEAN,
  parental_confirm                     BOOLEAN,
  terms_agreed                         BOOLEAN,
  updated_at                           TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.draft_hacker_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY select_own_draft_hacker_app ON public.draft_hacker_applications
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY insert_own_draft_hacker_app ON public.draft_hacker_applications
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY update_own_draft_hacker_app ON public.draft_hacker_applications
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY delete_own_draft_hacker_app ON public.draft_hacker_applications
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY manage_draft_hacker_app_admin ON public.draft_hacker_applications
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

GRANT SELECT, INSERT, UPDATE, DELETE ON public.draft_hacker_applications TO authenticated;

CREATE OR REPLACE FUNCTION public.submit_hacker_application(p_data JSONB)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_user_id UUID := auth.uid();
  v_first_name                           TEXT;
  v_last_name                            TEXT;
  v_preferred_name                       TEXT;
  v_phone_number                         TEXT;
  v_date_of_birth                        DATE;
  v_t_shirt_size                         TEXT;
  v_city                                 TEXT;
  v_province                             TEXT;
  v_dietary_restrictions                  TEXT[];
  v_dietary_other                        TEXT;
  v_accessibility_accommodations          TEXT[];
  v_accessibility_other                  TEXT;
  v_school_name                          TEXT;
  v_grade                                TEXT;
  v_graduation_year                      TEXT;
  v_school_city                          TEXT;
  v_parent_name                          TEXT;
  v_parent_email                         TEXT;
  v_parent_phone                         TEXT;
  v_emergency_contact_name               TEXT;
  v_emergency_contact_phone              TEXT;
  v_emergency_contact_relationship       TEXT;
  v_emergency_contact_relationship_other TEXT;
  v_hackathon_experience                 TEXT;
  v_heard_about_hts                      TEXT;
  v_heard_about_hts_other                TEXT;
  v_application_questions_1              TEXT;
  v_application_questions_2              TEXT;
  v_application_questions_3              TEXT;
  v_application_questions_4              TEXT;
  v_application_questions_5              TEXT;
  v_eligibility_confirm                  BOOLEAN;
  v_information_confirm                  BOOLEAN;
  v_parental_confirm                     BOOLEAN;
  v_terms_agreed                         BOOLEAN;
BEGIN
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'You must be signed in to submit an application';
  END IF;

  IF EXISTS (SELECT 1 FROM public.applications WHERE user_id = current_user_id) THEN
    RAISE EXCEPTION 'You have already submitted an application'
      USING ERRCODE = '23505';
  END IF;

  v_first_name                           := sanitize_text(p_data->>'firstName', 200);
  v_last_name                            := sanitize_text(p_data->>'lastName', 200);
  v_preferred_name                       := sanitize_text(p_data->>'preferredName', 200);
  v_phone_number                         := sanitize_text(p_data->>'phoneNumber', 50);
  v_date_of_birth                        := (p_data->>'dateOfBirth')::DATE;
  v_t_shirt_size                         := sanitize_text(p_data->>'tShirtSize', 20);
  v_city                                 := sanitize_text(p_data->>'city', 200);
  v_province                             := sanitize_text(p_data->>'province', 200);
  v_dietary_restrictions                  := ARRAY(SELECT sanitize_text(val, 200) FROM jsonb_array_elements_text(COALESCE(p_data->'dietaryRestrictions', '[]'::JSONB)) AS val);
  v_dietary_other                        := sanitize_text(p_data->>'dietaryOther', 500);
  v_accessibility_accommodations          := ARRAY(SELECT sanitize_text(val, 200) FROM jsonb_array_elements_text(COALESCE(p_data->'accessibilityAccommodations', '[]'::JSONB)) AS val);
  v_accessibility_other                  := sanitize_text(p_data->>'accessibilityOther', 500);
  v_school_name                          := sanitize_text(p_data->>'schoolName', 200);
  v_grade                                := sanitize_text(p_data->>'grade', 50);
  v_graduation_year                      := sanitize_text(p_data->>'graduationYear', 10);
  v_school_city                          := sanitize_text(p_data->>'schoolCity', 200);
  v_parent_name                          := sanitize_text(p_data->>'parentName', 200);
  v_parent_email                         := sanitize_text(p_data->>'parentEmail', 320);
  v_parent_phone                         := sanitize_text(p_data->>'parentPhone', 50);
  v_emergency_contact_name               := sanitize_text(p_data->>'emergencyContactName', 200);
  v_emergency_contact_phone              := sanitize_text(p_data->>'emergencyContactPhone', 50);
  v_emergency_contact_relationship       := sanitize_text(p_data->>'emergencyContactRelationship', 200);
  v_emergency_contact_relationship_other := sanitize_text(p_data->>'emergencyContactRelationshipOther', 500);
  v_hackathon_experience                 := sanitize_text(p_data->>'hackathonExperience', 200);
  v_heard_about_hts                      := sanitize_text(p_data->>'heardAboutHTS', 200);
  v_heard_about_hts_other                := sanitize_text(p_data->>'heardAboutHTSOther', 500);
  v_application_questions_1              := sanitize_text(p_data->>'applicationQuestions1', 5000);
  v_application_questions_2              := sanitize_text(p_data->>'applicationQuestions2', 5000);
  v_application_questions_3              := sanitize_text(p_data->>'applicationQuestions3', 5000);
  v_application_questions_4              := sanitize_text(p_data->>'applicationQuestions4', 5000);
  v_application_questions_5              := sanitize_text(p_data->>'applicationQuestions5', 5000);
  v_eligibility_confirm                  := COALESCE((p_data->>'eligibilityConfirm')::BOOLEAN, FALSE);
  v_information_confirm                  := COALESCE((p_data->>'informationConfirm')::BOOLEAN, FALSE);
  v_parental_confirm                     := COALESCE((p_data->>'parentalConfirm')::BOOLEAN, FALSE);
  v_terms_agreed                         := COALESCE((p_data->>'termsAgreed')::BOOLEAN, FALSE);

  IF v_first_name = '' OR v_last_name = '' OR v_phone_number = '' OR v_date_of_birth IS NULL
     OR v_t_shirt_size = '' OR v_city = '' OR v_province = ''
     OR v_school_name = '' OR v_grade = '' OR v_graduation_year = '' OR v_school_city = ''
     OR v_parent_name = '' OR v_parent_email = '' OR v_parent_phone = ''
     OR v_emergency_contact_name = '' OR v_emergency_contact_phone = ''
     OR v_emergency_contact_relationship = ''
     OR v_hackathon_experience = '' OR v_heard_about_hts = ''
     OR v_application_questions_1 = '' OR v_application_questions_2 = ''
     OR v_application_questions_3 = '' OR v_application_questions_4 = ''
     OR v_application_questions_5 = ''
  THEN
    RAISE EXCEPTION 'All required fields must be filled out';
  END IF;

  IF NOT (v_eligibility_confirm AND v_information_confirm AND v_parental_confirm AND v_terms_agreed) THEN
    RAISE EXCEPTION 'All confirmations must be agreed to';
  END IF;

  INSERT INTO public.applications (user_id, application_type, status)
  VALUES (current_user_id, 'hacker', 'pending');

  INSERT INTO public.hacker_applications (
    user_id,
    first_name, last_name, preferred_name, phone_number, date_of_birth,
    t_shirt_size, city, province,
    dietary_restrictions, dietary_other,
    accessibility_accommodations, accessibility_other,
    school_name, grade, graduation_year, school_city,
    parent_name, parent_email, parent_phone,
    emergency_contact_name, emergency_contact_phone,
    emergency_contact_relationship, emergency_contact_relationship_other,
    hackathon_experience, heard_about_hts, heard_about_hts_other,
    application_questions_1, application_questions_2, application_questions_3,
    application_questions_4, application_questions_5,
    eligibility_confirm, information_confirm, parental_confirm, terms_agreed
  )
  VALUES (
    current_user_id,
    v_first_name, v_last_name, v_preferred_name, v_phone_number, v_date_of_birth,
    v_t_shirt_size, v_city, v_province,
    v_dietary_restrictions, v_dietary_other,
    v_accessibility_accommodations, v_accessibility_other,
    v_school_name, v_grade, v_graduation_year, v_school_city,
    v_parent_name, v_parent_email, v_parent_phone,
    v_emergency_contact_name, v_emergency_contact_phone,
    v_emergency_contact_relationship, v_emergency_contact_relationship_other,
    v_hackathon_experience, v_heard_about_hts, v_heard_about_hts_other,
    v_application_questions_1, v_application_questions_2, v_application_questions_3,
    v_application_questions_4, v_application_questions_5,
    v_eligibility_confirm, v_information_confirm, v_parental_confirm, v_terms_agreed
  );

  DELETE FROM public.draft_hacker_applications WHERE user_id = current_user_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.submit_hacker_application(JSONB) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.submit_hacker_application(JSONB) TO authenticated;

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
