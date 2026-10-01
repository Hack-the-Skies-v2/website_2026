UPDATE public.users
SET qr_code_link = regexp_replace(qr_code_link, '^https?://[^/]+', 'https://www.hacktheskies.com')
WHERE qr_code_link ~ '^https?://[^/]+/check-in\?code=[A-Za-z0-9_-]+$';