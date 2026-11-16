-- Sprint 219: video and bridge-video writes are transactional and audited.
create or replace function public.rubi_manage_video_audited(
  p_action text,
  p_id uuid,
  p_payload jsonb,
  p_product_ids jsonb,
  p_actor uuid
) returns jsonb
language plpgsql
security invoker
set search_path=''
as $function$
declare
  old_row public.videos%rowtype;
  new_id uuid;
  v_product_ids uuid[];
  v_product_count integer;
  v_status text;
begin
  if p_actor is null or not exists (
    select 1 from public.user_roles r where r.user_id=p_actor and r.role='owner'
  ) then raise exception 'Owner authorization required'; end if;

  if p_action is null or p_action not in ('save','status','delete') then raise exception 'Invalid video action'; end if;

  if p_action='delete' then
    if p_id is null then raise exception 'Video ID required'; end if;
    select * into old_row from public.videos where id=p_id for update;
    if not found then raise exception 'Video not found'; end if;
    delete from public.videos where id=p_id;
    insert into public.admin_audit_log(actor_user_id,actor_email,action_type,entity_type,entity_id,previous_value,new_value)
    values(p_actor,null,'RUBI_VIDEO_DELETED','video',p_id,
      public.sanitize_admin_audit_json(to_jsonb(old_row)),'{}'::jsonb);
    return jsonb_build_object('id',p_id);
  end if;

  if p_action='status' then
    if p_id is null or jsonb_typeof(p_payload) is distinct from 'object' then raise exception 'Video status payload required'; end if;
    select * into old_row from public.videos where id=p_id for update;
    if not found then raise exception 'Video not found'; end if;
    v_status := p_payload->>'status';
    if v_status is null or v_status not in ('published','draft','archived') then raise exception 'Invalid video status'; end if;
    if v_status='published' and old_row.scheduled_for is not null and old_row.scheduled_for>now() then
      raise exception 'Scheduled video cannot be published before its scheduled time';
    end if;
    update public.videos set status=v_status where id=p_id;
    insert into public.admin_audit_log(actor_user_id,actor_email,action_type,entity_type,entity_id,previous_value,new_value)
    values(p_actor,null,'RUBI_VIDEO_STATUS_CHANGED','video',p_id,
      jsonb_build_object('status',old_row.status),jsonb_build_object('status',v_status));
    return jsonb_build_object('id',p_id,'status',v_status);
  end if;

  if jsonb_typeof(p_payload) is distinct from 'object' then raise exception 'Video payload required'; end if;
  if length(btrim(coalesce(p_payload->>'title',''))) not between 1 and 200 then raise exception 'Invalid video title'; end if;
  if coalesce(p_payload->>'status','') not in ('published','draft','archived') then raise exception 'Invalid video status'; end if;
  if coalesce(p_payload->>'external_url','')='' and coalesce(p_payload->>'storage_path','')='' then raise exception 'Video URL or storage path required'; end if;
  if nullif(p_payload->>'duration_seconds','') is not null and (p_payload->>'duration_seconds')::integer<0 then raise exception 'Invalid video duration'; end if;
  if p_product_ids is not null then
    if jsonb_typeof(p_product_ids) is distinct from 'array' or jsonb_array_length(p_product_ids)>100 then raise exception 'Invalid video product list'; end if;
    select coalesce(array_agg(value::uuid),array[]::uuid[]) into v_product_ids
      from jsonb_array_elements_text(p_product_ids) as item_rows(value);
    if cardinality(v_product_ids)<>(select count(distinct x) from unnest(v_product_ids) x) then raise exception 'Duplicate product association'; end if;
    select count(*) into v_product_count from public.products where id=any(v_product_ids);
    if v_product_count<>cardinality(v_product_ids) then raise exception 'One or more products do not exist'; end if;
  end if;

  if p_id is null then
    insert into public.videos(title,video_url,thumbnail_url,product_id,status,storage_path,external_url,
      duration_seconds,category_id,campaign_id,scheduled_for,caption,subtitle_url,subtitle_text)
    values(
      btrim(p_payload->>'title'),
      coalesce(nullif(p_payload->>'external_url',''),case when nullif(p_payload->>'storage_path','') is not null then ('storage://' || (p_payload->>'storage_path')) end,''),
      null,null,nullif(p_payload->>'status','draft'),
      nullif(p_payload->>'storage_path',''),nullif(p_payload->>'external_url',''),
      nullif(p_payload->>'duration_seconds','')::integer,nullif(p_payload->>'category_id','')::uuid,
      nullif(p_payload->>'campaign_id','')::uuid,nullif(p_payload->>'scheduled_for','')::timestamptz,
      nullif(p_payload->>'caption',''),nullif(p_payload->>'subtitle_url',''),nullif(p_payload->>'subtitle_text','')
    ) returning id into new_id;
  else
    select * into old_row from public.videos where id=p_id for update;
    if not found then raise exception 'Video not found'; end if;
    update public.videos set
      title=btrim(p_payload->>'title'),
      video_url=coalesce(nullif(p_payload->>'external_url',''),case when nullif(p_payload->>'storage_path','') is not null then ('storage://' || (p_payload->>'storage_path')) end,''),
      status=p_payload->>'status',
      storage_path=nullif(p_payload->>'storage_path',''),
      external_url=nullif(p_payload->>'external_url',''),
      duration_seconds=nullif(p_payload->>'duration_seconds','')::integer,
      category_id=nullif(p_payload->>'category_id','')::uuid,
      campaign_id=nullif(p_payload->>'campaign_id','')::uuid,
      scheduled_for=nullif(p_payload->>'scheduled_for','')::timestamptz,
      caption=nullif(p_payload->>'caption',''),
      subtitle_url=nullif(p_payload->>'subtitle_url',''),
      subtitle_text=nullif(p_payload->>'subtitle_text','')
    where id=p_id;
    new_id:=p_id;
  end if;

  if p_product_ids is not null then
    delete from public.video_products where video_id=new_id;
    insert into public.video_products(video_id,product_id,position)
    select new_id,x,(ordinality-1)::integer
    from unnest(v_product_ids) with ordinality as products(x,ordinality);
  end if;

  insert into public.admin_audit_log(actor_user_id,actor_email,action_type,entity_type,entity_id,previous_value,new_value)
  values(p_actor,null,case when p_id is null then 'RUBI_VIDEO_CREATED' else 'RUBI_VIDEO_UPDATED' end,
    'video',new_id,
    case when p_id is null then '{}'::jsonb else public.sanitize_admin_audit_json(to_jsonb(old_row)) end,
    public.sanitize_admin_audit_json(jsonb_build_object(
      'title',p_payload->>'title','status',p_payload->>'status',
      'storage_path',p_payload->>'storage_path','external_url',p_payload->>'external_url',
      'duration_seconds',p_payload->>'duration_seconds','category_id',p_payload->>'category_id',
      'campaign_id',p_payload->>'campaign_id','scheduled_for',p_payload->>'scheduled_for',
      'caption',p_payload->>'caption','subtitle_url',p_payload->>'subtitle_url',
      'subtitle_text',p_payload->>'subtitle_text','product_ids',coalesce(p_product_ids,'null'::jsonb)
    )));
  return jsonb_build_object('id',new_id);
