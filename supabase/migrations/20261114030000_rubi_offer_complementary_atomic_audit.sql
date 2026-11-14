-- Sprint 184 | Commercial editorial changes + Owner audit are atomic.
-- Do not mistake these changes for actual checkout charges or attributed sales.
alter table public.rubi_offer_playbooks add column if not exists revision integer not null default 1 check (revision>0);
alter table public.rubi_complementary_offers add column if not exists revision integer not null default 1 check (revision>0);

create or replace function public.rubi_save_offer_playbook_audited(
 p_actor uuid,p_product uuid,p_expected_revision integer,
 p_audience text,p_promise text,p_benefits text,p_proof text,p_hook text,p_script text,
 p_headline text,p_body text,p_objections text,p_movement text,p_channels text[],p_stage text
) returns table(saved_revision integer)
language plpgsql security invoker set search_path='' as $$
declare old_row public.rubi_offer_playbooks%rowtype; next_revision integer;
begin
 if p_actor is null or not exists(select 1 from public.user_roles r where r.user_id=p_actor and r.role='owner')
 then raise exception 'Owner required'; end if;
 if p_audience not in ('consumer','merchant','partner') or p_stage not in ('draft','ready_for_review')
  or p_promise is null or char_length(p_promise)>400
  or p_benefits is null or char_length(p_benefits)>2000
  or p_proof is null or char_length(p_proof)>1500
  or p_hook is null or char_length(p_hook)>280
  or p_script is null or char_length(p_script)>2000
  or p_headline is null or char_length(p_headline)>240
  or p_body is null or char_length(p_body)>4000
  or p_objections is null or char_length(p_objections)>1800
  or p_movement is null or char_length(p_movement)>3000
  or p_channels is null or cardinality(p_channels)>8
  or array_position(p_channels,null) is not null
  or (select count(distinct ch) from unnest(p_channels) ch)<>cardinality(p_channels)
  or not(p_channels <@ array['instagram','tiktok','rubi_feed','whatsapp','telegram','partners','organic_pages','email']::text[])
 then raise exception 'Invalid offer playbook'; end if;
 if p_stage='ready_for_review' and
  (char_length(btrim(p_promise))=0 or char_length(btrim(p_proof))=0
  or char_length(btrim(p_headline))=0 or char_length(btrim(p_body))=0 or cardinality(p_channels)=0)
 then raise exception 'Playbook review evidence incomplete'; end if;
 perform 1 from public.hub_products p where p.id=p_product for update;
 if not found then raise exception 'Product not found'; end if;
 select * into old_row from public.rubi_offer_playbooks p where p.product_id=p_product for update;
 if found then
  if old_row.revision is distinct from p_expected_revision then raise exception 'Offer changed; reload'; end if;
  update public.rubi_offer_playbooks p set audience=p_audience,promise=p_promise,
   verified_benefits=p_benefits,proof_notes=p_proof,creative_hook=p_hook,creative_script=p_script,
   page_headline=p_headline,page_body=p_body,objections=p_objections,movement_plan=p_movement,
   channels=p_channels,stage=p_stage,published_at=null,revision=old_row.revision+1,updated_at=now()
   where p.product_id=p_product returning revision into next_revision;
 else
  if p_expected_revision is not null then raise exception 'Offer not found; reload'; end if;
  insert into public.rubi_offer_playbooks(product_id,audience,promise,verified_benefits,proof_notes,
   creative_hook,creative_script,page_headline,page_body,objections,movement_plan,channels,stage,published_at)
  values(p_product,p_audience,p_promise,p_benefits,p_proof,p_hook,p_script,p_headline,p_body,
   p_objections,p_movement,p_channels,p_stage,null) returning revision into next_revision;
 end if;
 insert into public.admin_audit_log(actor_user_id,actor_email,action_type,entity_type,entity_id,previous_value,new_value)
 values(p_actor,null,'RUBI_OFFER_PLAYBOOK_SAVED','rubi_offer_playbook',p_product,
  case when old_row.product_id is null then '{}'::jsonb else
   jsonb_build_object('stage',old_row.stage,'revision',old_row.revision,'published',old_row.published_at is not null) end,
  jsonb_build_object('stage',p_stage,'revision',next_revision,'published',false,'audience',p_audience));
 return query select next_revision;
