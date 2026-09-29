-- Let organizers open applicant resumes. Does not change application tables or submit functions.

DROP POLICY IF EXISTS "admins_read_resumes" ON storage.objects;
CREATE POLICY "admins_read_resumes"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'resumes' AND public.is_admin());
