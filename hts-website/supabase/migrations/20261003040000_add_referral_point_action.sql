INSERT INTO public.point_actions (name, description, points, max_redemptions)
SELECT
  'Referral',
  'Refer a participant who checks in',
  25,
  NULL
WHERE NOT EXISTS (
  SELECT 1
  FROM public.point_actions
  WHERE name = 'Referral'
);
