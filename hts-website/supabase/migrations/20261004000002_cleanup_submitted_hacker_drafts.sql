DELETE FROM public.draft_hacker_applications AS drafts
WHERE EXISTS (
  SELECT 1
  FROM public.applications AS submitted
  WHERE submitted.user_id = drafts.user_id
    AND submitted.application_type = 'hacker'
);
