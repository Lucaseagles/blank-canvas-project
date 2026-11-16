-- RUBI Sprint 208: campaign, channels, products and audit commit or roll back together.
create or replace function public.rubi_mutate_legacy_campaign_audited(
 p_action text, p_campaign_id uuid, p_payload jsonb, p_channels text[],
 p_product_ids uuid[], p_social_channel_id uuid, p_actor uuid
) returns jsonb language plpgsql security invoker set search_path=''
as $func$
declare
 old_campaign public.campaigns%rowtype;
 new_id uuid;
 new_status text;
 new_name text;
 new_description text;
 new_starts timestamptz;
 new_ends timestamptz;
 product_count integer;
 channel_count integer;
 action_name text;
begin
 if p_actor is null or not exists (
  select 1 from public.user_roles r where r.user_id=p_actor and r.role='owner'
 ) then raise exception 'Owner authorization required'; end if;
 if p_action not in ('save','status','terminate','duplicate') then
  raise exception 'Invalid campaign action'; end if;
 if p_action='save' then
  if jsonb_typeof(p_payload) is distinct from 'object' then raise exception 'Invalid payload'; end if;
  new_name:=btrim(coalesce(p_payload->>'name',''));
  new_description:=nullif(btrim(coalesce(p_payload->>'description','')),'');
  new_status:=p_payload->>'status';
  new_starts:=(p_payload->>'starts_at')::timestamptz;
  new_ends:=(p_payload->>'ends_at')::timestamptz;
  if length(new_name) not between 3 and 200 or length(coalesce(new_description,''))>5000
   or new_starts is null or new_ends is null or new_ends<=new_starts
   or coalesce(new_status,'') not in ('scheduled','active','paused','ended')
  then raise exception 'Invalid campaign data'; end if;
  if p_channels is null or cardinality(p_channels)>5 or array_position(p_channels,null) is not null
   or exists(select 1 from unnest(p_channels) ch where ch not in
    ('FEED_BANNER','PUSH','TELEGRAM','REFERRAL_BOOST','SOCIAL_FOLLOW'))
   or (select count(distinct ch) from unnest(p_channels) ch)<>cardinality(p_channels)
  then raise exception 'Invalid or duplicate channels'; end if;
  if p_product_ids is null or cardinality(p_product_ids)>500 or array_position(p_product_ids,null) is not null
   or (select count(distinct x) from unnest(p_product_ids) x)<>cardinality(p_product_ids)
  then raise exception 'Invalid or duplicate products'; end if;
  select count(*) into product_count from public.products p where p.id=any(p_product_ids);
  if product_count<>cardinality(p_product_ids) then raise exception 'Unknown product'; end if;
  if new_status='active' and (new_ends<=now() or cardinality(p_channels)=0 or cardinality(p_product_ids)=0)
  then raise exception 'Active campaign requires future expiry, channel and product'; end if;
  if p_campaign_id is null then
   insert into public.campaigns(name,description,starts_at,ends_at,status)
    values(new_name,new_description,new_starts,new_ends,new_status)
    returning id into new_id;
   action_name:='RUBI_CAMPAIGN_CREATED';
  else
   select c.* into old_campaign from public.campaigns c where c.id=p_campaign_id for update;
   if not found then raise exception 'Campaign not found'; end if;
   new_id:=p_campaign_id;
   update public.campaigns c set name=new_name,description=new_description,starts_at=new_starts,
    ends_at=new_ends,status=new_status,updated_at=now() where c.id=new_id;
   action_name:='RUBI_CAMPAIGN_UPDATED';
  end if;
  delete from public.campaign_channels c where c.campaign_id=new_id;
  insert into public.campaign_channels(campaign_id,channel,is_enabled,config)
   select new_id,c.ch,true,case when c.ch='SOCIAL_FOLLOW' then
    jsonb_build_object('social_channel_id',p_social_channel_id) else '{}'::jsonb end
   from unnest(p_channels) as c(ch);
  delete from public.campaign_products p where p.campaign_id=new_id;
  insert into public.campaign_products(campaign_id,product_id)
   select new_id,p.id from unnest(p_product_ids) as p(id);
  insert into public.admin_audit_log(
   actor_user_id,actor_email,action_type,entity_type,entity_id,previous_value,new_value
  ) values(p_actor,null,action_name,'campaign',new_id,
   case when old_campaign.id is null then '{}'::jsonb else
    jsonb_build_object('status',old_campaign.status,'starts_at',old_campaign.starts_at,'ends_at',old_campaign.ends_at) end,
   jsonb_build_object('status',new_status,'starts_at',new_starts,'ends_at',new_ends,
    'channels',cardinality(p_channels),'products',product_count));
  return jsonb_build_object('id',new_id,'status',new_status);
 end if;
 if p_campaign_id is null then raise exception 'Campaign ID required'; end if;
 select c.* into old_campaign from public.campaigns c where c.id=p_campaign_id for update;
 if not found then raise exception 'Campaign not found'; end if;
 new_id:=p_campaign_id;
 if p_action='duplicate' then
  insert into public.campaigns(
   name,description,starts_at,ends_at,status,audience_segment,min_interest_score,
   priority,frequency_cap_per_day,conditions
  ) values(
   left(old_campaign.name||' (Copy)',200),old_campaign.description,
   old_campaign.starts_at,old_campaign.ends_at,'scheduled',
   old_campaign.audience_segment,old_campaign.min_interest_score,
   old_campaign.priority,old_campaign.frequency_cap_per_day,old_campaign.conditions
  ) returning id into new_id;
  insert into public.campaign_channels(campaign_id,channel,is_enabled,config)
   select new_id,c.channel,c.is_enabled,c.config from public.campaign_channels c where c.campaign_id=p_campaign_id;
  insert into public.campaign_products(campaign_id,product_id)
   select new_id,p.product_id from public.campaign_products p where p.campaign_id=p_campaign_id;
  new_status:='scheduled';
  action_name:='RUBI_CAMPAIGN_DUPLICATED';
 elsif p_action='terminate' then
  if old_campaign.status='ended' then return jsonb_build_object('id',new_id,'status','ended'); end if;
  update public.campaigns c set status='ended',
   ends_at=case when c.starts_at<now() then now() else c.ends_at end,
   updated_at=now() where c.id=new_id;
  new_status:='ended';
  action_name:='RUBI_CAMPAIGN_TERMINATED';
 else
  new_status:=p_payload->>'status';
  if coalesce(new_status,'') not in ('scheduled','active','paused','ended') then
   raise exception 'Invalid campaign status'; end if;
  if new_status='active' then
   if old_campaign.ends_at<=now() then raise exception 'Cannot activate expired campaign'; end if;
   select count(*) into channel_count from public.campaign_channels c
    where c.campaign_id=new_id and c.is_enabled=true;
   select count(*) into product_count from public.campaign_products p where p.campaign_id=new_id;
   if channel_count=0 or product_count=0 then
    raise exception 'Active campaign requires a channel and product'; end if;
  end if;
  update public.campaigns c set status=new_status,updated_at=now() where c.id=new_id;
  action_name:='RUBI_CAMPAIGN_STATUS_CHANGED';
 end if;
 insert into public.admin_audit_log(
  actor_user_id,actor_email,action_type,entity_type,entity_id,previous_value,new_value
 ) values(p_actor,null,action_name,'campaign',new_id,
  jsonb_build_object('status',old_campaign.status),
  jsonb_build_object('status',new_status,
   'source_campaign',case when p_action='duplicate' then p_campaign_id else null end));
 return jsonb_build_object('id',new_id,'status',new_status);
end;
$func$;
revoke all on function public.rubi_mutate_legacy_campaign_audited(text,uuid,jsonb,text[],uuid[],uuid,uuid)
 from public,anon,authenticated;
grant execute on function public.rubi_mutate_legacy_campaign_audited(text,uuid,jsonb,text[],uuid[],uuid,uuid)
 to service_role;
