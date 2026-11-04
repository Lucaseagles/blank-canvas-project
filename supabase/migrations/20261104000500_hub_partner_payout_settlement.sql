-- Atomic payout settlement. This function is callable only by the service role.
create or replace function public.hub_settle_partner_commissions(
 p_profile_id uuid, p_sale_ids uuid[], p_payment_reference text, p_paid_at timestamptz, p_note text default null
) returns uuid
language plpgsql security definer set search_path = public
as $$
declare
 v_count int;
 v_total numeric(12,2);
 v_payout_id uuid;
begin
 if auth.role() <> 'service_role' then raise exception 'Service role required'; end if;
 if p_profile_id is null or coalesce(array_length(p_sale_ids,1),0) = 0 then raise exception 'No sales selected'; end if;
 if p_payment_reference is null or length(trim(p_payment_reference)) < 3 then raise exception 'Payment reference required'; end if;
 if p_paid_at is null or p_paid_at > now() then raise exception 'Invalid payment date'; end if;
 if exists (select 1 from unnest(p_sale_ids) x group by x having count(*) > 1) then raise exception 'Duplicate sale IDs'; end if;
 -- Lock sales to prevent two concurrent payout requests from settling the same sale.
 perform 1 from public.hub_partner_confirmed_sales s
 join public.hub_partner_referral_links l on l.id=s.referral_link_id
 where s.id = any(p_sale_ids) and l.commercial_profile_id=p_profile_id
 order by s.id for update of s;
 select count(*), coalesce(sum(s.commission_amount),0) into v_count,v_total
 from public.hub_partner_confirmed_sales s
 join public.hub_partner_referral_links l on l.id=s.referral_link_id
 where s.id = any(p_sale_ids) and l.commercial_profile_id=p_profile_id;
 if v_count <> array_length(p_sale_ids,1) or v_total <= 0 then raise exception 'Sales invalid or commissions zero'; end if;
 if exists (select 1 from public.hub_partner_commission_payout_items where sale_id = any(p_sale_ids))
 then raise exception 'One or more commissions already settled'; end if;
 insert into public.hub_partner_commission_payouts(commercial_profile_id,payment_reference,paid_amount,paid_at,note)
 values (p_profile_id,trim(p_payment_reference),v_total,p_paid_at,p_note) returning id into v_payout_id;
 insert into public.hub_partner_commission_payout_items(payout_id,sale_id,commission_amount)
 select v_payout_id,s.id,s.commission_amount
 from public.hub_partner_confirmed_sales s where s.id = any(p_sale_ids);
 return v_payout_id;
end;
$$;
revoke all on function public.hub_settle_partner_commissions(uuid,uuid[],text,timestamptz,text) from public, anon, authenticated;
grant execute on function public.hub_settle_partner_commissions(uuid,uuid[],text,timestamptz,text) to service_role;
