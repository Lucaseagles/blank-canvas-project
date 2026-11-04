-- Notifications are created from trusted financial ledger writes, not clicks.
create table if not exists public.hub_partner_financial_notifications (
 id uuid primary key default gen_random_uuid(),
 commercial_profile_id uuid not null references public.commercial_profiles(id) on delete cascade,
 event_type text not null check (event_type in ('sale_confirmed','commission_paid')),
 source_id uuid not null,
 title text not null,
 message text not null,
 created_at timestamptz not null default now(),
 read_at timestamptz,
 unique(event_type, source_id)
);
create index if not exists hub_partner_financial_notifications_profile_idx
 on public.hub_partner_financial_notifications(commercial_profile_id, created_at desc);
alter table public.hub_partner_financial_notifications enable row level security;
revoke all on public.hub_partner_financial_notifications from anon, authenticated;
create or replace function public.hub_notify_partner_sale()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_profile_id uuid;
begin
 select commercial_profile_id into v_profile_id from public.hub_partner_referral_links where id = new.referral_link_id;
 if v_profile_id is not null then
   insert into public.hub_partner_financial_notifications(commercial_profile_id,event_type,source_id,title,message)
   values (v_profile_id,'sale_confirmed',new.id,'Venda confirmada','Uma venda vinculada ao seu link foi confirmada. Consulte seu extrato.');
 end if;
 return new;
end;
$$;
drop trigger if exists hub_notify_partner_sale_trigger on public.hub_partner_confirmed_sales;
create trigger hub_notify_partner_sale_trigger after insert on public.hub_partner_confirmed_sales
 for each row execute function public.hub_notify_partner_sale();

create or replace function public.hub_notify_partner_payout()
returns trigger language plpgsql security definer set search_path = public as $$
begin
 insert into public.hub_partner_financial_notifications(commercial_profile_id,event_type,source_id,title,message)
 values (new.commercial_profile_id,'commission_paid',new.id,'Comissão paga','Um pagamento de comissão foi registrado. Consulte seu extrato.');
 return new;
end;
$$;
drop trigger if exists hub_notify_partner_payout_trigger on public.hub_partner_commission_payouts;
create trigger hub_notify_partner_payout_trigger after insert on public.hub_partner_commission_payouts
 for each row execute function public.hub_notify_partner_payout();
revoke all on function public.hub_notify_partner_sale() from public, anon, authenticated;
revoke all on function public.hub_notify_partner_payout() from public, anon, authenticated;
