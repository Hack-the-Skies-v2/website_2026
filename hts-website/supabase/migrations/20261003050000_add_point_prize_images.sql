ALTER TABLE public.point_prizes
  ADD COLUMN image_path text;

INSERT INTO storage.buckets (id, name, public)
VALUES ('prize-images', 'prize-images', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "admins_read_prize_images"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'prize-images' AND public.is_admin());

CREATE POLICY "admins_insert_prize_images"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'prize-images' AND public.is_admin());

CREATE POLICY "admins_update_prize_images"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'prize-images' AND public.is_admin())
  WITH CHECK (bucket_id = 'prize-images' AND public.is_admin());

CREATE POLICY "admins_delete_prize_images"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'prize-images' AND public.is_admin());
