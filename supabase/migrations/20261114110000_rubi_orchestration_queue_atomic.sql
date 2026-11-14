-- Sprint 203: avoid duplicate concurrent orchestration publishing and ensure audit atomicity.
create or replace function public.rubi_queue_orchestration_video_audited(
 p_orchestration_id uuid, p_video_id uuid, p_scheduled_for timestamptz, p_actor uuid
) returns text language plpgsql security invoker set search_path=''
as $fn$
declare
 v_campaign uuid;
 v_title text;
 v_id uuid;
begin
 if p_actor is null or not exists (
  select 1 from public.user_roles r where r.user_id=p_actor and r.role='owner'
 ) then raise exception 'Owner authorization required'; end if;
 if p_orchestration_id is null or p_video_id is null then
  raise exception 'Orchestration and video are required'; end if;
 -- Serialize concurrent queue attempts for the same orchestration/video.
 perform pg_catalog.pg_advisory_xact_lock(
  pg_catalog.hashtextextended(p_orchestration_id::text || ':' || p_video_id::text, 0)
 );
 if not exists (
  select 1 from public.strategy_orchestrations o
  where o.id=p_orchestration_id and o.status='approved'
 ) then raise exception 'Orchestration must be approved'; end if;
 if not exists (
  select 1 from public.strategy_orchestration_videos ov
  where ov.orchestration_id=p_orchestration_id and ov.video_id=p_video_id
 ) then raise exception 'Video is not linked to orchestration'; end if;
 select v.campaign_id,v.title into v_campaign,v_title
 from public.videos v where v.id=p_video_id;
 if not found or v_campaign is null then raise exception 'Video or campaign not found'; end if;
 if not exists (
  select 1 from public.campaign_channels cc
  where cc.campaign_id=v_campaign and cc.channel='telegram' and cc.is_enabled=true
 ) then raise exception 'Telegram is not enabled for this campaign'; end if;
 if exists (
  select 1 from public.scheduled_posts sp
  where sp.orchestration_id=p_orchestration_id and sp.content_id=p_video_id
    and sp.channels @> array['telegram']::text[]
    and sp.status in ('pending','processing','published')
 ) then return 'already_queued'; end if;
 if p_scheduled_for is null or p_scheduled_for<=now() then
  raise exception 'Schedule must be in the future'; end if;
 insert into public.scheduled_posts (
  content_type,content_id,channels,scheduled_for,status,message_template,
  created_by,campaign_id,orchestration_id
 ) values (
  'video',p_video_id,array['telegram']::text[],p_scheduled_for,'pending',
  left('Novo vídeo: ' || coalesce(nullif(btrim(v_title),''),'Novo vídeo disponível.'),4000),
  p_actor,v_campaign,p_orchestration_id
 ) returning id into v_id;
 insert into public.admin_audit_log (
  actor_user_id,actor_email,action_type,entity_type,entity_id,previous_value,new_value
 ) values (
  p_actor,null,'RUBI_ORCHESTRATION_POST_QUEUED','scheduled_post',v_id,'{}'::jsonb,
  jsonb_build_object('status','pending','orchestration_id',p_orchestration_id,
   'content_id',p_video_id,'channels',jsonb_build_array('telegram'))
 );
 return 'queued';
end;
$fn$;
revoke all on function public.rubi_queue_orchestration_video_audited(uuid,uuid,timestamptz,uuid)
 from public,anon,authenticated;
grant execute on function public.rubi_queue_orchestration_video_audited(uuid,uuid,timestamptz,uuid)
 to service_role;
