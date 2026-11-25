-- Sprint 308: audited, serialized plan generation and approval.
-- Both RPCs are callable only by the trusted server role; actor comes from requireOwnerRole.

create or replace function public.rubi_generate_strategy_orchestration_plan_audited(
  p_orchestration_id uuid,
  p_actor uuid
) returns jsonb
language plpgsql
security invoker
set search_path = ''
as $function$
declare
  v_before public.strategy_orchestrations%rowtype;
  v_plan jsonb;
begin
  if p_actor is null or not exists (
    select 1 from public.user_roles r
    where r.user_id = p_actor and r.role = 'owner'
  ) then
    raise exception 'Owner authorization required' using errcode = '42501';
  end if;
  if p_orchestration_id is null then
    raise exception 'Strategy orchestration ID required' using errcode = '22023';
  end if;

  select * into v_before
  from public.strategy_orchestrations
  where id = p_orchestration_id
  for update;
  if not found then
    raise exception 'Strategy orchestration not found' using errcode = 'P0002';
  end if;
  if v_before.status not in ('draft', 'ready') then
    raise exception 'Strategy orchestration plan cannot be regenerated from current status'
      using errcode = '40001';
  end if;

  with selected as (
    select s.id, s.name, s.objective, s.posting_frequency_per_week, s.cta,
           s.content_pillars, s.preferred_formats, s.priority, s.audience_segment,
           ch.id as channel_id, ch.channel_name, ch.platform,
           c.name as category_name, cc.title as collection_title, ca.name as campaign_name,
           oi.position
    from public.strategy_orchestration_items oi
    join public.social_channel_strategies s on s.id = oi.strategy_id
    join public.social_channels ch on ch.id = s.channel_id
    left join public.categories c on c.id = s.category_id
    left join public.curated_collections cc on cc.id = s.collection_id
    left join public.campaigns ca on ca.id = s.campaign_id
    where oi.orchestration_id = p_orchestration_id and s.is_active = true
  ),
  selected_videos as (
    select v.id, v.title, v.video_url, v.external_url, v.thumbnail_url, ov.position
    from public.strategy_orchestration_videos ov
    join public.videos v on v.id = ov.video_id
    where ov.orchestration_id = p_orchestration_id
  )
  select jsonb_build_object(
    'generated_at', pg_catalog.now(),
    'strategy_count', (select count(*) from selected),
    'video_count', (select count(*) from selected_videos),
    'channels', coalesce((
      select jsonb_agg(distinct jsonb_build_object('id',channel_id,'platform',platform,'name',channel_name))
      from selected where channel_id is not null
    ), '[]'::jsonb),
    'strategies', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id',id,'name',name,'objective',objective,'channel',channel_name,'platform',platform,
        'category',category_name,'collection',collection_title,'campaign',campaign_name,
        'segment',audience_segment,'frequency_per_week',posting_frequency_per_week,
        'content_pillars',content_pillars,'preferred_formats',preferred_formats,'cta',cta,'priority',priority
      ) order by position, priority desc)
      from selected
    ), '[]'::jsonb),
    'videos', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id',id,'title',title,'video_url',video_url,'external_url',external_url,
        'thumbnail_url',thumbnail_url
      ) order by position)
      from selected_videos
    ), '[]'::jsonb),
    'execution', jsonb_build_object(
      'publishing','Use existing scheduled_posts / publishing engine',
      'campaigns','Use linked existing campaigns',
      'automation','Use existing automation_rules; no new automation engine',
      'approval_required',true
    )
  ) into v_plan;

  update public.strategy_orchestrations
  set plan = v_plan,
      status = case when jsonb_array_length(v_plan->'strategies') > 0 then 'ready' else 'draft' end,
      updated_at = pg_catalog.now()
  where id = p_orchestration_id;

  insert into public.admin_audit_log (
    actor_user_id, actor_email, action_type, entity_type, entity_id,
    previous_value, new_value
  ) values (
    p_actor, null, 'RUBI_STRATEGY_ORCHESTRATION_PLAN_GENERATED',
    'strategy_orchestration', p_orchestration_id,
    jsonb_build_object('status', v_before.status),
    jsonb_build_object(
      'status', case when jsonb_array_length(v_plan->'strategies') > 0 then 'ready' else 'draft' end,
      'strategy_count', (v_plan->>'strategy_count')::integer,
      'video_count', (v_plan->>'video_count')::integer
    )
  );

  return v_plan;
end;
$function$;

create or replace function public.rubi_approve_strategy_orchestration_audited(
  p_orchestration_id uuid,
  p_actor uuid
) returns jsonb
language plpgsql
security invoker
set search_path = ''
as $function$
declare
  v_before public.strategy_orchestrations%rowtype;
begin
  if p_actor is null or not exists (
    select 1 from public.user_roles r
    where r.user_id = p_actor and r.role = 'owner'
  ) then
    raise exception 'Owner authorization required' using errcode = '42501';
  end if;
  if p_orchestration_id is null then
    raise exception 'Strategy orchestration ID required' using errcode = '22023';
  end if;

  select * into v_before
  from public.strategy_orchestrations
  where id = p_orchestration_id
  for update;
  if not found then
    raise exception 'Strategy orchestration not found' using errcode = 'P0002';
  end if;
  if v_before.status not in ('ready', 'paused') then
    raise exception 'Strategy orchestration cannot be approved from current status'
      using errcode = '40001';
  end if;
  if pg_catalog.jsonb_typeof(v_before.plan->'strategies') is distinct from 'array'
     or pg_catalog.jsonb_array_length(v_before.plan->'strategies') = 0 then
    raise exception 'Strategy orchestration requires a generated non-empty plan before approval'
      using errcode = '22023';
  end if;

  update public.strategy_orchestrations
  set status = 'approved', updated_at = pg_catalog.now()
  where id = p_orchestration_id;

  insert into public.admin_audit_log (
    actor_user_id, actor_email, action_type, entity_type, entity_id,
    previous_value, new_value
  ) values (
    p_actor, null, 'RUBI_STRATEGY_ORCHESTRATION_APPROVED',
    'strategy_orchestration', p_orchestration_id,
    jsonb_build_object('status', v_before.status),
    jsonb_build_object('status', 'approved')
  );

  return jsonb_build_object(
    'approved', true,
    'id', p_orchestration_id,
    'previous_status', v_before.status,
    'status', 'approved'
  );
end;
$function$;

revoke all on function public.rubi_generate_strategy_orchestration_plan_audited(uuid, uuid)
  from public, anon, authenticated;
grant execute on function public.rubi_generate_strategy_orchestration_plan_audited(uuid, uuid)
  to service_role;
comment on function public.rubi_generate_strategy_orchestration_plan_audited(uuid, uuid)
  is 'Server-only Owner plan generation with row lock and minimal atomic audit event.';

revoke all on function public.rubi_approve_strategy_orchestration_audited(uuid, uuid)
  from public, anon, authenticated;
grant execute on function public.rubi_approve_strategy_orchestration_audited(uuid, uuid)
  to service_role;
comment on function public.rubi_approve_strategy_orchestration_audited(uuid, uuid)
  is 'Server-only Owner approval with row lock, non-empty plan precondition and minimal atomic audit event.';
