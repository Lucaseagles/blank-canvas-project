-- Sprint 322: immutable first-touch customer acquisition by an approved RUBI partner.
-- This records acquisition, never a purchase or commission. Only trusted server-side binding is allowed.
create table if not exists public.hub_partner_customer_acquisitions (
  customer_user_id uuid primary key references auth.users(id) on delete cascade,
  commercial_profile_id uuid not null references public.commercial_profiles(id) on delete restrict,
  referral_link_id uuid not null references public.hub_partner_referral_links(id) on delete restrict,
  acquired_product_id uuid not null references public.hub_products(id) on delete restrict,
  attribution_source text not null default 'partner_referral_signup'
    check (attribution_source = 'partner_referral_signup'),
  attributed_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '90 days'),
  constraint hub_partner_customer_acquisition_window_check check (expires_at > attributed_at)
);

create index if not exists hub_partner_customer_acquisitions_partner_time_idx
  on public.hub_partner_customer_acquisitions(commercial_profile_id, attributed_at desc);
create index if not exists hub_partner_customer_acquisitions_expiry_idx
  on public.hub_partner_customer_acquisitions(expires_at);

alter table public.hub_partner_customer_acquisitions enable row level security;
revoke all on public.hub_partner_customer_acquisitions from public, anon, authenticated;
grant all on public.hub_partner_customer_acquisitions to service_role;

create or replace function public.rubi_bind_partner_customer_acquisition(
  p_actor uuid,
  p_code uuid
) returns jsonb
language plpgsql
security definer
set search_path=''
as $function$
declare
  link public.hub_partner_referral_links%rowtype;
  partner_user_id uuid;
  inserted_count integer;
  existing public.hub_partner_customer_acquisitions%rowtype;
begin
  if p_actor is null or p_code is null then raise exception 'Invalid acquisition binding'; end if;

  select * into link
  from public.hub_partner_referral_links
  where code=p_code and active=true
  for share;
  if not found then return jsonb_build_object('bound',false,'reason','invalid_or_inactive_link'); end if;

  select user_id into partner_user_id
  from public.commercial_profiles
  where id=link.commercial_profile_id and audience='partner' and status='approved';
  if not found or partner_user_id=p_actor then
    return jsonb_build_object('bound',false,'reason','partner_not_eligible');
  end if;

  if not exists (
    select 1 from public.hub_partner_agreements a
    where a.commercial_profile_id=link.commercial_profile_id and a.active=true
  ) then return jsonb_build_object('bound',false,'reason','agreement_inactive'); end if;

  if not exists (
    select 1 from public.hub_partner_product_grants g
    where g.commercial_profile_id=link.commercial_profile_id
      and g.product_id=link.product_id and g.active=true
  ) then return jsonb_build_object('bound',false,'reason','product_not_granted'); end if;

  if not exists (
    select 1 from public.hub_products p
    join public.hub_suppliers s on s.id=p.supplier_id
    where p.id=link.product_id and p.active=true and p.checkout_verified=true
      and p.checkout_url is not null and p.retail_price>0 and s.active=true
  ) then return jsonb_build_object('bound',false,'reason','product_unavailable'); end if;

  insert into public.hub_partner_customer_acquisitions(
    customer_user_id,commercial_profile_id,referral_link_id,acquired_product_id
  ) values(p_actor,link.commercial_profile_id,link.id,link.product_id)
  on conflict(customer_user_id) do nothing;
  get diagnostics inserted_count = row_count;

  if inserted_count=1 then
    return jsonb_build_object('bound',true,'status','bound','window_days',90);
  end if;

  select * into existing from public.hub_partner_customer_acquisitions
  where customer_user_id=p_actor;
  if existing.referral_link_id=link.id then
    return jsonb_build_object('bound',true,'status','already_bound','window_days',
      greatest(0,floor(extract(epoch from (existing.expires_at-now()))/86400))::integer);
  end if;
  return jsonb_build_object('bound',false,'status','already_attributed');
end;
$function$;

revoke all on function public.rubi_bind_partner_customer_acquisition(uuid,uuid) from public,anon,authenticated;
grant execute on function public.rubi_bind_partner_customer_acquisition(uuid,uuid) to service_role;

comment on table public.hub_partner_customer_acquisitions is
 'Immutable first-touch partner customer acquisition, valid for 90 days. Not a sale, payment, order or commission.';
