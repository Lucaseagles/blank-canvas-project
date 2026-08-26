-- 1/2. SECURITY DEFINER functions callable by anon/authenticated
REVOKE EXECUTE ON FUNCTION public.is_admin() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_personalized_recommendations(uuid, integer, integer) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin() TO service_role;
GRANT EXECUTE ON FUNCTION public.get_personalized_recommendations(uuid, integer, integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO service_role;

-- 3. feed_mix_config: internal tuning params, admins only
DROP POLICY IF EXISTS "Authenticated users can read feed mix config" ON public.feed_mix_config;

-- 4. personalization_weights: internal scoring signals, no anon/authenticated reads
DROP POLICY IF EXISTS "Allow anon read of weights" ON public.personalization_weights;
DROP POLICY IF EXISTS "Allow read of weights" ON public.personalization_weights;
REVOKE SELECT ON public.personalization_weights FROM anon, authenticated;
GRANT ALL ON public.personalization_weights TO service_role;

-- 5. videos storage bucket: restrict reads to published videos / owners
DROP POLICY IF EXISTS "Public can read videos" ON storage.objects;

CREATE POLICY "Published video files are readable"
ON storage.objects
FOR SELECT
TO anon, authenticated
USING (
  bucket_id = 'videos'
  AND EXISTS (
    SELECT 1 FROM public.videos v
    WHERE v.storage_path = storage.objects.name
      AND v.status = 'published'
  )
);

CREATE POLICY "Admins can read all video files"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'videos' AND public.has_role(auth.uid(), 'owner'::public.app_role));