-- SPRINT 166: distribution draft changes and named owner audit are inseparable.
alter table public.rubi_movement_distribution
 add column if not exists revision integer not null default 1
 check (revision > 0);

create or replace function public.rubi_save_distribution_audited(
 p_id uuid,p_variant_id uuid,p_expected_revision integer,
 p_channel text,p_campaign text,p_status text,
 p_notes text,p_published_reference text,p_actor uuid
)
returns table(plan_id uuid,new_revision integer)
language plpgsql security invoker set search_path=''
as $$
declare
 old_plan public.rubi_movement_distribution%rowtype;
 verified_variant public.rubi_movement_variants%rowtype;
 saved_id uuid;
 saved_revision integer;
 prior_state jsonb;
begin
 if p_actor is null or not exists(select 1 from public.user_roles r
  where r.user_id=p_actor and r.role='owner') then
  raise exception 'Owner authorization required';
 end if;
 select v.* into verified_variant from public.rubi_movement_variants v
  where v.id=p_variant_id for share;
 if not found then raise exception 'Variant not found'; end if;
 if p_status not in ('planned','manually_published') then
  raise exception 'Invalid distribution status'; end if;
 if p_status='manually_published' and
   (verified_variant.status <> 'review' or
    char_length(btrim(coalesce(p_published_reference,'')))<8) then
  raise exception 'Reviewed variant and publication reference required';
 end if;
 if p_id is null then
  if p_expected_revision is not null then raise exception 'Unexpected revision'; end if;
  insert into public.rubi_movement_distribution
   (variant_id,channel,campaign,status,notes,published_reference)
  values(p_variant_id,p_channel,p_campaign,p_status,p_notes,p_published_reference)
  returning id,revision into saved_id,saved_revision;
  prior_state:='{}'::jsonb;
 else
  select d.* into old_plan from public.rubi_movement_distribution d
   where d.id=p_id and d.variant_id=p_variant_id for update;
  if not found or old_plan.revision is distinct from p_expected_revision then
   raise exception 'Distribution plan changed; reload before saving';
  end if;
  if p_channel is distinct from old_plan.channel then
   raise exception 'Distribution channel cannot be reassigned';
  end if;
  prior_state:=jsonb_build_object('revision',old_plan.revision,
   'status',old_plan.status,'channel',old_plan.channel,'campaign',old_plan.campaign);
  update public.rubi_movement_distribution d set
   campaign=p_campaign,status=p_status,notes=p_notes,
   published_reference=p_published_reference,
   page_published_at=null,published_variant_revision=null,
   published_movement_revision=null,
   revision=old_plan.revision+1,updated_at=now()
   where d.id=old_plan.id;
  saved_id:=old_plan.id;
  saved_revision:=old_plan.revision+1;
 end if;
 insert into public.admin_audit_log(
  actor_user_id,actor_email,action_type,entity_type,entity_id,previous_value,new_value
 ) values(
  p_actor,null,case when p_id is null then 'RUBI_DISTRIBUTION_CREATED'
   else 'RUBI_DISTRIBUTION_UPDATED' end,
  'rubi_movement_distribution',saved_id,prior_state,
  jsonb_build_object('revision',saved_revision,'status',p_status,
   'channel',p_channel,'campaign',p_campaign,'variant_id',p_variant_id)
 );
 return query select saved_id,saved_revision;
end;
$$;
revoke all on function public.rubi_save_distribution_audited(uuid,uuid,integer,text,text,text,text,text,uuid)
 from public,anon,authenticated;
grant execute on function public.rubi_save_distribution_audited(uuid,uuid,integer,text,text,text,text,text,uuid)
 to service_role;
comment on function public.rubi_save_distribution_audited(uuid,uuid,integer,text,text,text,text,text,uuid)
 is 'Owner-only atomic distribution edit and administrative audit. Does not publish network posts or change checkout.';
