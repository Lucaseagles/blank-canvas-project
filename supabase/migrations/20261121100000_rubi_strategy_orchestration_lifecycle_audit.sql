-- Sprint 304: make every strategy-orchestration lifecycle mutation
-- service-role compatible, Owner-verified, serialized and atomically audited.
-- The server middleware supplies p_actor from the authenticated request;
-- auth.uid() is intentionally not used by service-role RPC calls.

drop function if exists public.create_strategy_orchestration(text,text,integer,text,uuid[]);
drop function if exists public.create_strategy_orchestration(text,text,integer,text,uuid[],uuid[]);
drop function if exists public.generate_strategy_orchestration_plan(uuid);
drop function if exists public.approve_strategy_orchestration(uuid);

create function public.create_strategy_orchestration(
  p_name text,
  p_objective text,
  p_priority integer,
  p_notes text,
  p_strategy_ids uuid[],
  p_video_ids uuid[],
  p_actor uuid
) returns uuid
language plpgsql security invoker set search_path=''
as $fn$
declare v_id uuid;
begin
  if p_actor is null or not exists (
    select 1 from public.user_roles r where r.user_id=p_actor and r.role='owner'
  ) then raise exception 'Owner authorization required'; end if;
  if char_length(trim(p_name)) < 2 or char_length(trim(p_name)) > 160 then
    raise exception 'invalid name';
  end if;
  if p_objective not in ('traffic','engagement','followers','conversion','awareness') then
    raise exception 'invalid objective';
  end if;

  insert into public.strategy_orchestrations(name,objective,priority,notes,created_by)
  values(trim(p_name),p_objective,greatest(0,least(100,coalesce(p_priority,50))),nullif(trim(p_notes),''),p_actor)
  returning id into v_id;

  insert into public.strategy_orchestration_items(orchestration_id,strategy_id,position)
  select v_id,x.strategy_id,x.position
  from unnest(coalesce(p_strategy_ids,'{}'::uuid[])) with ordinality as x(strategy_id,position)
  join public.social_channel_strategies s on s.id=x.strategy_id and s.is_active=true;

  insert into public.strategy_orchestration_videos(orchestration_id,video_id,position)
  select v_id,x.video_id,x.position
  from unnest(coalesce(p_video_ids,'{}'::uuid[])) with ordinality as x(video_id,position)
  join public.videos v on v.id=x.video_id;

  insert into public.admin_audit_log(actor_user_id,actor_email,action_type,entity_type,entity_id,previous_value,new_value)
  values(p_actor,null,'RUBI_STRATEGY_ORCHESTRATION_CREATED','strategy_orchestration',v_id,
    jsonb_build_object('created',false),
    jsonb_build_object('created',true,'objective',p_objective,'priority',greatest(0,least(100,coalesce(p_priority,50))),
      'strategy_count',(select count(*) from public.strategy_orchestration_items where orchestration_id=v_id),
      'video_count',(select count(*) from public.strategy_orchestration_videos where orchestration_id=v_id)));
  return v_id;
end;
$fn$;
revoke all on function public.create_strategy_orchestration(text,text,integer,text,uuid[],uuid[],uuid[]) from public,anon,authenticated;
grant execute on function public.create_strategy_orchestration(text,text,integer,text,uuid[],uuid[],uuid[]) to service_role;

create function public.generate_strategy_orchestration_plan(p_orchestration_id uuid,p_actor uuid)
returns jsonb language plpgsql security invoker set search_path=''
as $fn$
declare
  result jsonb;
  before_status text;
  after_status text;
