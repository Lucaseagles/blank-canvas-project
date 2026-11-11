-- Aggregate editorial card clicks without exporting visitor identifiers.
create or replace function public.rubi_editorial_click_summary(p_days integer default 30)
returns table(section_id uuid,product_id uuid,click_events bigint,click_sessions bigint)
language sql security definer set search_path = ''
as $$
 select
  (e.metadata->>'section_id')::uuid as section_id,
  e.product_id,
  count(*)::bigint as click_events,
  count(distinct e.session_id)::bigint as click_sessions
 from public.analytics_events e
 where e.event_name='RUBI_STOREFRONT_SECTION_CLICK'
  and e.created_at >= now()-make_interval(days=>least(greatest(p_days,1),90))
  and e.metadata->>'section_id' ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
  and exists(
    select 1 from public.rubi_storefront_sections s
    where s.id=(e.metadata->>'section_id')::uuid
     and e.product_id=any(s.product_ids)
  )
 group by 1,2
$$;
revoke all on function public.rubi_editorial_click_summary(integer) from public,anon,authenticated;
grant execute on function public.rubi_editorial_click_summary(integer) to service_role;
comment on function public.rubi_editorial_click_summary(integer) is
 'Private aggregate of observed editorial card clicks; not unique people, purchases or checkout confirmations.';
