-- Sprint 179: creator CRM writes and named Owner audit in a single transaction.
alter table public.rubi_creator_teams add column if not exists revision integer not null default 1 check(revision>0);
alter table public.rubi_creator_prospects add column if not exists revision integer not null default 1 check(revision>0);
alter table public.rubi_creator_team_growth_targets add column if not exists revision integer not null default 1 check(revision>0);

create or replace function public.rubi_save_creator_team_audited(
 p_actor uuid,p_id uuid,p_expected_revision integer,p_name text,p_niche text,p_objective text,p_stage text
) returns table(saved_id uuid,saved_revision integer)
language plpgsql security invoker set search_path='' as $$
declare previous public.rubi_creator_teams%rowtype; result_id uuid; result_revision integer;
begin
 if p_actor is null or not exists(select 1 from public.user_roles r where r.user_id=p_actor and r.role='owner') then raise exception 'Owner required'; end if;
 if p_name is null or char_length(btrim(p_name)) not between 3 and 100
  or p_niche is null or char_length(btrim(p_niche)) not between 2 and 100
  or p_objective is null or char_length(p_objective)>500
  or p_stage not in ('building','testing','scaling','paused') then raise exception 'Invalid team'; end if;
 if p_id is null then
  if p_expected_revision is not null then raise exception 'Unexpected revision'; end if;
  insert into public.rubi_creator_teams(name,niche,objective,stage)
   values(p_name,p_niche,p_objective,p_stage) returning id,revision into result_id,result_revision;
 else
  select * into previous from public.rubi_creator_teams t where t.id=p_id for update;
  if not found or previous.revision is distinct from p_expected_revision then raise exception 'Team changed; reload'; end if;
  update public.rubi_creator_teams t set name=p_name,niche=p_niche,objective=p_objective,
   stage=p_stage,revision=previous.revision+1,updated_at=now()
   where t.id=p_id returning id,revision into result_id,result_revision;
 end if;
 insert into public.admin_audit_log(actor_user_id,actor_email,action_type,entity_type,entity_id,previous_value,new_value)
 values(p_actor,null,'RUBI_CREATOR_TEAM_SAVED','rubi_creator_team',result_id,
  case when previous.id is null then '{}'::jsonb else jsonb_build_object('stage',previous.stage,'revision',previous.revision) end,
  jsonb_build_object('stage',p_stage,'revision',result_revision));
 return query select result_id,result_revision;
end; $$;
revoke all on function public.rubi_save_creator_team_audited(uuid,uuid,integer,text,text,text,text) from public,anon,authenticated;
grant execute on function public.rubi_save_creator_team_audited(uuid,uuid,integer,text,text,text,text) to service_role;

create or replace function public.rubi_save_creator_prospect_audited(
 p_actor uuid,p_id uuid,p_expected_revision integer,p_team uuid,p_name text,p_platform text,p_url text,
 p_followers integer,p_tier text,p_stage text,p_compensation text,p_percent numeric,p_fee numeric,p_notes text
) returns table(saved_id uuid,saved_revision integer)
language plpgsql security invoker set search_path='' as $$
declare previous public.rubi_creator_prospects%rowtype; result_id uuid; result_revision integer;
begin
 if p_actor is null or not exists(select 1 from public.user_roles r where r.user_id=p_actor and r.role='owner') then raise exception 'Owner required'; end if;
 if p_name is null or char_length(btrim(p_name)) not between 2 and 120
  or p_platform not in ('instagram','tiktok','youtube','other')
  or p_url is null or p_url !~ '^https://[^[:space:]@/]+(/[^[:space:]]*)?$'
  or char_length(p_url)>500 or p_followers is null or p_followers not between 0 and 500000000
  or p_tier not in ('nano','micro','mid','macro','mega')
  or p_stage not in ('identified','contacted','negotiating','approved','declined')
  or p_compensation not in ('commission','fixed_sponsorship','hybrid')
  or (p_percent is not null and (p_percent<0 or p_percent>100 or p_percent<>round(p_percent,2)))
  or (p_fee is not null and (p_fee<0 or p_fee>10000000 or p_fee<>round(p_fee,2)))
  or p_notes is null or char_length(p_notes)>1000 then raise exception 'Invalid creator prospect'; end if;
 perform 1 from public.rubi_creator_teams t where t.id=p_team for share;
 if not found then raise exception 'Team not found'; end if;
 if p_id is null then
  if p_expected_revision is not null then raise exception 'Unexpected prospect revision'; end if;
  insert into public.rubi_creator_prospects(team_id,creator_name,platform,profile_url,follower_count,tier,
     stage,compensation_model,proposed_commission_percent,proposed_fixed_fee,notes)
   values(p_team,p_name,p_platform,p_url,p_followers,p_tier,p_stage,p_compensation,p_percent,p_fee,p_notes)
   returning id,revision into result_id,result_revision;
 else
  select * into previous from public.rubi_creator_prospects p where p.id=p_id for update;
  if not found or previous.team_id<>p_team or previous.revision is distinct from p_expected_revision then
   raise exception 'Prospect changed; reload'; end if;
  update public.rubi_creator_prospects p set creator_name=p_name,platform=p_platform,
   profile_url=p_url,follower_count=p_followers,tier=p_tier,stage=p_stage,
   compensation_model=p_compensation,proposed_commission_percent=p_percent,
   proposed_fixed_fee=p_fee,notes=p_notes,updated_at=now(),revision=previous.revision+1
  where p.id=p_id returning id,revision into result_id,result_revision;
 end if;
 insert into public.admin_audit_log(actor_user_id,actor_email,action_type,entity_type,entity_id,previous_value,new_value)
 values(p_actor,null,'RUBI_CREATOR_PROSPECT_SAVED','rubi_creator_prospect',result_id,
  case when previous.id is null then '{}'::jsonb else jsonb_build_object('stage',previous.stage,'revision',previous.revision) end,
  jsonb_build_object('stage',p_stage,'revision',result_revision,'team_id',p_team));
 return query select result_id,result_revision;
