-- Sprint 133: distinguish a referral landing event from the verified
-- pre-checkout screen opening in the same existing (tokenized) visit.
-- This is an observed page state, NOT a checkout authorization or transaction.
alter table public.hub_partner_referral_visits
 add column if not exists precheckout_viewed_at timestamptz;
comment on column public.hub_partner_referral_visits.precheckout_viewed_at is
 'Server-confirmed precheckout page displayed after validated referral visit token. Does not prove purchase, checkout intent, payment, commission or unique human.';

create index if not exists hub_partner_referral_precheckout_stage_idx
 on public.hub_partner_referral_visits(publication_id,visited_at)
 where publication_id is not null and precheckout_viewed_at is not null;

-- New function, leaves the existing visit-count RPC untouched for backward compatibility.
create or replace function public.rubi_creator_publication_precheckout_counts(
 p_publication_ids uuid[],
 p_since timestamptz
)
returns table(publication_id uuid, precheckout_views bigint)
language sql stable security invoker
set search_path=public,pg_temp
as $$
 select v.publication_id,count(*)::bigint
 from public.hub_partner_referral_visits v
 where v.publication_id=any(p_publication_ids)
   and v.visited_at>=p_since
   and v.precheckout_viewed_at is not null
 group by v.publication_id;
$$;
revoke all on function public.rubi_creator_publication_precheckout_counts(uuid[],timestamptz)
 from public,anon,authenticated;
grant execute on function public.rubi_creator_publication_precheckout_counts(uuid[],timestamptz)
 to service_role;
comment on function public.rubi_creator_publication_precheckout_counts(uuid[],timestamptz)
 is 'Owner server-only counts of observed precheckout page displays among tagged partner referral events, not purchases.';
