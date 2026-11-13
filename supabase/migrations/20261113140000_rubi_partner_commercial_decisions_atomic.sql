-- Sprint 176: one atomic Owner decision + audit for commercial approvals, agreements and SKU grants.
-- This migration does not create a partner, grant, agreement, checkout or payment.
alter table public.hub_partner_agreements
 add column if not exists revision integer not null default 1 check(revision>0);
alter table public.hub_partner_product_grants
 add column if not exists revision integer not null default 1 check(revision>0);

create or replace function public.rubi_decide_commercial_profile_audited(
 p_actor uuid,p_profile_id uuid,p_decision text
) returns table(saved_id uuid,new_status text)
language plpgsql security invoker set search_path=''
as $$
declare original public.commercial_profiles%rowtype;
begin
 if p_actor is null or not exists(select 1 from public.user_roles r
  where r.user_id=p_actor and r.role='owner') then raise exception 'Owner required'; end if;
 if p_decision not in ('approved','rejected') then raise exception 'Invalid decision'; end if;
 select p.* into original from public.commercial_profiles p
  where p.id=p_profile_id for update;
 if not found or original.audience not in ('partner','merchant') or original.status<>'pending' then
  raise exception 'Pending commercial profile not found'; end if;
 update public.commercial_profiles p set status=p_decision,updated_at=now()
 where p.id=p_profile_id and p.status='pending';
 insert into public.admin_audit_log(
  actor_user_id,actor_email,action_type,entity_type,entity_id,previous_value,new_value
 ) values(p_actor,null,'RUBI_COMMERCIAL_PROFILE_DECIDED','commercial_profile',p_profile_id,
  jsonb_build_object('audience',original.audience,'status',original.status),
  jsonb_build_object('audience',original.audience,'status',p_decision));
 return query select p_profile_id,p_decision;
end;
$$;
revoke all on function public.rubi_decide_commercial_profile_audited(uuid,uuid,text)
 from public,anon,authenticated;
grant execute on function public.rubi_decide_commercial_profile_audited(uuid,uuid,text) to service_role;

create or replace function public.rubi_set_partner_agreement_audited(
 p_actor uuid,p_profile_id uuid,p_percent numeric,p_active boolean,p_expected_revision integer
) returns table(saved_id uuid,saved_revision integer)
language plpgsql security invoker set search_path=''
as $$
declare profile_status text; existing public.hub_partner_agreements%rowtype;
        result_id uuid; result_revision integer;
begin
 if p_actor is null or not exists(select 1 from public.user_roles r
  where r.user_id=p_actor and r.role='owner') then raise exception 'Owner required'; end if;
 if p_percent is null or p_percent<0 or p_percent>100 or
   p_percent<>round(p_percent,2) or p_active is null then raise exception 'Invalid agreement'; end if;
 select p.status into profile_status from public.commercial_profiles p
  where p.id=p_profile_id and p.audience='partner' for update;
 if not found then raise exception 'Partner profile not found'; end if;
 if p_active and profile_status<>'approved' then raise exception 'Partner must be approved'; end if;
 select a.* into existing from public.hub_partner_agreements a
  where a.commercial_profile_id=p_profile_id for update;
 if found then
  if p_expected_revision is distinct from existing.revision then
   raise exception 'Agreement changed; reload before editing'; end if;
  update public.hub_partner_agreements a
   set commission_percent=p_percent,active=p_active,updated_at=now(),revision=existing.revision+1
   where a.id=existing.id returning id,revision into result_id,result_revision;
 else
  if p_expected_revision is not null then raise exception 'Agreement missing; reload'; end if;
  insert into public.hub_partner_agreements(commercial_profile_id,commission_percent,active)
   values(p_profile_id,p_percent,p_active)
   returning id,revision into result_id,result_revision;
 end if;
 insert into public.admin_audit_log(
  actor_user_id,actor_email,action_type,entity_type,entity_id,previous_value,new_value
 ) values(p_actor,null,
   case when existing.id is null then 'RUBI_PARTNER_AGREEMENT_CREATED' else 'RUBI_PARTNER_AGREEMENT_UPDATED' end,
   'hub_partner_agreement',result_id,
   case when existing.id is null then '{}'::jsonb else
      jsonb_build_object('active',existing.active,'commission_percent',existing.commission_percent,'revision',existing.revision) end,
   jsonb_build_object('active',p_active,'commission_percent',p_percent,'revision',result_revision,'commercial_profile_id',p_profile_id));
 return query select result_id,result_revision;
