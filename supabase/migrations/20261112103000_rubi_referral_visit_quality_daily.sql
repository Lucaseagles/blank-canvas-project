-- RUBI Sprint 132: privacy-preserving quality diagnostics of existing referral visits.
-- Exact counts of stored events, NOT unique people, bots, post impressions or orders.
-- This function is callable only by the owner-protected server with service_role.
create or replace function public.rubi_referral_visit_quality_daily(
 p_since timestamptz
)
returns table(
 visit_day date,
 total_events bigint,
 tokenized_events bigint,
 legacy_events bigint,
 tagged_publication_events bigint
)
language sql stable security invoker
set search_path = public, pg_temp
as $$
 select (v.visited_at at time zone 'UTC')::date as visit_day,
        count(*)::bigint as total_events,
        count(*) filter (where v.visit_token is not null)::bigint as tokenized_events,
        count(*) filter (where v.visit_token is null)::bigint as legacy_events,
        count(*) filter (where v.publication_id is not null)::bigint as tagged_publication_events
 from public.hub_partner_referral_visits v
 where v.visited_at >= p_since
 group by (v.visited_at at time zone 'UTC')::date
 order by visit_day asc;
$$;
revoke all on function public.rubi_referral_visit_quality_daily(timestamptz) from public,anon,authenticated;
grant execute on function public.rubi_referral_visit_quality_daily(timestamptz) to service_role;
comment on function public.rubi_referral_visit_quality_daily(timestamptz)
 is 'Owner-only daily exact event counts. A visit token indicates deduplication capability, not a human, a unique user or absence of fraud.';
