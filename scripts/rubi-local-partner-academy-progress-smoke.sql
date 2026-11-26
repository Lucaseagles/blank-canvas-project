\\set ON_ERROR_STOP on
begin;

do $$
begin
  if has_table_privilege('anon','public.hub_partner_academy_progress','SELECT')
    or has_table_privilege('authenticated','public.hub_partner_academy_progress','SELECT')
    or has_table_privilege('anon','public.hub_partner_academy_progress','INSERT')
    or has_table_privilege('authenticated','public.hub_partner_academy_progress','INSERT') then
    raise exception 'Client roles unexpectedly have direct academy progress table access';
  end if;
  if has_function_privilege('anon','public.rubi_get_partner_academy_progress(uuid)','EXECUTE')
    or has_function_privilege('authenticated','public.rubi_get_partner_academy_progress(uuid)','EXECUTE')
    or has_function_privilege('anon','public.rubi_set_partner_academy_lesson_completion(uuid,text,boolean)','EXECUTE')
    or has_function_privilege('authenticated','public.rubi_set_partner_academy_lesson_completion(uuid,text,boolean)','EXECUTE') then
    raise exception 'Client roles unexpectedly have academy progress RPC execution';
  end if;
  if not has_function_privilege('service_role','public.rubi_get_partner_academy_progress(uuid)','EXECUTE')
    or not has_function_privilege('service_role','public.rubi_set_partner_academy_lesson_completion(uuid,text,boolean)','EXECUTE') then
    raise exception 'service_role is missing academy progress RPC execution';
  end if;
end;
$$;

set local role service_role;
select public.rubi_set_partner_academy_lesson_completion(:'partner_id'::uuid,'common:foundations',true);
select public.rubi_set_partner_academy_lesson_completion(:'partner_id'::uuid,'common:foundations',true);
do $$
declare
  v_count integer;
begin
  select count(*) into v_count from public.hub_partner_academy_progress
  where user_id=:'partner_id'::uuid and lesson_key='common:foundations';
  if v_count<>1 then raise exception 'Idempotent completion should persist exactly one row; got %',v_count; end if;
end;
$$;
do $$
begin
  begin
    perform public.rubi_set_partner_academy_lesson_completion(:'partner_id'::uuid,'expert:authority',true);
    raise exception 'Affiliate was able to complete an expert-only lesson';
  exception when raise_exception then
    if sqlerrm='Affiliate was able to complete an expert-only lesson' then raise; end if;
  end;
end;
$$;
do $$
declare
  v_count integer;
begin
  select count(*) into v_count from public.hub_partner_academy_progress
  where user_id=:'partner_id'::uuid and lesson_key='expert:authority';
  if v_count<>0 then raise exception 'Profile-specific lesson restriction failed'; end if;
end;
$$;
do $$
begin
  begin
    perform public.rubi_get_partner_academy_progress(:'consumer_id'::uuid);
    raise exception 'Consumer was able to read partner academy progress';
  exception when raise_exception then
    if sqlerrm='Consumer was able to read partner academy progress' then raise; end if;
  end;
end;
$$;
select public.rubi_set_partner_academy_lesson_completion(:'partner_id'::uuid,'common:foundations',false);
do $$
declare
  v_count integer;
begin
  select count(*) into v_count from public.hub_partner_academy_progress
  where user_id=:'partner_id'::uuid and lesson_key='common:foundations';
  if v_count<>0 then raise exception 'Unchecking lesson did not remove persisted progress'; end if;
end;
$$;
reset role;
rollback;
