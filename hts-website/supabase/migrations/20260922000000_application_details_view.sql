CREATE OR REPLACE VIEW public.application_details_view
WITH (security_invoker = true)
AS
SELECT
  a.user_id,
  a.user_id                                                              AS id,
  a.application_type::text                                              AS type,
  a.status::text                                                        AS status,
  au.email                                                              AS email,
  a.submitted_at,
  a.decided_at,
  a.notification_sent_at,
  a.notification_error,

  CASE a.application_type
    WHEN 'hacker' THEN h.first_name
    WHEN 'judge'  THEN split_part(coalesce(j.name, ''), ' ', 1)
    WHEN 'mentor' THEN split_part(coalesce(m.name, ''), ' ', 1)
    ELSE NULL
  END                                                                    AS first_name,

  CASE a.application_type
    WHEN 'hacker' THEN h.last_name
    WHEN 'judge'  THEN
      CASE WHEN position(' ' IN coalesce(j.name, '')) > 0
        THEN ltrim(substring(coalesce(j.name, '') FROM position(' ' IN coalesce(j.name, '')) + 1))
        ELSE ''
      END
    WHEN 'mentor' THEN
      CASE WHEN position(' ' IN coalesce(m.name, '')) > 0
        THEN ltrim(substring(coalesce(m.name, '') FROM position(' ' IN coalesce(m.name, '')) + 1))
        ELSE ''
      END
    ELSE NULL
  END                                                                    AS last_name,

  CASE a.application_type
    WHEN 'hacker' THEN h.school_name
    WHEN 'judge'  THEN
      CASE
        WHEN coalesce(j.company_organization, '') <> '' AND coalesce(j.job_title, '') <> ''
          THEN j.company_organization || ' · ' || j.job_title
        WHEN coalesce(j.company_organization, '') <> '' THEN j.company_organization
        ELSE j.job_title
      END
    WHEN 'mentor' THEN m.university_college
    ELSE NULL
  END                                                                    AS school_or_organization,

  NULL::text                                                             AS details,
  NULL::jsonb                                                            AS answers

FROM public.applications a
JOIN auth.users au ON au.id = a.user_id
LEFT JOIN public.hacker_applications h  ON h.user_id  = a.user_id AND a.application_type = 'hacker'
LEFT JOIN public.judge_applications  j  ON j.user_id  = a.user_id AND a.application_type = 'judge'
LEFT JOIN public.mentor_applications m  ON m.user_id  = a.user_id AND a.application_type = 'mentor';

GRANT SELECT ON public.application_details_view TO authenticated;
GRANT SELECT ON public.application_details_view TO service_role;

