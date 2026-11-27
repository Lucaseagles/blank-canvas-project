-- Sprint 362: restore the deployed trending refresh entrypoint in clean local
-- bootstrap and make the manual Owner action + automation log + admin audit atomic.
-- The refresh body intentionally preserves the deployed loop and delegates scoring
-- to the existing calculate_product_* functions; it does not redefine their formulas.

create or replace function public.refresh_demand_and_trend_scores()
returns void
language plpgsql
security invoker
set search_path = ''
as $refresh$
declare
  r record;
begin
  for r in select id from public.products loop
    update public.products
       set demand_score = public.calculate_product_demand(r.id),
           trend_velocity = public.calculate_product_trend_velocity(r.id)
     where id = r.id;
  end loop;
end;
$refresh$;

revoke all on function public.refresh_demand_and_trend_scores()
  from public, anon, authenticated;
grant execute on function public.refresh_demand_and_trend_scores()
  to service_role;

create or replace function public.rubi_recalculate_trending_audited(
  p_actor uuid
) returns jsonb
language plpgsql
security invoker
set search_path = ''
as $fn$
declare
  v_rule public.automation_rules%rowtype;
  v_processed integer := 0;
  v_error text;
  v_error_code text;
  v_entity_id_type text;
begin
  if p_actor is null or not exists (
    select 1 from public.user_roles r
    where r.user_id = p_actor and r.role::text = 'owner'
  ) then
    raise exception 'Owner authorization required';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended('rubi:manual-automation:RECALCULATE_TRENDING', 0)
  );

  select * into v_rule
    from public.automation_rules
   where action_type::text = 'RECALCULATE_TRENDING'
   order by created_at, id
   limit 1
   for update;

  if not found then
    return pg_catalog.jsonb_build_object(
      'success', false, 'processed', 0, 'error', 'Trending rule not found'
    );
  end if;

  if v_rule.is_active is distinct from true then
    return pg_catalog.jsonb_build_object(
      'success', false, 'processed', 0, 'error', 'Trending rule is disabled'
    );
  end if;

  select pg_catalog.format_type(a.atttypid, a.atttypmod)
    into v_entity_id_type
    from pg_catalog.pg_attribute a
   where a.attrelid = 'public.admin_audit_log'::regclass
     and a.attname = 'entity_id'
     and a.attnum > 0
     and not a.attisdropped;

  if v_entity_id_type not in ('text', 'uuid') then
    raise exception 'Unsupported admin_audit_log.entity_id type';
  end if;

  begin
    perform public.refresh_demand_and_trend_scores();

    select count(*)::integer into v_processed
      from public.products;

    insert into public.automation_logs(rule_id, context, result, status)
    values (
      v_rule.id,
      pg_catalog.jsonb_build_object(
        'triggered_by', 'admin_manual',
        'actor_user_id', p_actor
      ),
      pg_catalog.format('Trending scores refreshed for %s products', v_processed),
      'success'
    );

    if v_entity_id_type = 'uuid' then
      insert into public.admin_audit_log(
        actor_user_id, action_type, entity_type, entity_id, previous_value, new_value
      ) values (
        p_actor, 'RUBI_AUTOMATION_TRENDING_RECALCULATED',
        'automation_rules', v_rule.id,
        pg_catalog.jsonb_build_object('is_active', v_rule.is_active),
        pg_catalog.jsonb_build_object('processed', v_processed, 'triggered_by', 'admin_manual')
      );
    else
      insert into public.admin_audit_log(
        actor_user_id, action_type, entity_type, entity_id, previous_value, new_value
      ) values (
        p_actor, 'RUBI_AUTOMATION_TRENDING_RECALCULATED',
        'automation_rules', v_rule.id::text,
        pg_catalog.jsonb_build_object('is_active', v_rule.is_active),
        pg_catalog.jsonb_build_object('processed', v_processed, 'triggered_by', 'admin_manual')
      );
    end if;

    return pg_catalog.jsonb_build_object(
      'success', true, 'processed', v_processed
    );
  exception when others then
    -- The exception block is a subtransaction: a failed refresh or success-audit
    -- insert rolls back all product updates and success logs before this failure
    -- record is written. If failure auditing also fails, the whole RPC aborts.
    get stacked diagnostics v_error_code = returned_sqlstate;
    -- Do not persist raw SQLERRM: it can contain row values or other sensitive context.
    v_error := 'Trending recalculation failed (SQLSTATE ' || v_error_code || ')';

    insert into public.automation_logs(rule_id, context, result, status)
    values (
      v_rule.id,
      pg_catalog.jsonb_build_object(
        'triggered_by', 'admin_manual',
        'actor_user_id', p_actor
      ),
      v_error,
      'failed'
    );

    if v_entity_id_type = 'uuid' then
      insert into public.admin_audit_log(
        actor_user_id, action_type, entity_type, entity_id, previous_value, new_value
      ) values (
        p_actor, 'RUBI_AUTOMATION_TRENDING_RECALCULATION_FAILED',
        'automation_rules', v_rule.id,
        pg_catalog.jsonb_build_object('is_active', v_rule.is_active),
        pg_catalog.jsonb_build_object('error', v_error, 'triggered_by', 'admin_manual')
      );
    else
      insert into public.admin_audit_log(
        actor_user_id, action_type, entity_type, entity_id, previous_value, new_value
      ) values (
        p_actor, 'RUBI_AUTOMATION_TRENDING_RECALCULATION_FAILED',
        'automation_rules', v_rule.id::text,
        pg_catalog.jsonb_build_object('is_active', v_rule.is_active),
        pg_catalog.jsonb_build_object('error', v_error, 'triggered_by', 'admin_manual')
      );
    end if;

    return pg_catalog.jsonb_build_object(
      'success', false, 'processed', 0, 'error', v_error
    );
  end;
end;
$fn$;

revoke all on function public.rubi_recalculate_trending_audited(uuid)
  from public, anon, authenticated;
grant execute on function public.rubi_recalculate_trending_audited(uuid)
  to service_role;

comment on function public.rubi_recalculate_trending_audited(uuid)
  is 'Owner-verified manual trending refresh with serialized execution, automation log, rollback-safe failure handling and actor-attributed admin audit.';
