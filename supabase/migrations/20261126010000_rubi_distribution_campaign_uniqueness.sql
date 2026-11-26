-- Sprint 309: make product/channel/campaign attribution uniqueness race-safe.
-- The prior server preflight was not sufficient: concurrent requests could both
-- observe no collision and insert the same label for different variants.
create or replace function public.rubi_save_distribution_audited(
 p_id uuid,p_variant_id uuid,p_expected_revision integer,
 p_channel text,p_campaign text,p_status text,
 p_notes text,p_published_reference text,p_actor uuid
)
returns table(plan_id uuid,new_revision integer)
language plpgsql security invoker set search_path=''
as $$
declare
 old_plan public.rubi_movement_distribution%rowtype;
 verified_variant public.rubi_movement_variants%rowtype;
 v_product_id uuid;
 saved_id uuid;
 saved_revision integer;
 prior_state jsonb;
begin
 if p_actor is null or not exists(select 1 from public.user_roles r
  where r.user_id=p_actor and r.role='owner') then
  raise exception 'Owner authorization required' using errcode='42501';
 end if;
 if p_channel is null or p_channel not in ('instagram','tiktok','youtube','facebook','pinterest','whatsapp','telegram') then
  raise exception 'Invalid distribution channel' using errcode='22023';
 end if;
 if p_campaign is null or p_campaign !~ '^[a-z0-9][a-z0-9_-]{0,59}
  raise exception 'Invalid campaign identifier' using errcode='22023';
 end if;
 if p_status is null or p_status not in ('planned','manually_published') then
  raise exception 'Invalid distribution status';
 end if;
 if char_length(coalesce(p_notes,''))>1500 or char_length(coalesce(p_published_reference,''))>500 then
  raise exception 'Distribution metadata exceeds allowed length' using errcode='22023';
 end if;

 select v.* into verified_variant from public.rubi_movement_variants v
  where v.id=p_variant_id for share;
 if not found then raise exception 'Variant not found'; end if;
 select m.product_id into v_product_id from public.rubi_movements m
  where m.id=verified_variant.movement_id for share;
 if not found or v_product_id is null then raise exception 'Movement product not found'; end if;

 if p_status='manually_published' and
   (verified_variant.status <> 'review' or
    char_length(btrim(coalesce(p_published_reference,'')))<8) then
  raise exception 'Reviewed variant and publication reference required';
 end if;

 -- Serialize all writes to the same product/channel/campaign key, including
 -- inserts and updates. The lock is transaction-scoped and deterministic.
 perform pg_catalog.pg_advisory_xact_lock(
  pg_catalog.hashtextextended(v_product_id::text||':'||p_channel||':'||p_campaign,0)
 );

 if exists(
  select 1
  from public.rubi_movement_distribution d
  join public.rubi_movement_variants v on v.id=d.variant_id
  join public.rubi_movements m on m.id=v.movement_id
  where m.product_id=v_product_id
    and d.channel=p_channel
    and d.campaign=p_campaign
    and (p_id is null or d.id<>p_id)
 ) then
  raise exception 'Campaign identifier already used by another variant for this product and channel'
   using errcode='23505';
 end if;

 if p_id is null then
  if p_expected_revision is not null then raise exception 'Unexpected revision'; end if;
  insert into public.rubi_movement_distribution
   (variant_id,channel,campaign,status,notes,published_reference)
  values(p_variant_id,p_channel,p_campaign,p_status,p_notes,p_published_reference)
  returning id,revision into saved_id,saved_revision;
  prior_state:='{}'::jsonb;
 else
  select d.* into old_plan from public.rubi_movement_distribution d
   where d.id=p_id and d.variant_id=p_variant_id for update;
  if not found then
   raise exception 'Distribution plan not found';
  end if;
  if p_expected_revision is null or old_plan.revision <> p_expected_revision then
   raise exception 'Distribution plan changed; reload before saving';
  end if;
  if p_channel is distinct from old_plan.channel then
   raise exception 'Distribution channel cannot be reassigned';
  end if;
  prior_state:=jsonb_build_object('revision',old_plan.revision,
   'status',old_plan.status,'channel',old_plan.channel,'campaign',old_plan.campaign);
  update public.rubi_movement_distribution d set
   campaign=p_campaign,status=p_status,notes=p_notes,
   published_reference=p_published_reference,
   page_published_at=null,published_variant_revision=null,
   published_movement_revision=null,
   revision=old_plan.revision+1,updated_at=pg_catalog.now()
   where d.id=old_plan.id;
  saved_id:=old_plan.id;
  saved_revision:=old_plan.revision+1;
 end if;
 insert into public.admin_audit_log(
  actor_user_id,actor_email,action_type,entity_type,entity_id,previous_value,new_value
 ) values(
  p_actor,null,case when p_id is null then 'RUBI_DISTRIBUTION_CREATED'
   else 'RUBI_DISTRIBUTION_UPDATED' end,
  'rubi_movement_distribution',saved_id,prior_state,
  jsonb_build_object('revision',saved_revision,'status',p_status,
   'channel',p_channel,'campaign',p_campaign,'variant_id',p_variant_id)
 );
 return query select saved_id,saved_revision;
