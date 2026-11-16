-- Sprint 216: notification templates may only be changed by audited Owner RPC.
create or replace function public.rubi_update_notification_template_audited(
 p_template_id uuid,p_template text,p_active boolean,p_actor uuid
) returns jsonb language plpgsql security invoker set search_path=''
as $rubi$
declare
 old_row public.notification_templates%rowtype;
 new_row public.notification_templates%rowtype;
 new_template text;
begin
 if p_actor is null or not exists(
  select 1 from public.user_roles r where r.user_id=p_actor and r.role='owner'
 ) then raise exception 'Owner authorization required'; end if;
 new_template:=btrim(coalesce(p_template,''));
 if p_template_id is null or p_active is null or length(new_template) not between 1 and 5000
 then raise exception 'Invalid notification template'; end if;
 select * into old_row from public.notification_templates n
  where n.id=p_template_id for update;
 if not found then raise exception 'Template not found'; end if;
 update public.notification_templates n set
  template=new_template,is_active=p_active,updated_at=now()
 where n.id=p_template_id returning * into new_row;
 -- Do not duplicate potentially private message content into the audit log.
 insert into public.admin_audit_log(
  actor_user_id,actor_email,action_type,entity_type,entity_id,previous_value,new_value
 ) values(
  p_actor,null,'RUBI_NOTIFICATION_TEMPLATE_UPDATED','notification_template',p_template_id,
  jsonb_build_object('type',old_row.type,'active',old_row.is_active,'length',length(old_row.template)),
  jsonb_build_object('type',new_row.type,'active',new_row.is_active,'length',length(new_row.template))
 );
 return jsonb_build_object('id',new_row.id,'type',new_row.type,
  'template',new_row.template,'is_active',new_row.is_active,'updated_at',new_row.updated_at);
end;
$rubi$;
revoke all on function public.rubi_update_notification_template_audited(uuid,text,boolean,uuid)
 from public,anon,authenticated;
grant execute on function public.rubi_update_notification_template_audited(uuid,text,boolean,uuid)
 to service_role;
revoke insert,update,delete on public.notification_templates
 from public,anon,authenticated;
