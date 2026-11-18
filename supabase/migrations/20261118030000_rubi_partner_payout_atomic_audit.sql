-- Sprint 247: commission payout settlement must identify its Owner in the same transaction.
-- Retire the legacy service-role-only overload so no caller can settle without an actor.
revoke all on function public.hub_settle_partner_commissions(uuid,uuid[],text,timestamptz,text)
 from public,anon,authenticated,service_role;

create or replace function public.hub_settle_partner_commissions(
 p_profile_id uuid,
 p_sale_ids uuid[],
 p_payment_reference text,
 p_paid_at timestamptz,
 p_note text,
 p_actor uuid
) returns uuid
language plpgsql
security definer
set search_path=''
as $$
declare
 v_count integer;
 v_total numeric(12,2);
 v_payout_id uuid;
 v_actor_email text;
begin
 if auth.role() <> 'service_role' then raise exception 'Service role required'; end if;
 if p_actor is null or not exists(
  select 1 from public.user_roles r where r.user_id=p_actor and r.role='owner'
 ) then raise exception 'Owner authorization required'; end if;
 if p_profile_id is null or coalesce(array_length(p_sale_ids,1),0)=0
  or array_length(p_sale_ids,1)>100 then raise exception 'No valid sales selected'; end if;
 if p_payment_reference is null or length(btrim(p_payment_reference)) not between 3 and 150
  then raise exception 'Payment reference required'; end if;
 if p_paid_at is null or p_paid_at>now() then raise exception 'Invalid payment date'; end if;
 if p_note is not null and length(p_note)>500 then raise exception 'Note is too long'; end if;
 if exists(select 1 from unnest(p_sale_ids) x group by x having count(*)>1)
  then raise exception 'Duplicate sale IDs'; end if;

 -- Lock the selected ledger rows before checking prior settlement.
 perform 1 from public.hub_partner_confirmed_sales s
 join public.hub_partner_referral_links l on l.id=s.referral_link_id
 where s.id=any(p_sale_ids) and l.commercial_profile_id=p_profile_id
 order by s.id for update of s;

 select count(*),coalesce(sum(s.commission_amount),0)
 into v_count,v_total
 from public.hub_partner_confirmed_sales s
 join public.hub_partner_referral_links l on l.id=s.referral_link_id
 where s.id=any(p_sale_ids) and l.commercial_profile_id=p_profile_id;
 if v_count<>array_length(p_sale_ids,1) or v_total<=0
  then raise exception 'Sales invalid or commissions zero'; end if;
 if exists(select 1 from public.hub_partner_commission_payout_items where sale_id=any(p_sale_ids))
  then raise exception 'One or more commissions already settled'; end if;

 insert into public.hub_partner_commission_payouts(
  commercial_profile_id,payment_reference,paid_amount,paid_at,note
 ) values(
  p_profile_id,btrim(p_payment_reference),v_total,p_paid_at,p_note
 ) returning id into v_payout_id;

 insert into public.hub_partner_commission_payout_items(payout_id,sale_id,commission_amount)
 select v_payout_id,s.id,s.commission_amount
 from public.hub_partner_confirmed_sales s where s.id=any(p_sale_ids);

 select u.email into v_actor_email from auth.users u where u.id=p_actor;
 insert into public.admin_audit_log(
  actor_user_id,actor_email,action_type,entity_type,entity_id,previous_value,new_value
 ) values(
  p_actor,v_actor_email,'RUBI_PARTNER_COMMISSION_PAYOUT_SETTLED','partner_commission_payout',v_payout_id,
  '{}'::jsonb,
  jsonb_build_object(
   'commercial_profile_id',p_profile_id,
   'paid_amount',v_total,
   'sales_count',v_count,
   'payment_reference_recorded',true
  )
 );
 return v_payout_id;
end;
$$;

revoke all on function public.hub_settle_partner_commissions(uuid,uuid[],text,timestamptz,text,uuid)
 from public,anon,authenticated;
grant execute on function public.hub_settle_partner_commissions(uuid,uuid[],text,timestamptz,text,uuid)
 to service_role;
comment on function public.hub_settle_partner_commissions(uuid,uuid[],text,timestamptz,text,uuid)
 is 'Owner-authorized partner commission payout; payout rows and administrative audit commit atomically.';
