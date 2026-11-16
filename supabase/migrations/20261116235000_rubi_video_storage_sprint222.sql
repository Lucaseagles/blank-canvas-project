-- Sprint 222: private video Storage access is Owner-only.
-- The bucket itself is provisioned idempotently through the authenticated server function
-- using the Storage API (never by writing to storage.buckets directly).
drop policy if exists rubi_videos_owner_manage on storage.objects;
create policy rubi_videos_owner_manage
on storage.objects
for all
to authenticated
using (
  bucket_id = 'videos'
  and (storage.foldername(name))[1] = 'owner'
  and (storage.foldername(name))[2] = (select auth.uid())::text
  and public.has_role((select auth.uid()), 'owner'::public.app_role)
)
with check (
  bucket_id = 'videos'
  and (storage.foldername(name))[1] = 'owner'
  and (storage.foldername(name))[2] = (select auth.uid())::text
  and public.has_role((select auth.uid()), 'owner'::public.app_role)
);

-- No anon/public SELECT policy is intentionally created.
-- Published videos are delivered through short-lived signed URLs from the Owner-gated server layer.
