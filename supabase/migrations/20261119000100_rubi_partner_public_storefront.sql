-- Sprint 278: stable public storefront identifiers for approved RUBI partners.
-- Public storefront data is served only by a narrow server function; no table policy is added.
alter table public.commercial_profiles
  add column if not exists public_store_code text;

update public.commercial_profiles
set public_store_code = lower(substr(replace(gen_random_uuid()::text, '-', ''), 1, 12))
where audience = 'partner' and public_store_code is null;

create unique index if not exists commercial_profiles_public_store_code_uniq
  on public.commercial_profiles(public_store_code)
  where public_store_code is not null;

alter table public.commercial_profiles
  drop constraint if exists commercial_profiles_public_store_code_format_check;
alter table public.commercial_profiles
  add constraint commercial_profiles_public_store_code_format_check
  check (public_store_code is null or public_store_code ~ '^[a-f0-9]{12}$');

create or replace function public.assign_partner_public_store_code()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.audience = 'partner' and new.public_store_code is null then
    new.public_store_code := lower(substr(replace(gen_random_uuid()::text, '-', ''), 1, 12));
  end if;
  return new;
end;
$$;

drop trigger if exists commercial_profiles_assign_partner_store_code on public.commercial_profiles;
create trigger commercial_profiles_assign_partner_store_code
before insert on public.commercial_profiles
for each row execute function public.assign_partner_public_store_code();

revoke all on function public.assign_partner_public_store_code() from public, anon, authenticated;

comment on column public.commercial_profiles.public_store_code is
  'Stable opaque public URL identifier for an approved partner storefront; public reads are served through a server function.';