end;
$$;
revoke all on function public.rubi_set_partner_agreement_audited(uuid,uuid,numeric,boolean,integer)
 from public,anon,authenticated;
grant execute on function public.rubi_set_partner_agreement_audited(uuid,uuid,numeric,boolean,integer)
 to service_role;

create or replace function public.rubi_set_partner_product_grant_audited(
 p_actor uuid,p_profile_id uuid,p_product_id uuid,p_active boolean,p_expected_revision integer
) returns table(saved_id uuid,saved_revision integer)
language plpgsql security invoker set search_path=''
as $$
declare profile_status text; product_record public.hub_products%rowtype;
        supplier_active boolean; supplier_host text;
        existing public.hub_partner_product_grants%rowtype;
        result_id uuid; result_revision integer;
begin
 if p_actor is null or not exists(select 1 from public.user_roles r
  where r.user_id=p_actor and r.role='owner') then raise exception 'Owner required'; end if;
 if p_active is null then raise exception 'Invalid grant request'; end if;
 select p.status into profile_status from public.commercial_profiles p
   where p.id=p_profile_id and p.audience='partner' for update;
 if not found then raise exception 'Partner profile not found'; end if;
 select p.* into product_record from public.hub_products p
  where p.id=p_product_id for update;
 if not found then raise exception 'Product not found'; end if;
 select s.active,s.checkout_host into supplier_active,supplier_host from public.hub_suppliers s
  where s.id=product_record.supplier_id for share;
 if not found then raise exception 'Supplier not found'; end if;
 if p_active then
  if profile_status<>'approved' or not product_record.active or product_record.retail_price<=0
   or not supplier_active or not product_record.checkout_verified
   or supplier_host is null
   or coalesce(substring(product_record.checkout_url from '^https://([^/?#]+)'), '')<>supplier_host
   or position('#' in coalesce(product_record.checkout_url,''))>0 then
   raise exception 'Partner and official retail checkout must be eligible';
  end if;
 end if;
 select g.* into existing from public.hub_partner_product_grants g
  where g.commercial_profile_id=p_profile_id and g.product_id=p_product_id for update;
 if found then
  if p_expected_revision is distinct from existing.revision then
   raise exception 'Grant changed; reload before editing'; end if;
  if existing.active=p_active then raise exception 'Grant already has requested state'; end if;
  update public.hub_partner_product_grants g
   set active=p_active,revision=existing.revision+1
   where g.id=existing.id returning id,revision into result_id,result_revision;
 else
  if p_expected_revision is not null or not p_active then raise exception 'Grant missing or stale'; end if;
  insert into public.hub_partner_product_grants(commercial_profile_id,product_id,active)
   values(p_profile_id,p_product_id,true)
   returning id,revision into result_id,result_revision;
 end if;
 insert into public.admin_audit_log(
  actor_user_id,actor_email,action_type,entity_type,entity_id,previous_value,new_value
 ) values(p_actor,null,case when p_active then 'RUBI_PARTNER_PRODUCT_GRANTED' else 'RUBI_PARTNER_PRODUCT_REVOKED' end,
   'hub_partner_product_grant',result_id,
   case when existing.id is null then '{}'::jsonb else jsonb_build_object('active',existing.active,'revision',existing.revision) end,
   jsonb_build_object('active',p_active,'revision',result_revision,'product_id',p_product_id,'commercial_profile_id',p_profile_id));
 return query select result_id,result_revision;
end;
$$;
revoke all on function public.rubi_set_partner_product_grant_audited(uuid,uuid,uuid,boolean,integer)
 from public,anon,authenticated;
grant execute on function public.rubi_set_partner_product_grant_audited(uuid,uuid,uuid,boolean,integer)
 to service_role;
