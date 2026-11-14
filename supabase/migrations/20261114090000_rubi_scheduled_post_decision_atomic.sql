-- Sprint 201: cancel/retry states of scheduled posts and audit in one transaction.
create or replace function public.rubi_decide_scheduled_post_audited(
 p_post_id uuid, p_action text, p_actor uuid
) returns void language plpgsql security invoker set search_path=''
as $fn$
declare
 old_post public.scheduled_posts%rowtype;
 new_status text;
begin
 if p_actor is null or not exists(
  select 1 from public.user_roles r where r.user_id=p_actor and r.role='owner'
 ) then raise exception 'Owner authorization required'; end if;
 if p_action not in ('cancel','retry') then raise exception 'Unknown action'; end if;
 select p.* into old_post from public.scheduled_posts p where p.id=p_post_id for update;
 if not found then raise exception 'Scheduled post not found'; end if;
 if p_action='cancel' and old_post.status<>'pending'
 then raise exception 'Only pending posts can be cancelled'; end if;
 if p_action='retry' and old_post.status<>'failed'
 then raise exception 'Only failed posts can be retried'; end if;
 if p_action='retry' and not (
   (old_post.content_type='offer' and exists(select 1 from public.offer_groups t where t.id=old_post.content_id))
   or (old_post.content_type='video' and exists(select 1 from public.videos t where t.id=old_post.content_id))
   or (old_post.content_type='bundle' and exists(select 1 from public.products t where t.id=old_post.content_id))
 ) then raise exception 'Publication content no longer exists'; end if;
 new_status:=case when p_action='cancel' then 'failed' else 'pending' end;
 update public.scheduled_posts p set
  status=new_status,
  scheduled_for=case when p_action='retry' then now() else p.scheduled_for end,
  error_message=case when p_action='cancel' then 'Cancelada pelo Owner' else null end
 where p.id=p_post_id;
 insert into public.admin_audit_log(
  actor_user_id,actor_email,action_type,entity_type,entity_id,previous_value,new_value
 ) values(
  p_actor,null,case when p_action='cancel' then 'RUBI_SCHEDULED_POST_CANCELLED'
  else 'RUBI_SCHEDULED_POST_RETRIED' end,
  'scheduled_post',p_post_id,
  jsonb_build_object('status',old_post.status),
  jsonb_build_object('status',new_status)
 );
end;
$fn$;
revoke all on function public.rubi_decide_scheduled_post_audited(uuid,text,uuid)
 from public,anon,authenticated;
grant execute on function public.rubi_decide_scheduled_post_audited(uuid,text,uuid)
 to service_role;
