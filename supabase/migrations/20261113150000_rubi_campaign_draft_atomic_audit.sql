-- Sprint 177: campaign draft editing and named Master audit share one transaction.
-- Existing status transition and per-plan trigger audit remain intact.
alter table public.rubi_master_campaign_plans
 add column if not exists revision integer not null default 1 check (revision>0);

create or replace function public.rubi_save_master_campaign_draft_audited(
 p_id uuid,p_expected_revision integer,p_product_id uuid,p_campaign_code text,
 p_mode text,p_audience text,p_daily_budget numeric,p_run_days integer,
 p_claim_evidence text,p_responsible_name text,p_actor uuid
) returns table(saved_id uuid,saved_revision integer)
language plpgsql security invoker set search_path=''
as $$
declare prior public.rubi_master_campaign_plans%rowtype;
 new_id uuid;
 new_revision integer;
before_json jsonb;
begin
 if p_actor is null or not exists(select 1 from public.user_roles r
  where r.user_id=p_actor and r.role='owner') then raise exception 'Owner required'; end if;
 if p_campaign_code is null or p_campaign_code !~ '^[a-z0-9][a-z0-9_-]{0,59}$'
  or p_mode not in ('ai_seller_video','direct_response','creator_team')
  or p_audience not in ('consumer','merchant','partner')
  or p_daily_budget is null or p_daily_budget<=0 or p_daily_budget>10000
  or p_daily_budget<>round(p_daily_budget,2)
  or p_run_days is null or p_run_days<1 or p_run_days>90
  or p_claim_evidence is null or char_length(p_claim_evidence)>1500
  or p_responsible_name is null or char_length(p_responsible_name)>120 then
  raise exception 'Invalid campaign draft'; end if;
 perform 1 from public.hub_products p where p.id=p_product_id for share;
 if not found then raise exception 'Product not found'; end if;
 if p_id is null then
  if p_expected_revision is not null then raise exception 'Unexpected draft version'; end if;
  insert into public.rubi_master_campaign_plans(
   product_id,campaign_code,mode,audience,daily_budget,run_days,claim_evidence,
   responsible_name,status,approved_at,approval_note)
  values(p_product_id,p_campaign_code,p_mode,p_audience,p_daily_budget,p_run_days,
   p_claim_evidence,p_responsible_name,'draft',null,'')
  returning id,revision into new_id,new_revision;
  before_json:='{}'::jsonb;
 else
  select p.* into prior from public.rubi_master_campaign_plans p where p.id=p_id for update;
  if not found or p_expected_revision is distinct from prior.revision then
   raise exception 'Campaign changed; reload before editing'; end if;
  if prior.status not in ('draft','ready_for_review','paused') then
   raise exception 'Approved campaign cannot be edited'; end if;
  if prior.product_id<>p_product_id or prior.campaign_code<>p_campaign_code then
   raise exception 'Create another campaign to change product or code'; end if;
  before_json:=jsonb_build_object('status',prior.status,'revision',prior.revision,
   'mode',prior.mode,'audience',prior.audience,'daily_budget',prior.daily_budget,
   'run_days',prior.run_days);
  update public.rubi_master_campaign_plans p set
   mode=p_mode,audience=p_audience,daily_budget=p_daily_budget,run_days=p_run_days,
   claim_evidence=p_claim_evidence,responsible_name=p_responsible_name,
   status='draft',approved_at=null,approval_note='',updated_at=now(),
   revision=prior.revision+1 where p.id=p_id
  returning id,revision into new_id,new_revision;
 end if;
 insert into public.admin_audit_log(
  actor_user_id,actor_email,action_type,entity_type,entity_id,previous_value,new_value)
 values(p_actor,null,
  case when p_id is null then 'RUBI_CAMPAIGN_DRAFT_CREATED' else 'RUBI_CAMPAIGN_DRAFT_UPDATED' end,
  'rubi_master_campaign_plan',new_id,before_json,
  jsonb_build_object('status','draft','revision',new_revision,
    'product_id',p_product_id,'mode',p_mode,'audience',p_audience,
    'daily_budget',p_daily_budget,'run_days',p_run_days));
 return query select new_id,new_revision;
end;
$$;
revoke all on function public.rubi_save_master_campaign_draft_audited(
 uuid,integer,uuid,text,text,text,numeric,integer,text,text,uuid)
 from public,anon,authenticated;
grant execute on function public.rubi_save_master_campaign_draft_audited(
 uuid,integer,uuid,text,text,text,numeric,integer,text,text,uuid) to service_role;
