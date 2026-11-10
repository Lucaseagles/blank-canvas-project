-- RUBI Business: a replenishment is a new quote request linked to an older
-- quote belonging to the same approved merchant. It is NOT a paid reorder.
alter table public.hub_b2b_quote_requests
  add column if not exists replenishment_of_quote_id uuid
    references public.hub_b2b_quote_requests(id) on delete set null,
  add column if not exists responded_at timestamptz;

create index if not exists hub_b2b_quote_requests_responded_idx
  on public.hub_b2b_quote_requests (responded_at)
  where responded_at is not null;
create index if not exists hub_b2b_quote_requests_replenishment_idx
  on public.hub_b2b_quote_requests (commercial_profile_id,replenishment_of_quote_id,created_at)
  where replenishment_of_quote_id is not null;

comment on column public.hub_b2b_quote_requests.replenishment_of_quote_id is
  'Previous quote used as a replenishment reference; validated to belong to the same merchant and include overlapping products. NOT a reorder or paid purchase.';
comment on column public.hub_b2b_quote_requests.responded_at is
  'First commercial response timestamp, set only when the Master provides a nonblank reply; retained if quote is later closed.';

-- One row, aggregated within the requested time horizon. All results count
-- requests/merchants, never paid purchases. Can be executed only from the
-- protected owner server using service_role (same model as campaign reporting).
create or replace function public.rubi_business_retention_funnel(
  p_days integer default 30
)
returns table (
  quote_requests bigint,
  requesting_merchants bigint,
  responded_requests bigint,
  merchants_with_response bigint,
  pending_requests bigint,
  replenishment_requests bigint,
  replenishing_merchants bigint,
  repeat_request_merchants bigint
)
language sql
stable
security invoker
set search_path = ''
as $$
  with window_quotes as (
    select q.id, q.commercial_profile_id, q.created_at,
           q.responded_at, q.status, q.replenishment_of_quote_id
    from public.hub_b2b_quote_requests q
    where q.created_at >= now() - make_interval(days => greatest(1, least(coalesce(p_days,30),90)))
  )
  select
    count(*)::bigint as quote_requests,
    count(distinct q.commercial_profile_id)::bigint as requesting_merchants,
    count(*) filter (where q.responded_at is not null)::bigint as responded_requests,
    count(distinct q.commercial_profile_id) filter (where q.responded_at is not null)::bigint as merchants_with_response,
    count(*) filter (where q.responded_at is null and q.status in ('requested','reviewing'))::bigint as pending_requests,
    count(*) filter (where q.replenishment_of_quote_id is not null)::bigint as replenishment_requests,
    count(distinct q.commercial_profile_id) filter (where q.replenishment_of_quote_id is not null)::bigint as replenishing_merchants,
    count(distinct q.commercial_profile_id) filter (
      where exists (
        select 1 from public.hub_b2b_quote_requests previous
        where previous.commercial_profile_id = q.commercial_profile_id
          and (previous.created_at, previous.id::text) < (q.created_at, q.id::text)
      )
    )::bigint as repeat_request_merchants
  from window_quotes q;
$$;

revoke all on function public.rubi_business_retention_funnel(integer) from public, anon, authenticated;
grant execute on function public.rubi_business_retention_funnel(integer) to service_role;
comment on function public.rubi_business_retention_funnel(integer) is
  'Aggregate 30-day RUBI Business quote requests, responded requests and repeat/replenishment interest, not paid sales or recurring revenue.';
