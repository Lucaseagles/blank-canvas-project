-- Editorial funnel events are observed independently, not proven sequential journeys.
-- Only currently mapped section/product pairs are included. No visitor IDs leave this RPC.
create function public.rubi_editorial_funnel_summary(p_days integer default 30)
returns table(
 section_id uuid, product_id uuid,
 card_clicks bigint, card_click_sessions bigint,
 product_views bigint, product_view_sessions bigint,
 checkout_intents bigint, checkout_intent_sessions bigint
)
language sql stable security definer set search_path = ''
as $$
 with tagged as (
  select e.event_name,e.product_id,e.session_id,
   case
    when e.event_name = 'RUBI_STOREFRONT_SECTION_CLICK'
       and e.metadata->>'section_id' ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
      then (e.metadata->>'section_id')::uuid
    when e.event_name in ('RUBI_STORE_PRODUCT_VIEW','RUBI_PRECHECKOUT_CONTINUE')
       and e.metadata->>'editorial_section_id' ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
      then (e.metadata->>'editorial_section_id')::uuid
    else null
   end as editorial_section_id
  from public.analytics_events e
  where e.created_at >= now()-make_interval(days=>least(greatest(p_days,1),90))
   and e.event_name in ('RUBI_STOREFRONT_SECTION_CLICK','RUBI_STORE_PRODUCT_VIEW','RUBI_PRECHECKOUT_CONTINUE')
 )
 select t.editorial_section_id as section_id,t.product_id,
  count(*) filter(where t.event_name='RUBI_STOREFRONT_SECTION_CLICK')::bigint as card_clicks,
  count(distinct t.session_id) filter(where t.event_name='RUBI_STOREFRONT_SECTION_CLICK')::bigint as card_click_sessions,
  count(*) filter(where t.event_name='RUBI_STORE_PRODUCT_VIEW')::bigint as product_views,
  count(distinct t.session_id) filter(where t.event_name='RUBI_STORE_PRODUCT_VIEW')::bigint as product_view_sessions,
  count(*) filter(where t.event_name='RUBI_PRECHECKOUT_CONTINUE')::bigint as checkout_intents,
  count(distinct t.session_id) filter(where t.event_name='RUBI_PRECHECKOUT_CONTINUE')::bigint as checkout_intent_sessions
 from tagged t
 inner join public.rubi_storefront_sections s on s.id=t.editorial_section_id and t.product_id=any(s.product_ids)
 where t.editorial_section_id is not null and t.product_id is not null
 group by t.editorial_section_id,t.product_id
$$;
revoke all on function public.rubi_editorial_funnel_summary(integer) from public,anon,authenticated;
grant execute on function public.rubi_editorial_funnel_summary(integer) to service_role;
comment on function public.rubi_editorial_funnel_summary(integer) is
 'Owner-facing aggregate stages by current section/product pair, not validated end-to-end conversions, revenue or orders.';