end;
$function$;

create or replace function public.rubi_manage_bridge_video_audited(
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
  old_row public.bridge_videos%rowtype;
  new_id uuid;
  v_product_id uuid;
begin
  if p_actor is null or not exists (
    select 1 from public.user_roles r where r.user_id=p_actor and r.role='owner'
  ) then raise exception 'Owner authorization required'; end if;
  if p_action is null or p_action not in ('save','delete') then raise exception 'Invalid bridge video action'; end if;

  if p_action='delete' then
    if p_id is null then raise exception 'Bridge video ID required'; end if;
    select * into old_row from public.bridge_videos where id=p_id for update;
    if not found then raise exception 'Bridge video not found'; end if;
    delete from public.bridge_videos where id=p_id;
    insert into public.admin_audit_log(actor_user_id,actor_email,action_type,entity_type,entity_id,previous_value,new_value)
    values(p_actor,null,'RUBI_BRIDGE_VIDEO_DELETED','bridge_video',p_id,
      public.sanitize_admin_audit_json(to_jsonb(old_row)),'{}'::jsonb);
    return jsonb_build_object('id',p_id);
  end if;

  if jsonb_typeof(p_payload) is distinct from 'object' then raise exception 'Bridge video payload required'; end if;
  v_product_id:=nullif(p_payload->>'product_id','')::uuid;
  if v_product_id is null or not exists(select 1 from public.products where id=v_product_id and status<>'deleted') then
    raise exception 'Selected product does not exist or is deleted';
  end if;
  if length(btrim(coalesce(p_payload->>'title',''))) not between 1 and 200
    or p_payload->>'platform' not in ('tiktok','shopee','ml','youtube')
    or coalesce(p_payload->>'link','') !~* '^https://'
    or (p_payload->>'is_active') not in ('true','false') then
    raise exception 'Invalid bridge video attributes';
  end if;

  if p_id is null then
    insert into public.bridge_videos(product_id,title,subtitle,thumbnail,platform,link,is_active)
    values(v_product_id,btrim(p_payload->>'title'),nullif(p_payload->>'subtitle',''),
      nullif(p_payload->>'thumbnail',''),p_payload->>'platform',p_payload->>'link',(p_payload->>'is_active')::boolean)
    returning id into new_id;
  else
    select * into old_row from public.bridge_videos where id=p_id for update;
    if not found then raise exception 'Bridge video not found'; end if;
    update public.bridge_videos set product_id=v_product_id,title=btrim(p_payload->>'title'),
      subtitle=nullif(p_payload->>'subtitle',''),thumbnail=nullif(p_payload->>'thumbnail',''),
      platform=p_payload->>'platform',link=p_payload->>'link',is_active=(p_payload->>'is_active')::boolean
    where id=p_id;
    new_id:=p_id;
  end if;

  insert into public.admin_audit_log(actor_user_id,actor_email,action_type,entity_type,entity_id,previous_value,new_value)
  values(p_actor,null,case when p_id is null then 'RUBI_BRIDGE_VIDEO_CREATED' else 'RUBI_BRIDGE_VIDEO_UPDATED' end,
    'bridge_video',new_id,
    case when p_id is null then '{}'::jsonb else public.sanitize_admin_audit_json(to_jsonb(old_row)) end,
    public.sanitize_admin_audit_json(jsonb_build_object('product_id',v_product_id,'title',p_payload->>'title',
      'subtitle',p_payload->>'subtitle','thumbnail',p_payload->>'thumbnail','platform',p_payload->>'platform',
      'link',p_payload->>'link','is_active',(p_payload->>'is_active')::boolean)));
  return jsonb_build_object('id',new_id);
end;
$function$;

revoke all on function public.rubi_manage_video_audited(text,uuid,jsonb,jsonb,uuid) from public,anon,authenticated;
grant execute on function public.rubi_manage_video_audited(text,uuid,jsonb,jsonb,uuid) to service_role;
revoke all on function public.rubi_manage_bridge_video_audited(text,uuid,jsonb,uuid) from public,anon,authenticated;
grant execute on function public.rubi_manage_bridge_video_audited(text,uuid,jsonb,uuid) to service_role;
