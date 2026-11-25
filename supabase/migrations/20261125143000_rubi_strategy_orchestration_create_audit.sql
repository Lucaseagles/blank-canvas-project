-- Sprint 308: create a Strategy Orchestration and its links with atomic Owner audit.
-- Executed only by the trusted server role; actor identity comes from requireOwnerRole.

create or replace function public.rubi_create_strategy_orchestration_audited(
  p_name text,
  p_objective text,
  p_priority integer,
  p_notes text,
  p_strategy_ids uuid[],
  p_video_ids uuid[],
  p_actor uuid
) returns jsonb
language plpgsql
security invoker
set search_path = ''
as $function$
declare
  v_id uuid;
  v_strategy_ids uuid[] := coalesce(p_strategy_ids, array[]::uuid[]);
  v_video_ids uuid[] := coalesce(p_video_ids, array[]::uuid[]);
  v_strategy_count integer;
  v_video_count integer;
  v_priority integer := greatest(0, least(100, coalesce(p_priority, 50)));
begin
  if p_actor is null or not exists (
    select 1 from public.user_roles r
    where r.user_id = p_actor and r.role = 'owner'
  ) then
    raise exception 'Owner authorization required' using errcode = '42501';
  end if;

  if p_name is null or char_length(btrim(p_name)) not between 2 and 160 then
    raise exception 'Invalid strategy orchestration name' using errcode = '22023';
  end if;
  if p_objective is null or p_objective not in ('traffic','engagement','followers','conversion','awareness') then
    raise exception 'Invalid strategy orchestration objective' using errcode = '22023';
  end if;
  if p_priority is not null and p_priority not between 0 and 100 then
    raise exception 'Invalid strategy orchestration priority' using errcode = '22023';
  end if;
  if p_notes is not null and char_length(p_notes) > 1000 then
    raise exception 'Strategy orchestration notes exceed limit' using errcode = '22023';
  end if;
  if cardinality(v_strategy_ids) > 50 or cardinality(v_video_ids) > 100 then
    raise exception 'Too many strategy or video associations' using errcode = '22023';
  end if;
  if cardinality(v_strategy_ids) <> (select count(distinct x) from unnest(v_strategy_ids) as ids(x)) then
    raise exception 'Duplicate strategy association' using errcode = '22023';
  end if;
  if cardinality(v_video_ids) <> (select count(distinct x) from unnest(v_video_ids) as ids(x)) then
    raise exception 'Duplicate video association' using errcode = '22023';
  end if;

  select count(*) into v_strategy_count
  from public.social_channel_strategies s
  where s.id = any(v_strategy_ids) and s.is_active = true;
  if v_strategy_count <> cardinality(v_strategy_ids) then
    raise exception 'One or more selected strategies do not exist or are inactive' using errcode = '22023';
  end if;

  select count(*) into v_video_count
  from public.videos v
  where v.id = any(v_video_ids);
  if v_video_count <> cardinality(v_video_ids) then
    raise exception 'One or more selected videos do not exist' using errcode = '22023';
  end if;

  insert into public.strategy_orchestrations (
    name, objective, priority, notes, created_by
  ) values (
    btrim(p_name), p_objective, v_priority, nullif(btrim(coalesce(p_notes, '')), ''), p_actor
  ) returning id into v_id;

  insert into public.strategy_orchestration_items(orchestration_id, strategy_id, position)
  select v_id, ids.strategy_id, (ids.ordinality - 1)::integer
  from unnest(v_strategy_ids) with ordinality as ids(strategy_id, ordinality);

  insert into public.strategy_orchestration_videos(orchestration_id, video_id, position)
  select v_id, ids.video_id, (ids.ordinality - 1)::integer
  from unnest(v_video_ids) with ordinality as ids(video_id, ordinality);

  insert into public.admin_audit_log (
    actor_user_id, actor_email, action_type, entity_type, entity_id,
    previous_value, new_value
  ) values (
    p_actor, null, 'RUBI_STRATEGY_ORCHESTRATION_CREATED',
    'strategy_orchestration', v_id,
    '{}'::jsonb,
    jsonb_build_object(
      'name', btrim(p_name),
      'objective', p_objective,
      'priority', v_priority,
      'strategy_count', v_strategy_count,
      'video_count', v_video_count
    )
  );

  return jsonb_build_object('id', v_id, 'status', 'draft');
end;
$function$;

revoke all on function public.rubi_create_strategy_orchestration_audited(text,text,integer,text,uuid[],uuid[],uuid[])
  from public, anon, authenticated;
grant execute on function public.rubi_create_strategy_orchestration_audited(text,text,integer,text,uuid[],uuid[],uuid[])
  to service_role;
comment on function public.rubi_create_strategy_orchestration_audited(text,text,integer,text,uuid[],uuid[],uuid[])
  is 'Server-only Owner creation of orchestration and linked strategies/videos with one atomic minimal audit event.';
