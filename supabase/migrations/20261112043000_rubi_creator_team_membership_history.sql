-- Sprint 123: append-only team membership transitions for trustworthy historical reporting.
-- Existing rows are snapshotted at deployment time only: no past active periods are inferred.
create table if not exists public.rubi_creator_team_membership_events (
 id bigint generated always as identity primary key,
 membership_id uuid not null,
 team_id uuid not null,
 commercial_profile_id uuid not null,
 action text not null check (action in ('created','paused','reactivated','migrated_baseline')),
 status text not null check (status in ('active','paused')),
 effective_at timestamptz not null default now()
);
create index if not exists rubi_team_member_events_lookup_idx
 on public.rubi_creator_team_membership_events(commercial_profile_id,effective_at,id);
create index if not exists rubi_team_member_events_team_idx
 on public.rubi_creator_team_membership_events(team_id,effective_at,id);
alter table public.rubi_creator_team_membership_events enable row level security;
revoke all on public.rubi_creator_team_membership_events from public,anon,authenticated;
comment on table public.rubi_creator_team_membership_events is
 'Private append-only audit trail. Before initial migration snapshot, membership history is unknown, not assumed active.';

create or replace function public.rubi_record_team_membership_transition()
returns trigger
language plpgsql security definer set search_path = public, pg_temp as $$
begin
 if tg_op='INSERT' then
   insert into public.rubi_creator_team_membership_events
    (membership_id,team_id,commercial_profile_id,action,status,effective_at)
   values (new.id,new.team_id,new.commercial_profile_id,'created',new.status,coalesce(new.joined_at,now()));
 elsif old.status is distinct from new.status then
   insert into public.rubi_creator_team_membership_events
    (membership_id,team_id,commercial_profile_id,action,status,effective_at)
   values (new.id,new.team_id,new.commercial_profile_id,
     case when new.status='active' then 'reactivated' else 'paused' end,new.status,now());
 end if;
 return new;
end;
$$;
revoke all on function public.rubi_record_team_membership_transition() from public,anon,authenticated;
drop trigger if exists rubi_team_membership_history_trg on public.rubi_creator_team_members;
create trigger rubi_team_membership_history_trg after insert or update of status
on public.rubi_creator_team_members for each row
execute function public.rubi_record_team_membership_transition();

-- Backfill: the system cannot know prior pause/reactivation chronology. Anchor events to NOW.
insert into public.rubi_creator_team_membership_events
 (membership_id,team_id,commercial_profile_id,action,status,effective_at)
select m.id,m.team_id,m.commercial_profile_id,'migrated_baseline',m.status,now()
from public.rubi_creator_team_members m
where not exists (
 select 1 from public.rubi_creator_team_membership_events e where e.membership_id=m.id
);

-- Additional defense: only trigger-owner service role should write this audit table.
create or replace function public.rubi_reject_team_history_mutation()
returns trigger language plpgsql set search_path = public,pg_temp as $$
begin
 raise exception 'Team membership audit is append-only';
end;
$$;
revoke all on function public.rubi_reject_team_history_mutation() from public,anon,authenticated;
drop trigger if exists rubi_team_membership_audit_immutable_trg on public.rubi_creator_team_membership_events;
create trigger rubi_team_membership_audit_immutable_trg
before update or delete on public.rubi_creator_team_membership_events for each row
execute function public.rubi_reject_team_history_mutation();
