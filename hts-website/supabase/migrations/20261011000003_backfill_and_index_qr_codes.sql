-- Existing application users need links once; subsequent users receive one when
-- their application is submitted through ensureQrCodeLink().
UPDATE public.users AS u
SET qr_code_link = 'https://www.hacktheskies.com/check-in?code='
  || replace(gen_random_uuid()::text, '-', '')
WHERE u.qr_code_link IS NULL
  AND EXISTS (
    SELECT 1
    FROM public.applications AS a
    WHERE a.user_id = u.id
  );

WITH duplicates AS (
  SELECT
    id,
    row_number() OVER (PARTITION BY qr_code_link ORDER BY id) AS duplicate_number
  FROM public.users
  WHERE qr_code_link IS NOT NULL
)
UPDATE public.users AS u
SET qr_code_link = 'https://www.hacktheskies.com/check-in?code='
  || replace(gen_random_uuid()::text, '-', '')
FROM duplicates AS d
WHERE u.id = d.id
  AND d.duplicate_number > 1;

CREATE UNIQUE INDEX IF NOT EXISTS users_qr_code_link_unique_idx
  ON public.users (qr_code_link)
  WHERE qr_code_link IS NOT NULL;