end; $$;
revoke all on function public.rubi_save_offer_playbook_audited(uuid,uuid,integer,text,text,text,text,text,text,text,text,text,text,text[],text)
 from public,anon,authenticated;
grant execute on function public.rubi_save_offer_playbook_audited(uuid,uuid,integer,text,text,text,text,text,text,text,text,text,text,text[],text)
 to service_role;

create or replace function public.rubi_set_offer_playbook_publication_audited(
 p_actor uuid,p_product uuid,p_expected_revision integer,p_publish boolean,p_evidence boolean
) returns table(saved_revision integer)
language plpgsql security invoker set search_path='' as $$
declare current_offer public.rubi_offer_playbooks%rowtype; product public.hub_products%rowtype;
 supplier_active boolean; supplier_host text; next_revision integer;
begin
 if p_actor is null or not exists(select 1 from public.user_roles r where r.user_id=p_actor and r.role='owner')
 then raise exception 'Owner required'; end if;
 if p_publish is null or p_expected_revision is null then raise exception 'Invalid publish request'; end if;
 select * into current_offer from public.rubi_offer_playbooks p where p.product_id=p_product for update;
 if not found or current_offer.revision<>p_expected_revision then raise exception 'Offer changed; reload'; end if;
 if (current_offer.published_at is not null)=p_publish then raise exception 'Already in requested publication state'; end if;
 if p_publish then
  if p_evidence is distinct from true or current_offer.stage<>'ready_for_review'
   or current_offer.audience<>'consumer'
   or char_length(btrim(current_offer.promise))<10
   or char_length(btrim(current_offer.verified_benefits))<10
   or char_length(btrim(current_offer.proof_notes))<10
   or char_length(btrim(current_offer.creative_hook))<6
   or char_length(btrim(current_offer.creative_script))<20
   or char_length(btrim(current_offer.page_headline))<6
   or char_length(btrim(current_offer.page_body))<20
   or char_length(btrim(current_offer.objections))<10
   or char_length(btrim(current_offer.movement_plan))<20
   or cardinality(current_offer.channels)=0
  then raise exception 'Offer readiness and evidence not approved'; end if;
  select * into product from public.hub_products p where p.id=p_product for share;
  if not found or not product.active or not product.checkout_verified or product.retail_price<=0
  then raise exception 'Product not ready'; end if;
  select s.active,s.checkout_host into supplier_active,supplier_host
   from public.hub_suppliers s where s.id=product.supplier_id for share;
  if not found or supplier_active is distinct from true or supplier_host is null
    or product.checkout_url is null
    or product.checkout_url !~ ('^https://' || replace(supplier_host,'.','[.]') || '(/|[?]|$)')
    or product.checkout_url ~ '[#@]' then raise exception 'Checkout not verified'; end if;
 end if;
 update public.rubi_offer_playbooks p set published_at=case when p_publish then now() else null end,
  revision=current_offer.revision+1,updated_at=now() where p.product_id=p_product
 returning revision into next_revision;
 insert into public.admin_audit_log(actor_user_id,actor_email,action_type,entity_type,entity_id,previous_value,new_value)
 values(p_actor,null,case when p_publish then 'RUBI_OFFER_PUBLISHED' else 'RUBI_OFFER_UNPUBLISHED' end,
  'rubi_offer_playbook',p_product,
  jsonb_build_object('published',current_offer.published_at is not null,'revision',current_offer.revision),
  jsonb_build_object('published',p_publish,'revision',next_revision));
 return query select next_revision;
end; $$;
revoke all on function public.rubi_set_offer_playbook_publication_audited(uuid,uuid,integer,boolean,boolean)
 from public,anon,authenticated;
grant execute on function public.rubi_set_offer_playbook_publication_audited(uuid,uuid,integer,boolean,boolean)
 to service_role;

