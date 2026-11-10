-- RUBI 11x: aggregate first-party organic traffic by product, channel and campaign.
-- Counts are browser analytics, not purchases or unique customers.
-- No user identifiers or private costs leave this function.
create or replace function public.rubi_organic_campaign_performance(
  p_days integer default 30,
  p_limit integer default 100
)
returns table (
  product_id uuid,
  product_title text,
  channel text,
  campaign text,
  view_events bigint,
  view_sessions bigint,
  checkout_intents bigint
)
language sql
stable
security invoker
set search_path = ''
as $$
  with eligible as (
    select
      ev.product_id,
      ev.source as channel,
      ev.metadata ->> 'utm_campaign' as campaign,
      ev.event_name,
      ev.session_id,
      ev.metadata
    from public.analytics_events as ev
    where ev.created_at >= now() - make_interval(days => greatest(1, least(coalesce(p_days, 30), 90)))
      and ev.event_name in ('RUBI_STORE_PRODUCT_VIEW', 'RUBI_PRECHECKOUT_CONTINUE')
      and ev.product_id is not null
      and ev.metadata ->> 'utm_medium' = 'organic_social'
      and ev.source in ('instagram','tiktok','youtube','facebook','pinterest','whatsapp','telegram')
      and (ev.metadata ->> 'utm_campaign') ~ '^[a-z0-9][a-z0-9_-]{0,59}$'
      and (
        ev.event_name = 'RUBI_STORE_PRODUCT_VIEW'
        or (ev.event_name = 'RUBI_PRECHECKOUT_CONTINUE' and ev.metadata ->> 'origin' = 'store')
      )
  )
  select
    e.product_id,
    coalesce(hp.title, 'Produto indisponível')::text as product_title,
    e.channel::text,
    e.campaign::text,
    count(*) filter (where e.event_name = 'RUBI_STORE_PRODUCT_VIEW')::bigint as view_events,
    count(distinct e.session_id) filter (where e.event_name = 'RUBI_STORE_PRODUCT_VIEW')::bigint as view_sessions,
    count(*) filter (where e.event_name = 'RUBI_PRECHECKOUT_CONTINUE')::bigint as checkout_intents
  from eligible as e
  left join public.hub_products as hp on hp.id = e.product_id
  group by e.product_id, hp.title, e.channel, e.campaign
  order by view_events desc, checkout_intents desc, e.channel, e.campaign, e.product_id
  limit greatest(1, least(coalesce(p_limit, 100), 200));
$$;

-- Analytics aggregations may only run from the protected server/service role.
revoke all on function public.rubi_organic_campaign_performance(integer,integer) from public, anon, authenticated;
grant execute on function public.rubi_organic_campaign_performance(integer,integer) to service_role;

comment on function public.rubi_organic_campaign_performance(integer,integer) is
  'Owner-only server reporting with service role; organic event/session counts, NOT paid orders or revenue.';
