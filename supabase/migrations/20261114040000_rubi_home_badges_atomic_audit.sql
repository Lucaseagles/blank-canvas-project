-- RUBI 185: home/badge configuration changes commit atomically with the Master audit record.
-- Do not grant public access to these functions. No synthetic sales or external side effects.
create or replace function public.rubi_set_home_module_enabled_audited(
 p_actor uuid,p_id uuid,p_expected boolean,p_enabled boolean
) returns table(saved_id uuid)
language plpgsql security invoker set search_path=''
as $$
declare prior public.home_modules_config%rowtype;
begin
 if p_actor is null or not exists(select 1 from public.user_roles r
    where r.user_id=p_actor and r.role='owner') then raise exception 'Owner required'; end if;
 if p_expected is null or p_enabled is null then raise exception 'Expected state required'; end if;
 select * into prior from public.home_modules_config m where m.id=p_id for update;
 if not found then raise exception 'Module not found'; end if;
 if prior.is_enabled is distinct from p_expected then raise exception 'Module changed; reload'; end if;
 if prior.is_enabled=p_enabled then raise exception 'No change requested'; end if;
 update public.home_modules_config m set is_enabled=p_enabled,updated_at=now() where m.id=p_id;
 insert into public.admin_audit_log(actor_user_id,actor_email,action_type,entity_type,entity_id,
    previous_value,new_value)
 values(p_actor,null,case when p_enabled then 'HOME_MODULE_ENABLED' else 'HOME_MODULE_DISABLED' end,
  'home_module',p_id,jsonb_build_object('is_enabled',prior.is_enabled),
  jsonb_build_object('is_enabled',p_enabled,'module_key',prior.module_key));
 return query select p_id;
end;
$$;
revoke all on function public.rubi_set_home_module_enabled_audited(uuid,uuid,boolean,boolean)
 from public,anon,authenticated;
grant execute on function public.rubi_set_home_module_enabled_audited(uuid,uuid,boolean,boolean)
 to service_role;

create or replace function public.rubi_reorder_home_modules_audited(
 p_actor uuid,p_ids uuid[],p_expected_ids uuid[]
) returns table(saved_count integer)
language plpgsql security invoker set search_path=''
as $$
declare previous_ids uuid[]; item uuid; i integer;
begin
 if p_actor is null or not exists(select 1 from public.user_roles r
    where r.user_id=p_actor and r.role='owner') then raise exception 'Owner required'; end if;
 if p_ids is null or p_expected_ids is null or cardinality(p_ids) not between 1 and 100
  or cardinality(p_ids)<>cardinality(p_expected_ids) or array_position(p_ids,null) is not null
  or array_position(p_expected_ids,null) is not null
  or (select count(distinct x) from unnest(p_ids) x)<>cardinality(p_ids)
 then raise exception 'Invalid ordered list'; end if;
 -- Serialize independent reorder requests and lock every row before comparing the snapshot.
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('rubi_home_modules_order',185));
 select array_agg(locked.id order by locked.display_order,locked.id) into previous_ids
 from (select id,display_order from public.home_modules_config for update) locked;
 if previous_ids is null or previous_ids<>p_expected_ids
  or cardinality(previous_ids)<>cardinality(p_ids)
  or (select array_agg(x order by x) from unnest(previous_ids) x)
    is distinct from (select array_agg(x order by x) from unnest(p_ids) x)
 then raise exception 'Home order changed; reload'; end if;
 if previous_ids=p_ids then raise exception 'Order already current'; end if;
 for i in 1..cardinality(p_ids) loop
  item:=p_ids[i];
  update public.home_modules_config m set display_order=i,updated_at=now() where m.id=item;
 end loop;
 insert into public.admin_audit_log(actor_user_id,actor_email,action_type,entity_type,entity_id,
  previous_value,new_value)
 values(p_actor,null,'HOME_MODULES_REORDERED','home_module',p_ids[1],
  jsonb_build_object('ids',previous_ids),jsonb_build_object('ids',p_ids));
 return query select cardinality(p_ids);
end;
$$;
revoke all on function public.rubi_reorder_home_modules_audited(uuid,uuid[],uuid[])
 from public,anon,authenticated;
grant execute on function public.rubi_reorder_home_modules_audited(uuid,uuid[],uuid[])
 to service_role;

create or replace function public.rubi_set_badge_enabled_audited(
 p_actor uuid,p_id uuid,p_expected boolean,p_enabled boolean
) returns table(saved_id uuid)
language plpgsql security invoker set search_path=''
as $$
declare prior public.badges_config%rowtype;
begin
 if p_actor is null or not exists(select 1 from public.user_roles r
    where r.user_id=p_actor and r.role='owner') then raise exception 'Owner required'; end if;
 if p_expected is null or p_enabled is null then raise exception 'Expected state required'; end if;
 select * into prior from public.badges_config b where b.id=p_id for update;
 if not found then raise exception 'Badge not found'; end if;
 if prior.is_enabled is distinct from p_expected then raise exception 'Badge changed; reload'; end if;
 if prior.is_enabled=p_enabled then raise exception 'No change requested'; end if;
 update public.badges_config b set is_enabled=p_enabled,updated_at=now() where b.id=p_id;
 insert into public.admin_audit_log(actor_user_id,actor_email,action_type,entity_type,entity_id,
    previous_value,new_value)
 values(p_actor,null,case when p_enabled then 'BADGE_ENABLED' else 'BADGE_DISABLED' end,
  'badge_config',p_id,jsonb_build_object('is_enabled',prior.is_enabled),
  jsonb_build_object('is_enabled',p_enabled,'badge_key',prior.badge_key));
 return query select p_id;
end;
$$;
revoke all on function public.rubi_set_badge_enabled_audited(uuid,uuid,boolean,boolean)
 from public,anon,authenticated;
grant execute on function public.rubi_set_badge_enabled_audited(uuid,uuid,boolean,boolean)
 to service_role;