create or replace function public.rubi_save_complementary_offer_audited(
 p_actor uuid,p_id uuid,p_expected_revision integer,p_primary uuid,p_suggested uuid,
 p_kind text,p_headline text,p_explanation text,p_position integer,p_active boolean
) returns table(saved_id uuid,saved_revision integer)
language plpgsql security invoker set search_path='' as $$
declare prior public.rubi_complementary_offers%rowtype; main_product public.hub_products%rowtype;
 secondary_product public.hub_products%rowtype; main_active boolean; secondary_active boolean;
 main_host text; secondary_host text; result_id uuid; next_revision integer;
begin
 if p_actor is null or not exists(select 1 from public.user_roles r where r.user_id=p_actor and r.role='owner')
 then raise exception 'Owner required'; end if;
 if p_primary=p_suggested or p_kind not in ('order_bump','upsell','cross_sell','downsell')
  or p_headline is null or char_length(btrim(p_headline)) not between 8 and 180
  or p_explanation is null or char_length(p_explanation)>700 or p_position is null or p_position not between 0 and 10000
  or p_active is null then raise exception 'Invalid complementary offer'; end if;
 select * into main_product from public.hub_products p where p.id=p_primary for share;
 select * into secondary_product from public.hub_products p where p.id=p_suggested for share;
 if main_product.id is null or secondary_product.id is null or main_product.retail_price<=0
  or secondary_product.retail_price<=0 or (p_kind='downsell' and secondary_product.retail_price>=main_product.retail_price)
 then raise exception 'Products/prices invalid for suggestion'; end if;
 if p_active then
  select s.active,s.checkout_host into main_active,main_host from public.hub_suppliers s
   where s.id=main_product.supplier_id for share;
  select s.active,s.checkout_host into secondary_active,secondary_host from public.hub_suppliers s
   where s.id=secondary_product.supplier_id for share;
  if not main_product.active or not secondary_product.active
   or not main_product.checkout_verified or not secondary_product.checkout_verified
   or main_active is distinct from true or secondary_active is distinct from true
   or main_host is null or secondary_host is null
   or main_product.checkout_url is null or secondary_product.checkout_url is null
   or main_product.checkout_url !~ ('^https://' || replace(main_host,'.','[.]') || '(/|[?]|$)')
   or secondary_product.checkout_url !~ ('^https://' || replace(secondary_host,'.','[.]') || '(/|[?]|$)')
   or main_product.checkout_url ~ '[#@]' or secondary_product.checkout_url ~ '[#@]'
   then raise exception 'Both official checkouts must be approved'; end if;
 end if;
 if p_id is null then
  if p_expected_revision is not null then raise exception 'Unexpected revision'; end if;
  insert into public.rubi_complementary_offers(primary_product_id,suggested_product_id,kind,headline,explanation,position,active)
   values(p_primary,p_suggested,p_kind,p_headline,p_explanation,p_position,p_active)
   returning id,revision into result_id,next_revision;
 else
  select * into prior from public.rubi_complementary_offers c where c.id=p_id for update;
  if not found or prior.primary_product_id<>p_primary or prior.revision is distinct from p_expected_revision
  then raise exception 'Suggestion changed; reload'; end if;
  update public.rubi_complementary_offers c set suggested_product_id=p_suggested,kind=p_kind,
   headline=p_headline,explanation=p_explanation,position=p_position,active=p_active,
   revision=prior.revision+1,updated_at=now() where c.id=p_id
   returning id,revision into result_id,next_revision;
 end if;
 insert into public.admin_audit_log(actor_user_id,actor_email,action_type,entity_type,entity_id,previous_value,new_value)
 values(p_actor,null,'RUBI_COMPLEMENTARY_OFFER_SAVED','rubi_complementary_offer',result_id,
  case when prior.id is null then '{}'::jsonb else
   jsonb_build_object('active',prior.active,'revision',prior.revision,'kind',prior.kind) end,
  jsonb_build_object('active',p_active,'revision',next_revision,'kind',p_kind,
   'primary_product_id',p_primary,'suggested_product_id',p_suggested));
 return query select result_id,next_revision;
end; $$;
revoke all on function public.rubi_save_complementary_offer_audited(uuid,uuid,integer,uuid,uuid,text,text,text,integer,boolean)
 from public,anon,authenticated;
grant execute on function public.rubi_save_complementary_offer_audited(uuid,uuid,integer,uuid,uuid,text,text,text,integer,boolean)
 to service_role;
