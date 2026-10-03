CREATE OR REPLACE VIEW public.point_prize_inventory
WITH (security_invoker = true)
AS
SELECT
  p.id,
  p.name,
  p.description,
  p.points_required,
  p.quantity,
  p.max_redemptions,
  p.active,
  p.image_path,
  COUNT(r.id)::integer AS redeemed_quantity,
  CASE
    WHEN p.quantity IS NULL THEN NULL
    ELSE GREATEST(p.quantity - COUNT(r.id)::integer, 0)
  END AS remaining_quantity
FROM public.point_prizes AS p
LEFT JOIN public.prize_redemptions AS r ON r.prize_id = p.id
GROUP BY p.id;
