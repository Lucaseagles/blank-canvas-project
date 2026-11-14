-- RUBI Sprint 182: audited page publication and video-variant linking.
-- Owner-only service RPCs; each state change and sanitized audit record are atomic.
create or replace function public.rubi_set_movement_page_publication_audited(
 p_actor uuid,p_plan_id uuid,p_publish boolean,p_confirmed_evidence boolean,p_expected_revision integer
) returns table(saved_id uuid,new_revision integer)
language plpgsql security invoker set search_path=''
as $$
declare plan_row public.rubi_movement_distribution%rowtype;
 variant_row public.rubi_movement_variants%rowtype;
 movement_row public.rubi_movements%rowtype;
 product_row public.hub_products%rowtype;
 supplier_active boolean;
 supplier_host text;
 next_revision integer;
begin
 if p_actor is null or not exists(select 1 from public.user_roles r
  where r.user_id=p_actor and r.role='owner') then raise exception 'Owner required'; end if;
 if p_publish is null or p_expected_revision is null then raise exception 'Publication action or version missing'; end if;
 select * into plan_row from public.rubi_movement_distribution d where d.id=p_plan_id for update;
 if not found or plan_row.revision<>p_expected_revision then raise exception 'Plan changed; reload'; end if;
 if p_publish then
  if p_confirmed_evidence is distinct from true then raise exception 'Evidence confirmation required'; end if;
  select * into variant_row from public.rubi_movement_variants v where v.id=plan_row.variant_id for share;
  if not found or variant_row.status<>'review' or variant_row.media_rights_confirmed is distinct from true
   or char_length(btrim(variant_row.name))<3 or char_length(btrim(variant_row.creative_hook))<8
   or char_length(btrim(variant_row.creative_script))<20 or char_length(btrim(variant_row.page_headline))<8
   or char_length(btrim(variant_row.page_body))<20 or char_length(btrim(variant_row.call_to_action))<5
   or char_length(btrim(variant_row.proof_notes))<12 then
   raise exception 'Variant evidence and rights must be reviewed'; end if;
  select * into movement_row from public.rubi_movements m where m.id=variant_row.movement_id for share;
  if not found or movement_row.status<>'review' or movement_row.audience<>'consumer'
   or char_length(btrim(movement_row.buyer_persona))<12
   or char_length(btrim(movement_row.problem))<12
   or char_length(btrim(movement_row.desired_outcome))<12
   or char_length(btrim(movement_row.truthful_promise))<12
   or char_length(btrim(movement_row.differentiator))<12
   or char_length(btrim(movement_row.narrative))<30
   or char_length(btrim(movement_row.evidence_notes))<12 then
   raise exception 'Consumer movement must be reviewed'; end if;
  select * into product_row from public.hub_products p where p.id=movement_row.product_id for share;
  if not found then raise exception 'Product not found'; end if;
  select s.active,s.checkout_host into supplier_active,supplier_host from public.hub_suppliers s
   where s.id=product_row.supplier_id for share;
  if not found or not product_row.active or not product_row.checkout_verified
   or product_row.retail_price<=0 or supplier_active is distinct from true
   or supplier_host is null or supplier_host !~ '^[a-z0-9.-]+[.][a-z]{2,63}$'
   or product_row.checkout_url is null
   or product_row.checkout_url !~ ('^https://' || replace(supplier_host,'.','[.]') || '(/|[?]|$)')
   or product_row.checkout_url ~ '[#@]' then
   raise exception 'Official checkout not ready'; end if;
  -- A second published row with the same channel/campaign makes the public lookup ambiguous.
  if exists(select 1 from public.rubi_movement_distribution d
    where d.id<>p_plan_id and d.channel=plan_row.channel and d.campaign=plan_row.campaign
     and d.page_published_at is not null) then
   raise exception 'Campaign publication collision'; end if;
  if plan_row.page_published_at is not null then raise exception 'Already published'; end if;
  update public.rubi_movement_distribution d
   set page_published_at=now(),published_variant_revision=variant_row.revision,
    published_movement_revision=movement_row.revision,
    updated_at=now(),revision=plan_row.revision+1
  where d.id=p_plan_id returning revision into next_revision;
 else
  if plan_row.page_published_at is null then raise exception 'Already unpublished'; end if;
  update public.rubi_movement_distribution d
   set page_published_at=null,published_variant_revision=null,published_movement_revision=null,
    updated_at=now(),revision=plan_row.revision+1
  where d.id=p_plan_id returning revision into next_revision;
 end if;
 insert into public.admin_audit_log(actor_user_id,actor_email,action_type,entity_type,
  entity_id,previous_value,new_value)
 values(p_actor,null,case when p_publish then 'RUBI_MOVEMENT_PAGE_PUBLISHED' else 'RUBI_MOVEMENT_PAGE_UNPUBLISHED' end,
   'rubi_movement_distribution',p_plan_id,
   jsonb_build_object('was_published',plan_row.page_published_at is not null,'revision',plan_row.revision),
   jsonb_build_object('is_published',p_publish,'revision',next_revision));
 return query select p_plan_id,next_revision;
