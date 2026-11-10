-- RUBI 11x Business: merchant quote requests, not paid orders.
-- No public access. All reads/writes are performed on the trusted server
-- after verification of the Supabase auth token and approved merchant profile.
create table if not exists public.hub_b2b_quote_requests (
  id uuid primary key default gen_random_uuid(),
  commercial_profile_id uuid not null references public.commercial_profiles(id) on delete cascade,
  merchant_user_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'requested'
    check (status in ('requested','reviewing','responded','closed')),
  requested_lines jsonb not null
    check (jsonb_typeof(requested_lines) = 'array' and jsonb_array_length(requested_lines) between 1 and 12),
  total_estimate numeric(16,2) not null check (total_estimate > 0 and total_estimate <= 50000000),
  merchant_note text not null default '' check (char_length(merchant_note) <= 500),
  owner_note text not null default '' check (char_length(owner_note) <= 500),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists hub_b2b_quote_requests_merchant_time_idx
  on public.hub_b2b_quote_requests (commercial_profile_id, created_at desc);
create index if not exists hub_b2b_quote_requests_status_time_idx
  on public.hub_b2b_quote_requests (status, created_at desc);

alter table public.hub_b2b_quote_requests enable row level security;
revoke all on public.hub_b2b_quote_requests from public, anon, authenticated;
grant select, insert, update on public.hub_b2b_quote_requests to service_role;

comment on table public.hub_b2b_quote_requests is
  'Private commercial quote requests, server-validated and priced at submission time. Not orders, reservations, supplier confirmations, payments or revenue.';
comment on column public.hub_b2b_quote_requests.requested_lines is
  'Immutable snapshot of approved B2B product, quantities and calculated unit prices. Quotes require a fresh price check before any commercial fulfillment.';
