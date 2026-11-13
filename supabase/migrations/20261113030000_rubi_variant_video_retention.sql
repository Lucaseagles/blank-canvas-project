-- Aggregate video interest events by explicit RUBI creative association.
-- The client never receives user_id. Counts include signed-in users only.
create or replace function public.rubi_variant_video_retention(
 p_movement_id uuid,p_days integer default 30,p_limit integer default 100
)
returns table(
 variant_id uuid,video_id uuid,video_title text,
 start_users bigint,complete_users bigint
)
language sql stable security invoker set search_path=''
as $$
 select l.variant_id,l.video_id,v.title::text,
  count(distinct e.user_id) filter(where e.event_type='video_start')::bigint as start_users,
  count(distinct e.user_id) filter(where e.event_type='video_complete')::bigint as complete_users
 from public.rubi_variant_video_links l
 join public.rubi_movement_variants cv on cv.id=l.variant_id
 join public.videos v on v.id=l.video_id and v.status='published'
 left join public.analytics_events e
  on e.metadata->>'video_id'=l.video_id::text
  and e.event_type in ('video_start','video_complete')
  and e.user_id is not null
  and e.created_at>=now()-make_interval(days=>greatest(1,least(coalesce(p_days,30),90)))
 where cv.movement_id=p_movement_id and cv.status='review'
 group by l.variant_id,l.video_id,v.title
 order by start_users desc,l.variant_id,l.video_id
 limit greatest(1,least(coalesce(p_limit,100),100));
$$;
revoke all on function public.rubi_variant_video_retention(uuid,integer,integer) from public,anon,authenticated;
grant execute on function public.rubi_variant_video_retention(uuid,integer,integer) to service_role;
comment on function public.rubi_variant_video_retention(uuid,integer,integer) is
 'Master-only server aggregate; unique authenticated users with video_start/complete events, not watch time, retention causality, purchases or advertising performance.';
