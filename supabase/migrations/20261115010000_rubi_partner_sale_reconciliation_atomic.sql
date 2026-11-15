-- Sprint 204 — manual supplier reconciliation is a single Owner-audited transaction.
-- This procedure does not verify a provider payment on its own: documentary confirmation is human.
-- Existing UNIQUE(source, external_order_id) continues to enforce global manual deduplication.
create or replace function public.rubi_reconcile_partner_sale_audited(
 p_referral_link_id uuid, p_external_order_id text, p_gross_amount numeric,
 p_provider_name text, p_payment_evidence_reference text, p_payment_verified_at timestamptz,
 p_actor uuid
) returns uuid language plpgsql security invoker set search_path=''
as $$
declare
 v_link public.hub_partner_referral_links%rowtype;
 v_agreement public.hub_partner_agreements%rowtype;
 v_sale_id uuid;
begin
 if p_actor is null or not exists (
  select 1 from public.user_roles r where r.user_id=p_actor and r.role='owner'
 ) then raise exception 'Owner authorization required'; end if;
 if p_referral_link_id is null or length(btrim(coalesce(p_external_order_id,''))) not between 3 and 150
 then raise exception 'Invalid external order reference'; end if;
 if p_gross_amount is null or p_gross_amount<=0 or p_gross_amount>10000000
  or p_gross_amount<>round(p_gross_amount,2)
 then raise exception 'Invalid gross amount'; end if;
 if length(btrim(coalesce(p_provider_name,''))) not between 2 and 100
  or length(btrim(coalesce(p_payment_evidence_reference,''))) not between 8 and 500
 then raise exception 'Supplier and documentary reference are required'; end if;
 if p_payment_verified_at is null or p_payment_verified_at>now()
  or p_payment_verified_at<now()-interval '366 days'
 then raise exception 'Invalid verification timestamp'; end if;

 select l.* into v_link from public.hub_partner_referral_links l
  where l.id=p_referral_link_id for share;
 if not found or v_link.active is distinct from true then
  raise exception 'Active referral link required'; end if;
 perform 1 from public.commercial_profiles p
  where p.id=v_link.commercial_profile_id
    and p.audience='partner' and p.status='approved' for share;
 if not found then raise exception 'Approved partner profile required'; end if;
 perform 1 from public.hub_partner_product_grants g
  where g.commercial_profile_id=v_link.commercial_profile_id
    and g.product_id=v_link.product_id and g.active=true for share;
 if not found then raise exception 'Active product grant required'; end if;
 select a.* into v_agreement from public.hub_partner_agreements a
  where a.commercial_profile_id=v_link.commercial_profile_id and a.active=true for share;
 if not found or v_agreement.commission_percent is null then
  raise exception 'Active commercial agreement required'; end if;

 -- A preflight SELECT is not enough against concurrent requests.
 -- The ledger's UNIQUE(source, external_order_id) is authoritative for duplicate rejection.
 insert into public.hub_partner_confirmed_sales (
  referral_link_id,external_order_id,source,gross_amount,commission_percent,
  provider_name,payment_evidence_reference,payment_verified_at
 ) values (
  p_referral_link_id,btrim(p_external_order_id),'admin_reconciliation',
  p_gross_amount,v_agreement.commission_percent,
  btrim(p_provider_name),btrim(p_payment_evidence_reference),p_payment_verified_at
 ) returning id into v_sale_id;
 -- The audit and sale insert commit or roll back together. Do not log evidence reference.
 insert into public.admin_audit_log(
  actor_user_id,actor_email,action_type,entity_type,entity_id,previous_value,new_value
 ) values (
  p_actor,null,'RUBI_PARTNER_SALE_MANUALLY_RECONCILED','partner_sale',v_sale_id,
  '{}'::jsonb,
  jsonb_build_object('source','admin_reconciliation',
   'referral_link_id',p_referral_link_id,'provider',btrim(p_provider_name),
   'gross_amount',p_gross_amount,'commission_percent',v_agreement.commission_percent)
 );
 return v_sale_id;
end;
$$;
revoke all on function public.rubi_reconcile_partner_sale_audited(uuid,text,numeric,text,text,timestamptz,uuid)
 from public,anon,authenticated;
grant execute on function public.rubi_reconcile_partner_sale_audited(uuid,text,numeric,text,text,timestamptz,uuid)
 to service_role;
comment on function public.rubi_reconcile_partner_sale_audited(uuid,text,numeric,text,text,timestamptz,uuid)
 is 'Manual documentary reconciliation only; Owner-verified evidence is not a supplier webhook. Atomic ledger insert and administrative audit.';
