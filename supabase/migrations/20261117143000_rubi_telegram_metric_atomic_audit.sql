-- RUBI Sprint 228: Telegram metric persistence and audit are one transaction.
create or replace function public.rubi_record_telegram_metric_audited(
 p_channel_id uuid,
 p_value integer,
 p_actor uuid
) returns jsonb
language plpgsql
security invoker
set search_path=''
as $fn$
declare
 v_channel public.social_channels%rowtype;
 v_metric public.external_channel_metrics%rowtype;
begin
 if p_actor is null or not exists (
  select 1 from public.user_roles r
  where r.user_id=p_actor and r.role='owner'
 ) then
  raise exception 'Owner authorization required';
 end if;

 if p_channel_id is null or p_value is null or p_value < 0 then
  raise exception 'Invalid Telegram metric input';
 end if;

 select * into v_channel
 from public.social_channels
 where id=p_channel_id and platform='telegram' and is_active=true
 for share;

 if not found then
  raise exception 'Active Telegram channel not found';
 end if;

 insert into public.external_channel_metrics(channel_id,metric_type,value)
 values(p_channel_id,'member_count',p_value)
 returning * into v_metric;

 insert into public.admin_audit_log(
  actor_user_id,actor_email,action_type,entity_type,entity_id,previous_value,new_value
 ) values (
  p_actor,null,'TELEGRAM_METRIC_COLLECTED','external_channel_metric',v_metric.id,
  '{}'::jsonb,
  jsonb_build_object(
   'channel_id',v_metric.channel_id,
   'metric_type',v_metric.metric_type,
   'value',v_metric.value,
   'collected_at',v_metric.collected_at
  )
 );

 return jsonb_build_object(
  'id',v_metric.id,
  'channel_id',v_metric.channel_id,
  'metric_type',v_metric.metric_type,
  'value',v_metric.value,
  'collected_at',v_metric.collected_at
 );
end;
$fn$;

revoke all on function public.rubi_record_telegram_metric_audited(uuid,integer,uuid)
 from public,anon,authenticated;
grant execute on function public.rubi_record_telegram_metric_audited(uuid,integer,uuid)
 to service_role;
comment on function public.rubi_record_telegram_metric_audited(uuid,integer,uuid)
 is 'Owner-gated atomic insert of Telegram member metric and matching sanitized admin audit record.';
