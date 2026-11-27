-- Sprint 362: public video reads remain available; mutations use audited service-role RPCs only.
drop policy if exists "Admin videos manage" on public.videos;
drop policy if exists "Admins can manage all videos" on public.videos;
create policy "Owners can view videos"
  on public.videos for select to authenticated
  using (public.has_role((select auth.uid()), 'owner'::public.app_role));

drop policy if exists "Admins can manage video associations" on public.video_products;
create policy "Owners can view video associations"
  on public.video_products for select to authenticated
  using (public.has_role((select auth.uid()), 'owner'::public.app_role));

drop policy if exists "Owners can manage bridge videos" on public.bridge_videos;
drop policy if exists "Admins can manage bridge videos" on public.bridge_videos;
create policy "Owners can view bridge videos"
  on public.bridge_videos for select to authenticated
  using (public.has_role((select auth.uid()), 'owner'::public.app_role));

-- Keep the existing public SELECT policies for published/active videos and associations.
revoke all privileges on table
  public.videos,
  public.video_products,
  public.bridge_videos
from public, anon, authenticated;

grant select on table
  public.videos,
  public.video_products,
  public.bridge_videos
to anon, authenticated;

grant all privileges on table
  public.videos,
  public.video_products,
  public.bridge_videos
to service_role;

comment on table public.videos is
  'Video content: Owner and public reads follow RLS; all mutations must use rubi_manage_video_audited.';
comment on table public.video_products is
  'Video associations: Owner and published-video public reads follow RLS; all mutations must use rubi_manage_video_audited.';
comment on table public.bridge_videos is
  'Bridge videos: Owner and active public reads follow RLS; all mutations must use rubi_manage_bridge_video_audited.';
