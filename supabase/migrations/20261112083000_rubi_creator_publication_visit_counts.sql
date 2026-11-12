-- Aggregate existing tagged referral visits using exact counts in the database.
-- Access exclusively through the Shadow Master's server-side service role.
-- The function accepts a bounded set of reviewed publication IDs, so the result
-- never exceeds the number of IDs the authorized caller supplied.
create or replace function public.rubi_creator_publication_visit_counts(
 p_publication_ids uuid[],
 p_since timestamptz
)
returns table(publication_id uuid, visit_events bigint)
language sql stable security invoker
set search_path = public, pg_temp
as $$
 select v.publication_id, count(*)::bigint as visit_events
 from public.hub_partner_referral_visits v
 where v.publication_id = any(p_publication_ids)
   and v.visited_at >= p_since
 group by v.publication_id
$$;

revoke all on function public.rubi_creator_publication_visit_counts(uuid[],timestamptz)
 from public,anon,authenticated;
grant execute on function public.rubi_creator_publication_visit_counts(uuid[],timestamptz)
 to service_role;
comment on function public.rubi_creator_publication_visit_counts(uuid[],timestamptz)
 is 'Master-only via service role; exact URL-tagged visit event counts for supplied publication IDs. Not unique people, impressions, sales, commissions or attributed paid orders.';
