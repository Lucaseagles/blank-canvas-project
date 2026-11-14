-- RUBI 187: human-reviewed creator suitability for a specific team.
-- This is decision support only, not proof of conversion, an agreement or a product grant.
create table if not exists public.rubi_creator_fit_reviews (
 id uuid primary key default gen_random_uuid(),
 prospect_id uuid not null unique references public.rubi_creator_prospects(id) on delete cascade,
 niche_fit smallint not null check(niche_fit between 0 and 2),
 audience_overlap smallint not null check(audience_overlap between 0 and 2),
 engagement_quality smallint not null check(engagement_quality between 0 and 2),
 content_quality smallint not null check(content_quality between 0 and 2),
 compliance_readiness smallint not null check(compliance_readiness between 0 and 2),
 evidence_notes text not null check(char_length(btrim(evidence_notes)) between 30 and 1500),
 fit_score smallint not null check(fit_score between 0 and 100),
 recommendation text not null check(recommendation in ('review_required','low_fit','needs_validation','pilot_candidate')),
 reviewer_id uuid not null references auth.users(id),
 reviewed_at timestamptz not null default now(),
 revision integer not null default 1 check(revision>0)
);
create index if not exists rubi_creator_fit_score_idx on public.rubi_creator_fit_reviews(recommendation,fit_score desc);
alter table public.rubi_creator_fit_reviews enable row level security;
revoke all on public.rubi_creator_fit_reviews from public,anon,authenticated;
grant select,insert,update on public.rubi_creator_fit_reviews to service_role;

create or replace function public.rubi_review_creator_fit_audited(
 p_actor uuid,p_prospect uuid,p_expected_revision integer,
 p_niche smallint,p_audience smallint,p_engagement smallint,p_content smallint,p_compliance smallint,
 p_evidence text
) returns table(saved_id uuid,saved_revision integer,saved_score smallint,saved_recommendation text)
language plpgsql security invoker set search_path=''
as $$
declare old_row public.rubi_creator_fit_reviews%rowtype;
 s smallint; recommendation text; rid uuid; rev integer; profile_stage text;
begin
 if p_actor is null or not exists(select 1 from public.user_roles r
   where r.user_id=p_actor and r.role='owner') then raise exception 'Owner required'; end if;
 if p_niche is null or p_niche not between 0 and 2
  or p_audience is null or p_audience not between 0 and 2
  or p_engagement is null or p_engagement not between 0 and 2
  or p_content is null or p_content not between 0 and 2
  or p_compliance is null or p_compliance not between 0 and 2
  or p_evidence is null or char_length(btrim(p_evidence)) not between 30 and 1500
 then raise exception 'Incomplete evidence-backed assessment'; end if;
 -- Single prospect lock serializes first assessment and concurrent edits.
 select p.stage into profile_stage from public.rubi_creator_prospects p
  where p.id=p_prospect for update;
 if not found then raise exception 'Prospect not found'; end if;
 if profile_stage='declined' then raise exception 'Declined prospect cannot be recommended'; end if;
 select * into old_row from public.rubi_creator_fit_reviews r
  where r.prospect_id=p_prospect for update;
 s := (p_niche*10 + p_audience*10 + p_engagement*10 + p_content*5 + p_compliance*15)::smallint;
 recommendation:=case
  when p_compliance<2 or p_niche=0 or p_audience=0 then 'review_required'
  when s>=75 then 'pilot_candidate'
  when s>=50 then 'needs_validation'
  else 'low_fit' end;
 if old_row.id is null then
  if p_expected_revision is not null then raise exception 'Assessment changed; reload'; end if;
  insert into public.rubi_creator_fit_reviews(prospect_id,niche_fit,audience_overlap,
   engagement_quality,content_quality,compliance_readiness,evidence_notes,
   fit_score,recommendation,reviewer_id)
  values(p_prospect,p_niche,p_audience,p_engagement,p_content,p_compliance,btrim(p_evidence),
   s,recommendation,p_actor) returning id,revision into rid,rev;
 else
  if old_row.revision is distinct from p_expected_revision then raise exception 'Assessment changed; reload'; end if;
  update public.rubi_creator_fit_reviews r set niche_fit=p_niche,audience_overlap=p_audience,
   engagement_quality=p_engagement,content_quality=p_content,compliance_readiness=p_compliance,
   evidence_notes=btrim(p_evidence),fit_score=s,recommendation=recommendation,
   reviewer_id=p_actor,reviewed_at=now(),revision=old_row.revision+1
  where r.id=old_row.id returning id,revision into rid,rev;
 end if;
 insert into public.admin_audit_log(actor_user_id,actor_email,action_type,entity_type,
  entity_id,previous_value,new_value)
 values(p_actor,null,'RUBI_CREATOR_FIT_REVIEWED','rubi_creator_fit_review',rid,
  case when old_row.id is null then '{}'::jsonb else
   jsonb_build_object('score',old_row.fit_score,'recommendation',old_row.recommendation,'revision',old_row.revision) end,
  jsonb_build_object('prospect_id',p_prospect,'score',s,'recommendation',recommendation,'revision',rev));
 return query select rid,rev,s,recommendation;
end;
$$;
revoke all on function public.rubi_review_creator_fit_audited(uuid,uuid,integer,smallint,smallint,smallint,smallint,smallint,text)
 from public,anon,authenticated;
grant execute on function public.rubi_review_creator_fit_audited(uuid,uuid,integer,smallint,smallint,smallint,smallint,smallint,text)
 to service_role;