begin
  if p_actor is null or not exists (
    select 1 from public.user_roles r where r.user_id=p_actor and r.role='owner'
  ) then raise exception 'Owner authorization required'; end if;

  select o.status into before_status
  from public.strategy_orchestrations o where o.id=p_orchestration_id for update;
  if not found then raise exception 'Orchestration not found'; end if;

  with selected as (
    select s.id,s.name,s.objective,s.posting_frequency_per_week,s.cta,s.content_pillars,
      s.preferred_formats,s.priority,s.audience_segment,ch.id as channel_id,ch.channel_name,ch.platform,
      c.name as category_name,cc.title as collection_title,ca.name as campaign_name
    from public.strategy_orchestration_items oi
    join public.social_channel_strategies s on s.id=oi.strategy_id
    join public.social_channels ch on ch.id=s.channel_id
    left join public.categories c on c.id=s.category_id
    left join public.curated_collections cc on cc.id=s.collection_id
    left join public.campaigns ca on ca.id=s.campaign_id
    where oi.orchestration_id=p_orchestration_id and s.is_active=true
    order by oi.position,s.priority desc
  ), selected_videos as (
    select v.id,v.title,v.video_url,v.external_url,v.thumbnail_url,v.platform
    from public.strategy_orchestration_videos ov
    join public.videos v on v.id=ov.video_id
    where ov.orchestration_id=p_orchestration_id
    order by ov.position
  )
  select jsonb_build_object(
    'generated_at',now(),
    'strategy_count',(select count(*) from selected),
    'video_count',(select count(*) from selected_videos),
    'channels',coalesce((select jsonb_agg(distinct jsonb_build_object('id',channel_id,'platform',platform,'name',channel_name)) from selected where channel_id is not null),'[]'::jsonb),
    'strategies',coalesce((select jsonb_agg(jsonb_build_object('id',id,'name',name,'objective',objective,'channel',channel_name,'platform',platform,'category',category_name,'collection',collection_title,'campaign',campaign_name,'segment',audience_segment,'frequency_per_week',posting_frequency_per_week,'content_pillars',content_pillars,'preferred_formats',preferred_formats,'cta',cta,'priority',priority)) from selected),'[]'::jsonb),
    'videos',coalesce((select jsonb_agg(jsonb_build_object('id',id,'title',title,'video_url',video_url,'external_url',external_url,'thumbnail_url',thumbnail_url,'platform',platform)) from selected_videos),'[]'::jsonb),
    'execution',jsonb_build_object('publishing','Use existing scheduled_posts / publishing engine','campaigns','Use linked existing campaigns','automation','Use existing automation_rules; no new automation engine','approval_required',true)
  ) into result;

  update public.strategy_orchestrations
  set plan=result,status=case when jsonb_array_length(result->'strategies')>0 then 'ready' else 'draft' end,updated_at=now()
  where id=p_orchestration_id returning status into after_status;

  insert into public.admin_audit_log(actor_user_id,actor_email,action_type,entity_type,entity_id,previous_value,new_value)
  values(p_actor,null,'RUBI_STRATEGY_ORCHESTRATION_PLAN_GENERATED','strategy_orchestration',p_orchestration_id,
    jsonb_build_object('status',before_status),
    jsonb_build_object('status',after_status,'plan_generated',true,'strategy_count',result->'strategy_count','video_count',result->'video_count'));
  return result;
end;
$fn$;
revoke all on function public.generate_strategy_orchestration_plan(uuid,uuid) from public,anon,authenticated;
grant execute on function public.generate_strategy_orchestration_plan(uuid,uuid) to service_role;

create function public.approve_strategy_orchestration(p_orchestration_id uuid,p_actor uuid)
returns boolean language plpgsql security invoker set search_path=''
as $fn$
declare before_status text;
begin
  if p_actor is null or not exists (
    select 1 from public.user_roles r where r.user_id=p_actor and r.role='owner'
  ) then raise exception 'Owner authorization required'; end if;

  select o.status into before_status
  from public.strategy_orchestrations o where o.id=p_orchestration_id for update;
  if not found or before_status not in ('ready','paused') then return false; end if;

  update public.strategy_orchestrations set status='approved',updated_at=now()
  where id=p_orchestration_id;

  insert into public.admin_audit_log(actor_user_id,actor_email,action_type,entity_type,entity_id,previous_value,new_value)
  values(p_actor,null,'RUBI_STRATEGY_ORCHESTRATION_APPROVED','strategy_orchestration',p_orchestration_id,
    jsonb_build_object('status',before_status),jsonb_build_object('status','approved'));
  return true;
end;
$fn$;
revoke all on function public.approve_strategy_orchestration(uuid,uuid) from public,anon,authenticated;
grant execute on function public.approve_strategy_orchestration(uuid,uuid) to service_role;

create function public.rubi_pause_strategy_orchestration_audited(p_orchestration_id uuid,p_actor uuid)
returns boolean language plpgsql security invoker set search_path=''
as $fn$
declare before_status text;
begin
  if p_actor is null or not exists (
    select 1 from public.user_roles r where r.user_id=p_actor and r.role='owner'
  ) then raise exception 'Owner authorization required'; end if;

  select o.status into before_status
  from public.strategy_orchestrations o where o.id=p_orchestration_id for update;
  if not found or before_status not in ('ready','approved') then return false; end if;

  update public.strategy_orchestrations set status='paused',updated_at=now()
  where id=p_orchestration_id;

  insert into public.admin_audit_log(actor_user_id,actor_email,action_type,entity_type,entity_id,previous_value,new_value)
  values(p_actor,null,'RUBI_STRATEGY_ORCHESTRATION_PAUSED','strategy_orchestration',p_orchestration_id,
    jsonb_build_object('status',before_status),jsonb_build_object('status','paused'));
  return true;
end;
$fn$;
revoke all on function public.rubi_pause_strategy_orchestration_audited(uuid,uuid) from public,anon,authenticated;
grant execute on function public.rubi_pause_strategy_orchestration_audited(uuid,uuid) to service_role;
