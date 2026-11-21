-- Sprint 167: one immutable founding Master controls the delegation of owner access.
-- No email is used to authorize Master access.
create table if not exists public.rubi_primary_master (
 singleton integer primary key default 1 check (singleton=1),
 user_id uuid not null unique references auth.users(id) on delete restrict,
 created_at timestamptz not null default now()
);
alter table public.rubi_primary_master enable row level security;
revoke all on public.rubi_primary_master from public,anon,authenticated;

do $bootstrap$
declare owner_count integer; founding_owner uuid;
begin
 select count(*) into owner_count from public.user_roles where role='owner';
 select user_id into founding_owner from public.user_roles where role='owner' limit 1;
 if owner_count <> 1 then
  raise exception 'Founding Master bootstrap requires exactly one existing owner role';
 end if;
 if not exists(select 1 from public.rubi_primary_master) then
  insert into public.rubi_primary_master(user_id) values(founding_owner);
 elsif not exists(select 1 from public.rubi_primary_master where user_id=founding_owner) then
  raise exception 'Founding Master mismatch; manual security review required';
 end if;
end;
$bootstrap$;

-- General Owner access never authorizes granting/revoking account roles directly.
drop policy if exists user_roles_owner_delete on public.user_roles;
drop policy if exists user_roles_owner_insert on public.user_roles;
drop policy if exists user_roles_owner_update on public.user_roles;
revoke insert,update,delete on public.user_roles from anon,authenticated;

create or replace function public.rubi_manage_master_access(
 p_actor uuid,p_target uuid,p_grant boolean
)
returns void language plpgsql security invoker set search_path=''
as $$
declare founding_owner uuid;
begin
 select p.user_id into founding_owner from public.rubi_primary_master p for share;
 if founding_owner is null or founding_owner<>p_actor
 or not exists(select 1 from public.user_roles r where r.user_id=p_actor and r.role='owner') then
  raise exception 'Founding Master authorization required';
 end if;
 if p_target is null or p_target=founding_owner then
  raise exception 'Founding Master role cannot be modified';
 end if;
 if not exists(select 1 from auth.users u where u.id=p_target) then
  raise exception 'Target user must already exist';
 end if;
 perform pg_advisory_xact_lock(hashtextextended(p_target::text,7));
 if p_grant then
  insert into public.user_roles(user_id,role) values(p_target,'owner')
   on conflict(user_id,role) do nothing;
 else
  delete from public.user_roles where user_id=p_target and role='owner';
 end if;
 insert into public.admin_audit_log(
   actor_user_id,actor_email,action_type,entity_type,entity_id,previous_value,new_value
 ) values(
  p_actor,null,
  case when p_grant then 'RUBI_MASTER_GRANTED' else 'RUBI_MASTER_REVOKED' end,
  'user_role',p_target,
  jsonb_build_object('role','owner','change','requested'),
  jsonb_build_object('role','owner','granted',p_grant)
 );
end;
$$;
revoke all on function public.rubi_manage_master_access(uuid,uuid,boolean)
 from public,anon,authenticated;
grant execute on function public.rubi_manage_master_access(uuid,uuid,boolean) to service_role;
comment on function public.rubi_manage_master_access(uuid,uuid,boolean) is
 'Founding Master exclusively controls grants/revocations through a single audited transaction. Service role only.';

create or replace function public.rubi_primary_master_id()
returns uuid language sql stable security invoker set search_path=''
as $$ select user_id from public.rubi_primary_master limit 1; $$;
revoke all on function public.rubi_primary_master_id() from public,anon,authenticated;
grant execute on function public.rubi_primary_master_id() to service_role;
