-- Owner-only B2B quote administration mutations with atomic audit and optimistic concurrency.
create or replace function public.rubi_update_business_quote_admin_audited(
 p_quote_id uuid,p_expected_updated_at timestamptz,p_status text,p_owner_note text,p_actor uuid
) returns jsonb
language plpgsql security invoker set search_path=''
as $fn$
declare
 v_before public.hub_b2b_quote_requests%rowtype;
 v_after public.hub_b2b_quote_requests%rowtype;
begin
 if p_actor is null or not exists(select 1 from public.user_roles r where r.user_id=p_actor and r.role::text='owner') then
  raise exception 'Owner authorization required';
 end if;
 if p_quote_id is null or p_expected_updated_at is null
   or p_status not in ('requested','reviewing','responded','closed')
   or p_owner_note is null or length(p_owner_note)>500 then
  raise exception 'Invalid business quote update';
 end if;
 if p_status='responded' and length(btrim(p_owner_note))=0 then
  raise exception 'A commercial response is required before marking a quote responded';
 end if;
 select q.* into v_before from public.hub_b2b_quote_requests q where q.id=p_quote_id for update;
 if not found then raise exception 'Business quote not found'; end if;
 if v_before.updated_at is distinct from p_expected_updated_at then
  raise exception 'Business quote changed; reload before saving';
 end if;
 if v_before.status='closed' and p_status<>'closed' then
  raise exception 'Closed business quotes cannot be reopened';
 end if;
 update public.hub_b2b_quote_requests q set
  status=p_status,owner_note=p_owner_note,updated_at=clock_timestamp(),
  responded_at=case when v_before.responded_at is not null then v_before.responded_at
    when p_status='responded' and length(btrim(p_owner_note))>0 then clock_timestamp()
    else null end
 where q.id=p_quote_id returning q.* into v_after;
 insert into public.admin_audit_log(actor_user_id,actor_email,action_type,entity_type,entity_id,previous_value,new_value)
 values(p_actor,null,'RUBI_BUSINESS_QUOTE_UPDATED','hub_b2b_quote_requests',p_quote_id::text,
  jsonb_build_object('status',v_before.status,'owner_note_present',length(coalesce(v_before.owner_note,''))>0),
  jsonb_build_object('status',v_after.status,'owner_note_present',length(coalesce(v_after.owner_note,''))>0,'values_redacted',true));
 return jsonb_build_object('id',v_after.id,'status',v_after.status,'updated_at',v_after.updated_at,'responded_at',v_after.responded_at);
end;
$fn$;

create or replace function public.rubi_complete_business_followup_admin_audited(
 p_quote_id uuid,p_expected_updated_at timestamptz,p_actor uuid
) returns jsonb
language plpgsql security invoker set search_path=''
as $fn$
declare
 v_before public.hub_b2b_quote_requests%rowtype;
 v_after public.hub_b2b_quote_requests%rowtype;
begin
 if p_actor is null or not exists(select 1 from public.user_roles r where r.user_id=p_actor and r.role::text='owner') then
  raise exception 'Owner authorization required';
 end if;
 if p_quote_id is null or p_expected_updated_at is null then raise exception 'Quote and expected revision are required'; end if;
 select q.* into v_before from public.hub_b2b_quote_requests q where q.id=p_quote_id for update;
 if not found or not v_before.followup_opt_in or v_before.followup_completed_at is not null then
  raise exception 'Business follow-up is unavailable or already completed';
 end if;
 if v_before.updated_at is distinct from p_expected_updated_at then
  raise exception 'Business follow-up changed; reload before completing';
 end if;
 update public.hub_b2b_quote_requests q set followup_completed_at=clock_timestamp(),updated_at=clock_timestamp()
 where q.id=p_quote_id returning q.* into v_after;
 insert into public.admin_audit_log(actor_user_id,actor_email,action_type,entity_type,entity_id,previous_value,new_value)
 values(p_actor,null,'RUBI_BUSINESS_FOLLOWUP_COMPLETED','hub_b2b_quote_requests',p_quote_id::text,
  jsonb_build_object('followup_opt_in',true,'followup_completed',false),
  jsonb_build_object('followup_opt_in',true,'followup_completed',true,'internal_task_only',true));
 return jsonb_build_object('id',v_after.id,'updated_at',v_after.updated_at,'followup_completed_at',v_after.followup_completed_at);
end;
$fn$;

revoke all on function public.rubi_update_business_quote_admin_audited(uuid,timestamptz,text,text,uuid) from public,anon,authenticated;
revoke all on function public.rubi_complete_business_followup_admin_audited(uuid,timestamptz,uuid) from public,anon,authenticated;
grant execute on function public.rubi_update_business_quote_admin_audited(uuid,timestamptz,text,text,uuid) to service_role;
grant execute on function public.rubi_complete_business_followup_admin_audited(uuid,timestamptz,uuid) to service_role;
comment on function public.rubi_update_business_quote_admin_audited(uuid,timestamptz,text,text,uuid) is 'Owner-only B2B quote status update with optimistic concurrency and atomic redacted audit.';
comment on function public.rubi_complete_business_followup_admin_audited(uuid,timestamptz,uuid) is 'Owner-only internal follow-up completion with optimistic concurrency and atomic audit; sends no message.';
