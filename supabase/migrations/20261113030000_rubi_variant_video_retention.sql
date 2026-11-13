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
 with eligible as (
  select l.variant_id,l.video_id,v.title
  from public.rubi_variant_video_links l
  join public.rubi_movement_variants cv on cv.id=l.variant_id
  join public.videos v on v.id=l.video_id and v.status='published'
  where cv.movement_id=p_movement_id and cv.status='review'
 ), event_users as (
  select e.metadata->>'video_id' as video_key,e.user_id,
   bool_or(e.event_type='video_start') as started,
   bool_or(e.event_type='video_complete') as completed
  from public.analytics_events e
  where e.user_id is not null
   and e.event_type in ('video_start','video_complete')
   and e.created_at>=now()-make_interval(days=>greatest(1,least(coalesce(p_days,30),90)))
   and exists(select 1 from eligible x where x.video_id::text=e.metadata->>'video_id')
  group by e.metadata->>'video_id',e.user_id
 )
 select l.variant_id,l.video_id,l.title::text,
  count(u.user_id) filter(where u.started)::bigint as start_users,
  count(u.user_id) filter(where u.started and u.completed)::bigint as complete_users
 from eligible l
 left join event_users u on u.video_key=l.video_id::text
 group by l.variant_id,l.video_id,l.title
 order by start_users desc,l.variant_id,l.video_id
 limit greatest(1,least(coalesce(p_limit,100),100));
$$;
revoke all on function public.rubi_variant_video_retention(uuid,integer,integer) from public,anon,authenticated;
grant execute on function public.rubi_variant_video_retention(uuid,integer,integer) to service_role;
comment on function public.rubi_variant_video_retention(uuid,integer,integer) is
 'Master-only server aggregate; unique authenticated starters who also completed within the window, not watch time, retention causality, purchases or advertising performance.';
