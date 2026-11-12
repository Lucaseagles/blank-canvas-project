-- Owner-only distribution planning: approved master plan + product movement + reviewed creative variant + creator team.
-- This never creates a public offer, a referral attribution, a campaign on an ads platform, or a payment.
create table if not exists public.rubi_creator_team_campaign_assignments (
 id uuid primary key default gen_random_uuid(),
 team_id uuid not null references public.rubi_creator_teams(id) on delete restrict,
 campaign_plan_id uuid not null references public.rubi_master_campaign_plans(id) on delete restrict,
 movement_id uuid not null references public.rubi_movements(id) on delete restrict,
 variant_id uuid not null references public.rubi_movement_variants(id) on delete restrict,
 status text not null default 'planned' check (status in ('planned','ready','paused')),
 editorial_notes text not null default '' check (char_length(editorial_notes)<=1000),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 unique(team_id,campaign_plan_id,variant_id)
);
create index if not exists rubi_team_campaign_assignments_team_idx
 on public.rubi_creator_team_campaign_assignments(team_id,status);
alter table public.rubi_creator_team_campaign_assignments enable row level security;
revoke all on public.rubi_creator_team_campaign_assignments from public,anon,authenticated;
comment on table public.rubi_creator_team_campaign_assignments is
 'Private planning for linking teams to campaigns and reviewed movement variants; no external advertising, payment, partner grant or referral attribution.';

create table if not exists public.rubi_creator_team_campaign_assignment_events (
 id bigint generated always as identity primary key,
 assignment_id uuid not null,
 team_id uuid not null,
 campaign_plan_id uuid not null,
 variant_id uuid not null,
 previous_status text,
 new_status text not null,
 recorded_at timestamptz not null default now()
);
create index if not exists rubi_team_campaign_assignment_events_idx
 on public.rubi_creator_team_campaign_assignment_events(assignment_id,recorded_at,id);
alter table public.rubi_creator_team_campaign_assignment_events enable row level security;
revoke all on public.rubi_creator_team_campaign_assignment_events from public,anon,authenticated;
comment on table public.rubi_creator_team_campaign_assignment_events is
 'Private append-only assignment status changes; snapshots are not proof a campaign was distributed.';

create or replace function public.rubi_log_creator_team_campaign_assignment()
returns trigger language plpgsql security definer set search_path=public,pg_temp as $$
begin
 if tg_op='INSERT' then
   insert into public.rubi_creator_team_campaign_assignment_events
    (assignment_id,team_id,campaign_plan_id,variant_id,previous_status,new_status)
   values (new.id,new.team_id,new.campaign_plan_id,new.variant_id,null,new.status);
 elsif old.status is distinct from new.status then
   insert into public.rubi_creator_team_campaign_assignment_events
    (assignment_id,team_id,campaign_plan_id,variant_id,previous_status,new_status)
   values (new.id,new.team_id,new.campaign_plan_id,new.variant_id,old.status,new.status);
 end if;
 return new;
end;
$$;
revoke all on function public.rubi_log_creator_team_campaign_assignment() from public,anon,authenticated;
drop trigger if exists rubi_creator_team_campaign_assignment_audit_trg on public.rubi_creator_team_campaign_assignments;
create trigger rubi_creator_team_campaign_assignment_audit_trg after insert or update of status
 on public.rubi_creator_team_campaign_assignments for each row
 execute function public.rubi_log_creator_team_campaign_assignment();

create or replace function public.rubi_protect_creator_team_campaign_event()
returns trigger language plpgsql set search_path=public,pg_temp as $$
begin
 raise exception 'Assignment events are append-only';
end;
$$;
revoke all on function public.rubi_protect_creator_team_campaign_event() from public,anon,authenticated;
drop trigger if exists rubi_creator_team_campaign_events_immutable_trg on public.rubi_creator_team_campaign_assignment_events;
create trigger rubi_creator_team_campaign_events_immutable_trg before update or delete
 on public.rubi_creator_team_campaign_assignment_events for each row
 execute function public.rubi_protect_creator_team_campaign_event();