end;
$$;
revoke all on function public.rubi_save_distribution_audited(uuid,uuid,integer,text,text,text,text,text,uuid)
 from public,anon,authenticated;
grant execute on function public.rubi_save_distribution_audited(uuid,uuid,integer,text,text,text,text,text,uuid)
 to service_role;
comment on function public.rubi_save_distribution_audited(uuid,uuid,integer,text,text,text,text,text,uuid)
 is 'Owner-only atomic distribution edit/audit with transaction-locked unique product/channel/campaign attribution; does not publish network posts or change checkout.';
 then
  raise exception 'Invalid campaign identifier' using errcode='22023';
 end if;
 if p_status not in ('planned','manually_published') then
  raise exception 'Invalid distribution status';
 end if;
 if char_length(coalesce(p_notes,''))>1500 or char_length(coalesce(p_published_reference,''))>500 then
  raise exception 'Distribution metadata exceeds allowed length' using errcode='22023';
 end if;

 select v.* into verified_variant from public.rubi_movement_variants v
  where v.id=p_variant_id for share;
 if not found then raise exception 'Variant not found'; end if;
 select m.product_id into v_product_id from public.rubi_movements m
  where m.id=verified_variant.movement_id for share;
 if not found or v_product_id is null then raise exception 'Movement product not found'; end if;

 if p_status='manually_published' and
   (verified_variant.status <> 'review' or
    char_length(btrim(coalesce(p_published_reference,'')))<8) then
  raise exception 'Reviewed variant and publication reference required';
 end if;

 -- Serialize all writes to the same product/channel/campaign key, including
 -- inserts and updates. The lock is transaction-scoped and deterministic.
 perform pg_catalog.pg_advisory_xact_lock(
  pg_catalog.hashtextextended(v_product_id::text||':'||p_channel||':'||p_campaign,0)
 );

 if exists(
  select 1
  from public.rubi_movement_distribution d
  join public.rubi_movement_variants v on v.id=d.variant_id
  join public.rubi_movements m on m.id=v.movement_id
  where m.product_id=v_product_id
    and d.channel=p_channel
    and d.campaign=p_campaign
    and (p_id is null or d.id<>p_id)
 ) then
  raise exception 'Campaign identifier already used by another variant for this product and channel'
   using errcode='23505';
 end if;

 if p_id is null then
  if p_expected_revision is not null then raise exception 'Unexpected revision'; end if;
  insert into public.rubi_movement_distribution
   (variant_id,channel,campaign,status,notes,published_reference)
  values(p_variant_id,p_channel,p_campaign,p_status,p_notes,p_published_reference)
  returning id,revision into saved_id,saved_revision;
  prior_state:='{}'::jsonb;
 else
  select d.* into old_plan from public.rubi_movement_distribution d
   where d.id=p_id and d.variant_id=p_variant_id for update;
  if not found then
   raise exception 'Distribution plan not found';
  end if;
  if p_expected_revision is null then
   raise exception 'Expected revision is required';
  end if;
  if old_plan.revision <> p_expected_revision then
   raise exception 'Distribution plan changed; reload before saving';
  end if;
  if p_channel is distinct from old_plan.channel then
   raise exception 'Distribution channel cannot be reassigned';
  end if;
  prior_state:=jsonb_build_object('revision',old_plan.revision,
   'status',old_plan.status,'channel',old_plan.channel,'campaign',old_plan.campaign);
  update public.rubi_movement_distribution d set
   campaign=p_campaign,status=p_status,notes=p_notes,
   published_reference=p_published_reference,
   page_published_at=null,published_variant_revision=null,
   published_movement_revision=null,
   revision=old_plan.revision+1,updated_at=pg_catalog.now()
   where d.id=old_plan.id;
  saved_id:=old_plan.id;
  saved_revision:=old_plan.revision+1;
 end if;
 insert into public.admin_audit_log(
  actor_user_id,actor_email,action_type,entity_type,entity_id,previous_value,new_value
 ) values(
  p_actor,null,case when p_id is null then 'RUBI_DISTRIBUTION_CREATED'
   else 'RUBI_DISTRIBUTION_UPDATED' end,
  'rubi_movement_distribution',saved_id,prior_state,
  jsonb_build_object('revision',saved_revision,'status',p_status,
   'channel',p_channel,'campaign',p_campaign,'variant_id',p_variant_id)
 );
 return query select saved_id,saved_revision;
end;
$$;
revoke all on function public.rubi_save_distribution_audited(uuid,uuid,integer,text,text,text,text,text,uuid)
 from public,anon,authenticated;
grant execute on function public.rubi_save_distribution_audited(uuid,uuid,integer,text,text,text,text,text,uuid)
 to service_role;
comment on function public.rubi_save_distribution_audited(uuid,uuid,integer,text,text,text,text,text,uuid)
 is 'Owner-only atomic distribution edit/audit with transaction-locked unique product/channel/campaign attribution; does not publish network posts or change checkout.';
