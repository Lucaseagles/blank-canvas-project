-- Sprint 246: worker state transitions and audit records commit atomically.
-- The scheduling Owner remains the initiating actor; action_type marks worker execution.
create or replace function public.rubi_claim_scheduled_post_audited(p_post_id uuid)
returns jsonb
language plpgsql
security invoker
set search_path=''
as $fn$
declare
 old_post public.scheduled_posts%rowtype;
 new_post public.scheduled_posts%rowtype;
begin
 if auth.role() <> 'service_role' then raise exception 'Service role required'; end if;
 select * into old_post from public.scheduled_posts where id=p_post_id for update;
 if not found then raise exception 'Scheduled post not found'; end if;
 if old_post.status <> 'pending' or old_post.scheduled_for > now() then return null; end if;
 if old_post.created_by is null then raise exception 'Scheduled post has no initiating Owner'; end if;

 update public.scheduled_posts
 set status='processing',error_message=null
 where id=p_post_id
 returning * into new_post;

 insert into public.admin_audit_log(
  actor_user_id,actor_email,action_type,entity_type,entity_id,previous_value,new_value
 ) values(
  old_post.created_by,null,'RUBI_SCHEDULED_POST_PROCESSING_STARTED','scheduled_post',p_post_id,
  jsonb_build_object('status',old_post.status,'execution_origin','scheduled_worker'),
  jsonb_build_object('status',new_post.status,'execution_origin','scheduled_worker')
 );
 return to_jsonb(new_post);
end;
$fn$;

create or replace function public.rubi_finish_scheduled_post_audited(
 p_post_id uuid,p_status text,p_error_message text default null
) returns jsonb
language plpgsql
security invoker
set search_path=''
as $fn$
declare
 old_post public.scheduled_posts%rowtype;
 new_post public.scheduled_posts%rowtype;
begin
 if auth.role() <> 'service_role' then raise exception 'Service role required'; end if;
 if p_status not in ('published','failed') then raise exception 'Invalid worker result'; end if;
 select * into old_post from public.scheduled_posts where id=p_post_id for update;
 if not found then raise exception 'Scheduled post not found'; end if;
 if old_post.status <> 'processing' then raise exception 'Scheduled post is not processing'; end if;
 if old_post.created_by is null then raise exception 'Scheduled post has no initiating Owner'; end if;

 update public.scheduled_posts
 set status=p_status,
     published_at=case when p_status='published' then now() else published_at end,
     error_message=case when p_status='published' then null else left(coalesce(p_error_message,'Publication failed'),1000) end
 where id=p_post_id
 returning * into new_post;

 insert into public.admin_audit_log(
  actor_user_id,actor_email,action_type,entity_type,entity_id,previous_value,new_value
 ) values(
  old_post.created_by,null,
  case when p_status='published' then 'RUBI_SCHEDULED_POST_PUBLISHED' else 'RUBI_SCHEDULED_POST_FAILED' end,
  'scheduled_post',p_post_id,
  jsonb_build_object('status',old_post.status,'execution_origin','scheduled_worker'),
  jsonb_build_object('status',new_post.status,'execution_origin','scheduled_worker','error_recorded',p_status='failed')
 );
 return to_jsonb(new_post);
end;
$fn$;

revoke all on function public.rubi_claim_scheduled_post_audited(uuid) from public,anon,authenticated;
revoke all on function public.rubi_finish_scheduled_post_audited(uuid,text,text) from public,anon,authenticated;
grant execute on function public.rubi_claim_scheduled_post_audited(uuid) to service_role;
grant execute on function public.rubi_finish_scheduled_post_audited(uuid,text,text) to service_role;
comment on function public.rubi_claim_scheduled_post_audited(uuid) is 'Claims a due scheduled post and writes its worker transition audit atomically; only service_role may execute.';
comment on function public.rubi_finish_scheduled_post_audited(uuid,text,text) is 'Finishes a processing scheduled post and writes its worker transition audit atomically; error details are excluded from audit payloads.';
