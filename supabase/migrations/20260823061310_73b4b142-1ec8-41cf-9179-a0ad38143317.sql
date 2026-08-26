-- Sprint 8 (Part 2/2) — Automation Engine V1

-- Trigger types
do $$ 
begin
  if not exists (select 1 from pg_type where typname = 'automation_trigger_type') then
    create type public.automation_trigger_type as enum (
      'PRICE_CHANGED',
      'NEW_OFFER_IN_GROUP',
      'USER_INTEREST_THRESHOLD',
      'SCHEDULED',
      'EVENT_TRACKED'
    );
  end if;
end $$;

-- Action types
do $$ 
begin
  if not exists (select 1 from pg_type where typname = 'automation_action_type') then
    create type public.automation_action_type as enum (
      'RECALCULATE_OFFER_SCORE',
      'SEND_NOTIFICATION',
      'CHECK_PRICE_ALERTS',
      'UPDATE_INTEREST_SCORE',
      'RECALCULATE_TRENDING',
      'ADJUST_FEED_WEIGHT',
      'QUEUE_FOR_REVIEW'
    );
  end if;
end $$;

-- Automation rules table
create table if not exists public.automation_rules (
    id uuid primary key default gen_random_uuid(),
    name text not null,
    description text,
    trigger_type public.automation_trigger_type not null,
    trigger_condition jsonb default '{}'::jsonb,
    action_type public.automation_action_type not null,
    action_params jsonb default '{}'::jsonb,
    is_active boolean default true,
    is_fully_automated boolean default true,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- Automation logs table
create table if not exists public.automation_logs (
    id uuid primary key default gen_random_uuid(),
    rule_id uuid references public.automation_rules(id) on delete cascade not null,
    triggered_at timestamptz default now(),
    context jsonb default '{}'::jsonb,
    result text,
    status text check (status in ('success', 'failed', 'queued_for_review'))
);

-- Grants
grant select, insert, update, delete on public.automation_rules to authenticated;
grant all on public.automation_rules to service_role;
grant select, insert on public.automation_logs to authenticated;
grant all on public.automation_logs to service_role;

-- RLS
alter table public.automation_rules enable row level security;
alter table public.automation_logs enable row level security;

-- Drop existing if any to avoid errors on retry
drop policy if exists "Admins can manage automation rules" on public.automation_rules;
create policy "Admins can manage automation rules"
on public.automation_rules
for all
to authenticated
using (public.has_role(auth.uid(), 'owner'));

drop policy if exists "Admins can view automation logs" on public.automation_logs;
create policy "Admins can view automation logs"
on public.automation_logs
for select
to authenticated
using (public.has_role(auth.uid(), 'owner'));

-- Initial Rules Seed
insert into public.automation_rules (name, description, trigger_type, action_type, is_fully_automated)
values 
('Price Pulse Core', 'Recalcular Offer Score quando o preço muda', 'PRICE_CHANGED', 'RECALCULATE_OFFER_SCORE', true),
('Alert Sentinel', 'Disparar alertas de preço para usuários', 'PRICE_CHANGED', 'CHECK_PRICE_ALERTS', true),
('Interest Synapse', 'Atualizar pontuação de interesse do usuário', 'EVENT_TRACKED', 'UPDATE_INTEREST_SCORE', true),
('Trending Engine', 'Auto-recálculo de produtos em tendência', 'SCHEDULED', 'RECALCULATE_TRENDING', true),
('Marketplace Price Sync', 'Sincronização automática via API (Adapter)', 'SCHEDULED', 'RECALCULATE_OFFER_SCORE', false)
on conflict do nothing;

-- Function to record automation activity
create or replace function public.log_automation_activity(
  _rule_id uuid,
  _context jsonb,
  _result text,
  _status text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.automation_logs (rule_id, context, result, status)
  values (_rule_id, _context, _result, _status);
end;
$$;

grant execute on function public.log_automation_activity to service_role;
revoke execute on function public.log_automation_activity from public;
