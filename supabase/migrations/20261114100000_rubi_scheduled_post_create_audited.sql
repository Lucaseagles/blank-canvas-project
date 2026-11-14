-- RUBI Sprint 202: creation and audit of manual scheduled posts are indivisible.
create or replace function public.rubi_create_scheduled_post_audited(
 p_content_type text, p_content_id uuid, p_channels text[], p_scheduled_for timestamptz,
 p_message_template text, p_actor uuid
) returns jsonb language plpgsql security invoker set search_path=''
as $fn$
declare
 created public.scheduled_posts%rowtype;
begin
 if p_actor is null or not exists(
  select 1 from public.user_roles r where r.user_id=p_actor and r.role='owner'
 ) then raise exception 'Owner authorization required'; end if;
 if p_content_id is null or p_content_type not in ('offer','video','bundle') then
  raise exception 'Invalid scheduled content'; end if;
 if p_channels is null or cardinality(p_channels)<>1 or p_channels[1]<>'telegram' then
  raise exception 'Only the supported Telegram channel may be scheduled'; end if;
 if p_scheduled_for is null or p_scheduled_for<=now() then
  raise exception 'Publication must be scheduled in the future'; end if;
 if length(btrim(coalesce(p_message_template,''))) not between 1 and 4000 then
  raise exception 'Invalid publication message'; end if;
 if not (
    (p_content_type='offer' and exists(select 1 from public.offer_groups t where t.id=p_content_id))
    or (p_content_type='video' and exists(select 1 from public.videos t where t.id=p_content_id))
    or (p_content_type='bundle' and exists(select 1 from public.products t where t.id=p_content_id))
 ) then raise exception 'Scheduled content not found'; end if;
 insert into public.scheduled_posts(
  content_type,content_id,channels,scheduled_for,message_template,status,created_by
 ) values (
  p_content_type,p_content_id,p_channels,p_scheduled_for,btrim(p_message_template),'pending',p_actor
 ) returning * into created;
 insert into public.admin_audit_log(
  actor_user_id,actor_email,action_type,entity_type,entity_id,previous_value,new_value
 ) values (
  p_actor,null,'RUBI_SCHEDULED_POST_CREATED','scheduled_post',created.id,
  '{}'::jsonb,
  jsonb_build_object('status','pending','content_type',p_content_type,
    'content_id',p_content_id,'channels',to_jsonb(p_channels))
 );
 return to_jsonb(created);
end;
$fn$;
revoke all on function public.rubi_create_scheduled_post_audited(text,uuid,text[],timestamptz,text,uuid)
 from public,anon,authenticated;
grant execute on function public.rubi_create_scheduled_post_audited(text,uuid,text[],timestamptz,text,uuid)
 to service_role;
