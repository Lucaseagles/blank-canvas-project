-- Sprint 32: unified admin audit foundation.
-- No business configuration is introduced here; this table only records administrative mutations.
create table if not exists public.admin_audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid not null references auth.users(id) on delete restrict,
  action_type text not null,
  entity_type text not null,
  entity_id text,
  previous_value jsonb,
  new_value jsonb,
  created_at timestamptz not null default timezone('utc'::text, now())
);

create index if not exists admin_audit_log_entity_created_idx on public.admin_audit_log (entity_type, created_at desc);
create index if not exists admin_audit_log_created_idx on public.admin_audit_log (created_at desc);
create index if not exists admin_audit_log_action_idx on public.admin_audit_log (action_type, created_at desc);

alter table public.admin_audit_log enable row level security;

drop policy if exists "Owner can read admin audit log" on public.admin_audit_log;
create policy "Owner can read admin audit log" on public.admin_audit_log for select to authenticated
using (exists (select 1 from public.user_roles ur where ur.user_id = auth.uid() and ur.role = 'owner'));

revoke insert, update, delete on public.admin_audit_log from anon, authenticated;
grant select on public.admin_audit_log to authenticated;
grant all on public.admin_audit_log to service_role;

create or replace function public.sanitize_admin_audit_value(input jsonb)
returns jsonb language plpgsql immutable as $$
declare result jsonb := input; key text;
begin
  if input is null then return null; end if;
  foreach key in array array['token','access_token','refresh_token','api_key','apikey','secret','password','client_secret','authorization','bot_token','service_role_key'] loop
    result := result - key;
  end loop;
  return result;
end;
$$;

-- SECURITY DEFINER is required because authenticated clients are intentionally denied direct INSERT.
-- The actor is still taken from auth.uid(), never from client input.
create or replace function public.append_admin_audit(
  p_action_type text,
  p_entity_type text,
  p_entity_id text default null,
  p_previous_value jsonb default null,
  p_new_value jsonb default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare audit_id uuid;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  if not exists (select 1 from public.user_roles ur where ur.user_id = auth.uid() and ur.role = 'owner') then
    raise exception 'Owner access required';
  end if;
  insert into public.admin_audit_log (actor_user_id, action_type, entity_type, entity_id, previous_value, new_value)
  values (auth.uid(), p_action_type, p_entity_type, p_entity_id,
          public.sanitize_admin_audit_value(p_previous_value), public.sanitize_admin_audit_value(p_new_value))
  returning id into audit_id;
  return audit_id;
end;
$$;

grant execute on function public.append_admin_audit(text,text,text,jsonb,jsonb) to authenticated;
revoke execute on function public.append_admin_audit(text,text,text,jsonb,jsonb) from anon;