end; $$;
revoke all on function public.rubi_save_creator_prospect_audited(uuid,uuid,integer,uuid,text,text,text,integer,text,text,text,numeric,numeric,text) from public,anon,authenticated;
grant execute on function public.rubi_save_creator_prospect_audited(uuid,uuid,integer,uuid,text,text,text,integer,text,text,text,numeric,numeric,text) to service_role;

create or replace function public.rubi_save_creator_growth_targets_audited(
 p_actor uuid,p_team uuid,p_expected_revision integer,p_nano integer,p_micro integer,p_mid integer,
 p_macro integer,p_mega integer,p_evidence text,p_budget numeric
) returns table(saved_revision integer)
language plpgsql security invoker set search_path='' as $$
declare previous public.rubi_creator_team_growth_targets%rowtype; result_revision integer;
begin
 if p_actor is null or not exists(select 1 from public.user_roles r where r.user_id=p_actor and r.role='owner') then raise exception 'Owner required'; end if;
 if p_nano is null or p_nano not between 0 and 100000
 or p_micro is null or p_micro not between 0 and 100000
 or p_mid is null or p_mid not between 0 and 100000
 or p_macro is null or p_macro not between 0 and 100000
 or p_mega is null or p_mega not between 0 and 100000
 or p_evidence is null or char_length(p_evidence)>1500
 or (p_budget is not null and (p_budget<0 or p_budget>100000000 or p_budget<>round(p_budget,2)))
 then raise exception 'Invalid target'; end if;
 perform 1 from public.rubi_creator_teams t where t.id=p_team for update;
 if not found then raise exception 'Team not found'; end if;
 select * into previous from public.rubi_creator_team_growth_targets g where g.team_id=p_team for update;
 if found then
  if previous.revision is distinct from p_expected_revision then raise exception 'Targets changed; reload'; end if;
  update public.rubi_creator_team_growth_targets g set nano_target=p_nano,micro_target=p_micro,
    mid_target=p_mid,macro_target=p_macro,mega_target=p_mega,expansion_evidence=p_evidence,
    approved_budget=p_budget,revision=previous.revision+1,updated_at=now()
   where g.team_id=p_team returning revision into result_revision;
 else
  if p_expected_revision is not null then raise exception 'Targets not found'; end if;
  insert into public.rubi_creator_team_growth_targets(team_id,nano_target,micro_target,mid_target,
    macro_target,mega_target,expansion_evidence,approved_budget)
  values(p_team,p_nano,p_micro,p_mid,p_macro,p_mega,p_evidence,p_budget)
  returning revision into result_revision;
 end if;
 insert into public.admin_audit_log(actor_user_id,actor_email,action_type,entity_type,entity_id,previous_value,new_value)
 values(p_actor,null,'RUBI_CREATOR_GROWTH_TARGETS_SAVED','rubi_creator_team',p_team,
 case when previous.team_id is null then '{}'::jsonb else jsonb_build_object('revision',previous.revision) end,
 jsonb_build_object('revision',result_revision,'nano',p_nano,'micro',p_micro,'mid',p_mid,'macro',p_macro,'mega',p_mega,
   'budget_planned',p_budget));
 return query select result_revision;
end; $$;
revoke all on function public.rubi_save_creator_growth_targets_audited(uuid,uuid,integer,integer,integer,integer,integer,integer,text,numeric)
 from public,anon,authenticated;
grant execute on function public.rubi_save_creator_growth_targets_audited(uuid,uuid,integer,integer,integer,integer,integer,integer,text,numeric)
 to service_role;
