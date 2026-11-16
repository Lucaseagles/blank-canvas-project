-- Sprint 218: social strategy writes and audit are one transaction.
create or replace function public.rubi_manage_social_strategy_audited(
  p_action text,
  p_id uuid,
  p_payload jsonb,
  p_actor uuid
) returns jsonb
language plpgsql
security invoker
set search_path=''
as $function$
declare
  old_row public.social_channel_strategies%rowtype;
  new_id uuid;
  v_channel_id uuid;
  v_name text;
  v_category_id uuid;
  v_collection_id uuid;
  v_campaign_id uuid;
  v_segment text;
  v_objective text;
  v_pillars text[];
  v_formats text[];
  v_frequency integer;
  v_cta text;
  v_priority integer;
  v_active boolean;
  v_action text;
  v_previous jsonb := '{}'::jsonb;
  v_next jsonb := '{}'::jsonb;
begin
  if p_actor is null or not exists (
    select 1 from public.user_roles r where r.user_id=p_actor and r.role='owner'
  ) then
    raise exception 'Owner authorization required';
  end if;

  if p_action not in ('save','delete') then
    raise exception 'Invalid social strategy action';
  end if;

  if p_action='delete' then
    if p_id is null then raise exception 'Strategy ID required'; end if;
    select * into old_row
      from public.social_channel_strategies
      where id=p_id
      for update;
    if not found then raise exception 'Strategy not found'; end if;

    delete from public.social_channel_strategies where id=p_id;
    insert into public.admin_audit_log(
      actor_user_id,actor_email,action_type,entity_type,entity_id,previous_value,new_value
    ) values (
      p_actor,null,'RUBI_SOCIAL_STRATEGY_DELETED','social_channel_strategy',p_id,
      public.sanitize_admin_audit_json(to_jsonb(old_row)),'{}'::jsonb
    );
    return jsonb_build_object('id',p_id);
  end if;

  if jsonb_typeof(p_payload) is distinct from 'object' then
    raise exception 'Strategy payload required';
  end if;

  v_channel_id := nullif(p_payload->>'channel_id','')::uuid;
  v_name := btrim(coalesce(p_payload->>'name',''));
  v_category_id := nullif(p_payload->>'category_id','')::uuid;
  v_collection_id := nullif(p_payload->>'collection_id','')::uuid;
  v_campaign_id := nullif(p_payload->>'campaign_id','')::uuid;
  v_segment := nullif(btrim(coalesce(p_payload->>'audience_segment','')),'');
  v_objective := p_payload->>'objective';
  if jsonb_typeof(coalesce(p_payload->'content_pillars','[]'::jsonb)) <> 'array'
    or jsonb_typeof(coalesce(p_payload->'preferred_formats','[]'::jsonb)) <> 'array' then
    raise exception 'Strategy lists must be arrays';
  end if;
  select coalesce(array_agg(item),array[]::text[]) into v_pillars
    from jsonb_array_elements_text(coalesce(p_payload->'content_pillars','[]'::jsonb)) as items(item);
  select coalesce(array_agg(item),array[]::text[]) into v_formats
    from jsonb_array_elements_text(coalesce(p_payload->'preferred_formats','[]'::jsonb)) as items(item);
  v_frequency := (p_payload->>'posting_frequency_per_week')::integer;
  v_cta := nullif(btrim(coalesce(p_payload->>'cta','')),'');
  v_priority := (p_payload->>'priority')::integer;
  v_active := (p_payload->>'is_active')::boolean;

  if v_channel_id is null or length(v_name) not between 2 and 120
    or v_objective is null or v_objective not in ('traffic','engagement','followers','conversion','awareness')
    or v_frequency is null or v_frequency not between 1 and 50
    or v_priority is null or v_priority not between 0 and 100
    or v_active is null
    or cardinality(v_pillars)>10 or cardinality(v_formats)>10
    or exists(select 1 from unnest(v_pillars) x where x is null or length(btrim(x)) not between 1 and 80)
    or exists(select 1 from unnest(v_formats) x where x is null or length(btrim(x)) not between 1 and 40)
    or length(coalesce(v_segment,''))>120 or length(coalesce(v_cta,''))>160
  then
    raise exception 'Invalid social strategy attributes';
  end if;

  if p_id is null then
    insert into public.social_channel_strategies(
      channel_id,name,category_id,collection_id,campaign_id,audience_segment,
      objective,content_pillars,preferred_formats,posting_frequency_per_week,
      cta,priority,is_active
    ) values (
      v_channel_id,v_name,v_category_id,v_collection_id,v_campaign_id,v_segment,
      v_objective,v_pillars,v_formats,v_frequency,v_cta,v_priority,v_active
    ) returning id into new_id;
    v_action := 'RUBI_SOCIAL_STRATEGY_CREATED';
  else
    select * into old_row from public.social_channel_strategies where id=p_id for update;
    if not found then raise exception 'Strategy not found'; end if;
    update public.social_channel_strategies set
      channel_id=v_channel_id,name=v_name,category_id=v_category_id,
      collection_id=v_collection_id,campaign_id=v_campaign_id,
      audience_segment=v_segment,objective=v_objective,
      content_pillars=v_pillars,preferred_formats=v_formats,
      posting_frequency_per_week=v_frequency,cta=v_cta,priority=v_priority,
      is_active=v_active,updated_at=now()
    where id=p_id;
    new_id := p_id;
    v_action := 'RUBI_SOCIAL_STRATEGY_UPDATED';
    v_previous := public.sanitize_admin_audit_json(to_jsonb(old_row));
  end if;

  v_next := jsonb_build_object(
    'channel_id',v_channel_id,'name',v_name,'category_id',v_category_id,
    'collection_id',v_collection_id,'campaign_id',v_campaign_id,
    'audience_segment',v_segment,'objective',v_objective,
    'content_pillars',to_jsonb(v_pillars),'preferred_formats',to_jsonb(v_formats),
    'posting_frequency_per_week',v_frequency,'cta',v_cta,
    'priority',v_priority,'is_active',v_active
  );
  insert into public.admin_audit_log(
    actor_user_id,actor_email,action_type,entity_type,entity_id,previous_value,new_value
  ) values (
    p_actor,null,v_action,'social_channel_strategy',new_id,v_previous,
    public.sanitize_admin_audit_json(v_next)
  );

  return jsonb_build_object('id',new_id);
end;
$function$;

revoke all on function public.rubi_manage_social_strategy_audited(text,uuid,jsonb,uuid)
  from public,anon,authenticated;
grant execute on function public.rubi_manage_social_strategy_audited(text,uuid,jsonb,uuid)
  to service_role;
revoke insert,update,delete on public.social_channel_strategies from public,anon,authenticated;
