-- Sprint 296: smart collection administration writes and candidate generation are audited atomically.
-- No production deployment is implied by this migration file.
create or replace function public.rubi_manage_smart_collection_audited(
 p_action text,p_id uuid,p_payload jsonb,p_actor uuid
) returns jsonb
language plpgsql
security invoker
set search_path=''
as $fn$
declare
 v_collection public.curated_collections%rowtype;
 v_candidate public.collection_candidates%rowtype;
 v_saved public.curated_collections%rowtype;
 v_rules jsonb;
 v_min_discount numeric;
 v_min_trend numeric;
 v_min_demand numeric;
 v_min_offer numeric;
 v_require_offer boolean;
 v_count integer:=0;
 v_items integer:=0;
 v_candidates integer:=0;
 v_priority integer;
 v_old_priority integer;
 v_position integer;
begin
 if p_actor is null or not exists(
  select 1 from public.user_roles r where r.user_id=p_actor and r.role='owner'
 ) then raise exception 'Owner authorization required'; end if;
 if p_action not in ('save','delete','prioritize','generate','approve','reject') then
  raise exception 'Invalid smart collection action';
 end if;
 if p_action='save' then
  if jsonb_typeof(p_payload) is distinct from 'object'
   or length(btrim(coalesce(p_payload->>'title',''))) not between 1 and 200
   or length(btrim(coalesce(p_payload->>'slug',''))) not between 1 and 200
   or coalesce(p_payload->>'slug','') !~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'
   or coalesce(p_payload->>'collection_type','') not in
    ('achadinhos','trending','offers','category','seasonal','personalized','editorial')
   or jsonb_typeof(p_payload->'candidate_rules') is distinct from 'object'
   or jsonb_typeof(p_payload->'is_active') is distinct from 'boolean' then
   raise exception 'Invalid smart collection data';
  end if;
  if p_id is null then
   insert into public.curated_collections(slug,title,description,collection_type,candidate_rules,is_active,updated_at)
   values(btrim(p_payload->>'slug'),btrim(p_payload->>'title'),nullif(btrim(p_payload->>'description'), ''),
    p_payload->>'collection_type',p_payload->'candidate_rules',(p_payload->>'is_active')::boolean,now())
   returning * into v_saved;
   insert into public.admin_audit_log(actor_user_id,action_type,entity_type,entity_id,previous_value,new_value)
   values(p_actor,'RUBI_SMART_COLLECTION_CREATED','curated_collection',v_saved.id,'{}'::jsonb,
    jsonb_build_object('slug',v_saved.slug,'title',v_saved.title,'collection_type',v_saved.collection_type,
     'candidate_rules',v_saved.candidate_rules,'is_active',v_saved.is_active));
  else
   select * into v_collection from public.curated_collections where id=p_id for update;
   if not found then raise exception 'Smart collection not found'; end if;
   update public.curated_collections set
    slug=btrim(p_payload->>'slug'),title=btrim(p_payload->>'title'),
    description=nullif(btrim(p_payload->>'description'), ''),
    collection_type=p_payload->>'collection_type',candidate_rules=p_payload->'candidate_rules',
    is_active=(p_payload->>'is_active')::boolean,updated_at=now()
   where id=p_id returning * into v_saved;
   insert into public.admin_audit_log(actor_user_id,action_type,entity_type,entity_id,previous_value,new_value)
   values(p_actor,'RUBI_SMART_COLLECTION_UPDATED','curated_collection',p_id,
    jsonb_build_object('slug',v_collection.slug,'title',v_collection.title,'collection_type',v_collection.collection_type,
     'candidate_rules',v_collection.candidate_rules,'is_active',v_collection.is_active),
    jsonb_build_object('slug',v_saved.slug,'title',v_saved.title,'collection_type',v_saved.collection_type,
     'candidate_rules',v_saved.candidate_rules,'is_active',v_saved.is_active));
  end if;
  return to_jsonb(v_saved);
 end if;

 if p_id is null then raise exception 'Smart collection or candidate ID required'; end if;
 if p_action='delete' then
  select * into v_collection from public.curated_collections where id=p_id for update;
  if not found then raise exception 'Smart collection not found'; end if;
  select count(*) into v_items from public.collection_items where collection_id=p_id;
  select count(*) into v_candidates from public.collection_candidates where collection_id=p_id;
  delete from public.curated_collections where id=p_id;
  insert into public.admin_audit_log(actor_user_id,action_type,entity_type,entity_id,previous_value,new_value)
  values(p_actor,'RUBI_SMART_COLLECTION_DELETED','curated_collection',p_id,
   jsonb_build_object('slug',v_collection.slug,'title',v_collection.title,'collection_type',v_collection.collection_type,
    'items_deleted',v_items,'candidates_deleted',v_candidates),'{}'::jsonb);
  return jsonb_build_object('deleted',true,'id',p_id);
 end if;

 if p_action in ('approve','reject') then
  select * into v_candidate from public.collection_candidates where id=p_id for update;
  if not found then raise exception 'Collection candidate not found'; end if;
  if v_candidate.status<>'pending' then raise exception 'Candidate is not pending'; end if;
  if p_action='approve' then
   select * into v_collection from public.curated_collections where id=v_candidate.collection_id for update;
   if not found then raise exception 'Smart collection not found'; end if;
   select coalesce(max(position)+1,0) into v_position
   from public.collection_items where collection_id=v_candidate.collection_id;
   insert into public.collection_items(collection_id,product_id,position)
   values(v_candidate.collection_id,v_candidate.product_id,v_position)
   on conflict(collection_id,product_id) do update set position=excluded.position
   returning id into v_item_id;
   update public.collection_candidates set status='approved',reviewed_at=now(),reviewed_by=p_actor
   where id=p_id returning * into v_candidate;
   insert into public.admin_audit_log(actor_user_id,action_type,entity_type,entity_id,previous_value,new_value)
   values(p_actor,'RUBI_COLLECTION_CANDIDATE_APPROVED','collection_candidate',p_id,
    jsonb_build_object('status','pending'),
    jsonb_build_object('status','approved','collection_item_id',v_item_id));
   return jsonb_build_object('id',v_item_id,'candidate_id',p_id,'status','approved');
  end if;
  update public.collection_candidates set status='rejected',reviewed_at=now(),reviewed_by=p_actor
  where id=p_id returning * into v_candidate;
  insert into public.admin_audit_log(actor_user_id,action_type,entity_type,entity_id,previous_value,new_value)
  values(p_actor,'RUBI_COLLECTION_CANDIDATE_REJECTED','collection_candidate',p_id,
   jsonb_build_object('status','pending'),jsonb_build_object('status','rejected'));
  return jsonb_build_object('candidate_id',p_id,'status','rejected');
 end if;

 if p_action='prioritize' then
  if jsonb_typeof(p_payload) is distinct from 'object'
   or coalesce(p_payload->>'priority','') !~ '^[0-9]+$' then
   raise exception 'Invalid candidate priority';
  end if;
  v_priority:=(p_payload->>'priority')::integer;
  if v_priority<0 or v_priority>100000 then raise exception 'Candidate priority out of range'; end if;
  select * into v_candidate from public.collection_candidates where id=p_id for update;
  if not found then raise exception 'Collection candidate not found'; end if;
  if v_candidate.status<>'pending' then raise exception 'Only pending candidates can be prioritized'; end if;
  v_old_priority:=v_candidate.priority;
  update public.collection_candidates set priority=v_priority where id=p_id returning * into v_candidate;
  insert into public.admin_audit_log(actor_user_id,action_type,entity_type,entity_id,previous_value,new_value)
  values(p_actor,'RUBI_COLLECTION_CANDIDATE_PRIORITIZED','collection_candidate',p_id,
   jsonb_build_object('priority',v_old_priority),jsonb_build_object('priority',v_candidate.priority));
  return jsonb_build_object('id',p_id,'priority',v_priority);
 end if;

 select * into v_collection from public.curated_collections where id=p_id for update;
 if not found then raise exception 'Smart collection not found'; end if;
 v_rules:=coalesce(v_collection.candidate_rules,'{}'::jsonb);
 if jsonb_typeof(v_rules) is distinct from 'object' then raise exception 'candidate_rules must be an object'; end if;
 v_min_discount:=coalesce((v_rules->>'min_discount')::numeric,0);
 v_min_trend:=coalesce((v_rules->>'min_trend_velocity')::numeric,0);
 v_min_demand:=coalesce((v_rules->>'min_demand_score')::numeric,0);
 v_min_offer:=coalesce((v_rules->>'min_offer_score')::numeric,0);
 v_require_offer:=coalesce((v_rules->>'require_active_offer')::boolean,false);
 insert into public.collection_candidates(collection_id,product_id,matched_signal,status,suggested_at)
 select v_collection.id,p.id,
  jsonb_build_object('discount',coalesce(p.discount,0),'trend_velocity',p.trend_velocity,
   'demand_score',p.demand_score,'offer_score',coalesce(p.offer_score,0),
   'matched_rules',jsonb_build_array('discount >= '||v_min_discount,'trend_velocity >= '||v_min_trend,
    'demand_score >= '||v_min_demand,'offer_score >= '||v_min_offer)),
  'pending',now()
 from public.products p
 where p.status in ('active','published')
  and coalesce(p.discount,0)>=v_min_discount and p.trend_velocity>=v_min_trend
  and p.demand_score>=v_min_demand and coalesce(p.offer_score,0)>=v_min_offer
  and (not v_require_offer or (p.offer_group_id is not null and p.is_best_offer=true))
  and not exists(select 1 from public.collection_items i where i.collection_id=v_collection.id and i.product_id=p.id)
 on conflict(collection_id,product_id) do update
  set matched_signal=excluded.matched_signal,suggested_at=now()
  where public.collection_candidates.status='pending';
 get diagnostics v_count=row_count;
 insert into public.admin_audit_log(actor_user_id,action_type,entity_type,entity_id,previous_value,new_value)
 values(p_actor,'RUBI_SMART_COLLECTION_CANDIDATES_GENERATED','curated_collection',p_id,
  '{}'::jsonb,jsonb_build_object('generated_or_refreshed',v_count));
 return jsonb_build_object('collection_id',p_id,'generated',v_count);
end;
$fn$;

revoke all on function public.rubi_manage_smart_collection_audited(text,uuid,jsonb,uuid)
 from public,anon,authenticated;
grant execute on function public.rubi_manage_smart_collection_audited(text,uuid,jsonb,uuid)
 to service_role;
comment on function public.rubi_manage_smart_collection_audited(text,uuid,jsonb,uuid)
 is 'Owner-gated transactional smart collection CRUD, candidate priority and candidate generation with mandatory admin audit.';