end;
$$;
revoke all on function public.rubi_set_movement_page_publication_audited(uuid,uuid,boolean,boolean,integer)
 from public,anon,authenticated;
grant execute on function public.rubi_set_movement_page_publication_audited(uuid,uuid,boolean,boolean,integer)
 to service_role;

create or replace function public.rubi_set_variant_video_link_audited(
 p_actor uuid,p_variant uuid,p_video uuid,p_link boolean
) returns table(saved_video_id uuid)
language plpgsql security invoker set search_path=''
as $$
declare variant_row public.rubi_movement_variants%rowtype;
 video_row public.videos%rowtype;
 linked_variant uuid;
begin
 if p_actor is null or not exists(select 1 from public.user_roles r
  where r.user_id=p_actor and r.role='owner') then raise exception 'Owner required'; end if;
 if p_link is null then raise exception 'Link action required'; end if;
 -- Lock the video first: prevents parallel ownership claims of the same media.
 select * into video_row from public.videos v where v.id=p_video for update;
 if not found then raise exception 'Video not found'; end if;
 select * into variant_row from public.rubi_movement_variants v where v.id=p_variant for share;
 if not found then raise exception 'Variant not found'; end if;
 if p_link and (variant_row.format<>'short_video' or variant_row.status<>'review'
   or video_row.status<>'published' or
   (video_row.scheduled_for is not null and video_row.scheduled_for>now()))
 then raise exception 'Video and variant must be publication ready'; end if;
 select l.variant_id into linked_variant from public.rubi_variant_video_links l where l.video_id=p_video for update;
 if p_link then
  if linked_variant is not null then raise exception 'Video already linked; unlink first'; end if;
  insert into public.rubi_variant_video_links(video_id,variant_id)
   values(p_video,p_variant);
 else
  if linked_variant is distinct from p_variant then raise exception 'Video link changed or missing'; end if;
  delete from public.rubi_variant_video_links where video_id=p_video and variant_id=p_variant;
 end if;
 insert into public.admin_audit_log(actor_user_id,actor_email,action_type,entity_type,
   entity_id,previous_value,new_value)
 values(p_actor,null,case when p_link then 'RUBI_VARIANT_VIDEO_LINKED' else 'RUBI_VARIANT_VIDEO_UNLINKED' end,
  'rubi_variant_video_link',p_video,
  jsonb_build_object('variant_id',linked_variant),
  jsonb_build_object('variant_id',case when p_link then p_variant else null end));
 return query select p_video;
end;
$$;
revoke all on function public.rubi_set_variant_video_link_audited(uuid,uuid,uuid,boolean)
 from public,anon,authenticated;
grant execute on function public.rubi_set_variant_video_link_audited(uuid,uuid,uuid,boolean)
 to service_role;
