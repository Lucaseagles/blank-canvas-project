-- Serialize Owner-triggered opportunity refreshes and atomically record the aggregate run.
create or replace function public.rubi_refresh_opportunity_alerts_audited(p_actor uuid)
returns jsonb
language plpgsql
security invoker
set search_path=''
as $fn$
declare
  v_count integer := 0;
  v_run_id uuid := gen_random_uuid();
begin
  if p_actor is null or not exists (
    select 1 from public.user_roles r
    where r.user_id=p_actor and r.role::text='owner'
  ) then
    raise exception 'Owner authorization required';
  end if;

  -- Prevent overlapping refresh jobs from interleaving their upserts.
  perform pg_advisory_xact_lock(hashtext('rubi_opportunity_alerts_refresh'));

  insert into public.opportunity_alerts(
    opportunity_type,source_id,title,score,priority,reasons,recommended_action,status,updated_at
  )
  select
    'product',
    p.id,
    p.title,
    least(100,greatest(0,
      coalesce(p.demand_score,0)*.35 +
      coalesce(p.trend_velocity,0)*.35 +
      coalesce(p.offer_score,0)*.20 +
      least(coalesce(p.discount,0),100)*.10
    )),
    least(100,greatest(0,round(
      coalesce(p.trend_velocity,0)*.5 +
      coalesce(p.demand_score,0)*.3 +
      coalesce(p.discount,0)*.2
    ))),
    jsonb_build_array(
      case when coalesce(p.trend_velocity,0)>=70 then 'Alta velocidade de tendência' end,
      case when coalesce(p.demand_score,0)>=70 then 'Alta demanda' end,
      case when coalesce(p.offer_score,0)>=70 then 'Oferta forte' end,
      case when coalesce(p.discount,0)>=20 then 'Desconto relevante' end
    ),
    'Revisar para possível promoção',
    'open',
    clock_timestamp()
  from public.products p
  where p.status in ('active','published')
  on conflict(opportunity_type,source_id) do update
  set title=excluded.title,
      score=excluded.score,
      priority=excluded.priority,
      reasons=excluded.reasons,
      recommended_action=excluded.recommended_action,
      updated_at=excluded.updated_at,
      status=case when public.opportunity_alerts.status='actioned'
        then 'actioned' else 'open' end;

  get diagnostics v_count = row_count;

  insert into public.admin_audit_log(
    actor_user_id,actor_email,action_type,entity_type,entity_id,previous_value,new_value
  ) values (
    p_actor,null,'RUBI_OPPORTUNITY_ALERTS_REFRESHED','opportunity_alerts_refresh',v_run_id::text,
    '{}'::jsonb,
    jsonb_build_object('affected_rows',v_count,'scope','active_and_published_products')
  );

  return jsonb_build_object('run_id',v_run_id,'count',v_count);
end;
$fn$;

revoke all on function public.rubi_refresh_opportunity_alerts_audited(uuid) from public,anon,authenticated;
grant execute on function public.rubi_refresh_opportunity_alerts_audited(uuid) to service_role;
revoke all on function public.refresh_opportunity_alerts() from public,anon,authenticated,service_role;
comment on function public.rubi_refresh_opportunity_alerts_audited(uuid)
  is 'Owner-only serialized opportunity refresh with aggregate audit in the same transaction.';
