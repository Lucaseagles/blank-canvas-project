-- Sprint 250: allow multiple audited installments per commission, capped at the sale's remaining balance.
alter table public.hub_partner_commission_payout_items
  drop constraint if exists hub_partner_commission_payout_items_sale_id_key;

-- Remove the legacy all-or-nothing RPC overloads. The replacement accepts explicit allocations.
drop function if exists public.hub_settle_partner_commissions(uuid,uuid[],text,timestamptz,text);
drop function if exists public.hub_settle_partner_commissions(uuid,uuid[],text,timestamptz,text,uuid);

create or replace function public.hub_settle_partner_commissions(
 p_profile_id uuid,
 p_allocations jsonb,
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
 v_total numeric(12,2) := 0;
 v_payout_id uuid;
 v_actor_email text;
 v_allocation record;
 v_commission numeric(12,2);
 v_paid numeric(12,2);
 v_amount numeric(12,2);
begin
 -- EXECUTE is revoked from PUBLIC/anon/authenticated and granted only to service_role.
 -- Keep the Owner check on the explicit actor supplied by the trusted server function.
 if p_actor is null or not exists(
  select 1 from public.user_roles r where r.user_id=p_actor and r.role='owner'
 ) then raise exception 'Owner authorization required'; end if;
 if p_profile_id is null or jsonb_typeof(p_allocations)<>'array'
  or jsonb_array_length(p_allocations)=0 or jsonb_array_length(p_allocations)>100
  then raise exception 'No valid commission allocations'; end if;
 if p_payment_reference is null or length(btrim(p_payment_reference)) not between 3 and 150
  then raise exception 'Payment reference required'; end if;
 if p_paid_at is null or p_paid_at>now() then raise exception 'Invalid payment date'; end if;
 if p_note is not null and length(p_note)>500 then raise exception 'Note is too long'; end if;

 if exists(
  select 1 from jsonb_to_recordset(p_allocations) as x(sale_id uuid, amount numeric)
  group by x.sale_id having count(*)>1
 ) then raise exception 'Duplicate sale allocations'; end if;

 -- Lock every underlying sale in deterministic order before computing remaining balances.
 perform 1
 from public.hub_partner_confirmed_sales s
 join public.hub_partner_referral_links l on l.id=s.referral_link_id
 join jsonb_to_recordset(p_allocations) as x(sale_id uuid, amount numeric) on x.sale_id=s.id
 where l.commercial_profile_id=p_profile_id
 order by s.id
 for update of s;

 select count(*) into v_count
 from jsonb_to_recordset(p_allocations) as x(sale_id uuid, amount numeric);
 if v_count<>jsonb_array_length(p_allocations) then raise exception 'Invalid allocations'; end if;

 for v_allocation in
  select x.sale_id,x.amount from jsonb_to_recordset(p_allocations) as x(sale_id uuid, amount numeric)
  order by x.sale_id
 loop
  if v_allocation.amount is null or v_allocation.amount<=0
   or v_allocation.amount<>round(v_allocation.amount,2)
   then raise exception 'Installment amount must be positive with at most two decimals'; end if;

  select s.commission_amount into v_commission
  from public.hub_partner_confirmed_sales s
  join public.hub_partner_referral_links l on l.id=s.referral_link_id
  where s.id=v_allocation.sale_id and l.commercial_profile_id=p_profile_id;
  if not found then raise exception 'Sale does not belong to this partner'; end if;
  if v_commission is null or v_commission<=0 then
   raise exception 'Sale commission must be a positive confirmed amount';
  end if;

  select coalesce(sum(i.commission_amount),0) into v_paid
  from public.hub_partner_commission_payout_items i
  where i.sale_id=v_allocation.sale_id;

  if v_paid<0 or v_paid>v_commission then
   raise exception 'Existing payout allocations exceed the sale commission';
  end if;
  v_amount:=v_allocation.amount;
  if v_amount>v_commission-v_paid then raise exception 'Installment exceeds remaining commission'; end if;
  v_total:=v_total+v_amount;
 end loop;

 if v_total<=0 then raise exception 'Payout amount must be positive'; end if;

 insert into public.hub_partner_commission_payouts(
  commercial_profile_id,payment_reference,paid_amount,paid_at,note
 ) values(
  p_profile_id,btrim(p_payment_reference),v_total,p_paid_at,p_note
 ) returning id into v_payout_id;

 insert into public.hub_partner_commission_payout_items(payout_id,sale_id,commission_amount)
 select v_payout_id,x.sale_id,x.amount
 from jsonb_to_recordset(p_allocations) as x(sale_id uuid, amount numeric);

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
   'installment_count',jsonb_array_length(p_allocations),
   'payment_reference_recorded',true
  )
 );
 return v_payout_id;
end;
$$;

revoke all on function public.hub_settle_partner_commissions(uuid,jsonb,text,timestamptz,text,uuid)
 from public,anon,authenticated;
grant execute on function public.hub_settle_partner_commissions(uuid,jsonb,text,timestamptz,text,uuid)
 to service_role;
comment on function public.hub_settle_partner_commissions(uuid,jsonb,text,timestamptz,text,uuid)
 is 'Owner-authorized installment payout; locks sales, caps each installment at remaining commission, and audits atomically.';
