-- Session-level sequence: card click -> product view -> checkout intent.
-- No user/anonymous/session identifiers are returned to the Master.
-- This is still NOT evidence of a completed purchase.
create function public.rubi_editorial_session_journey(p_days integer default 30)
returns table(section_id uuid, product_id uuid,
 clicked_sessions bigint, viewed_after_click_sessions bigint,
 checkout_after_view_sessions bigint)
language sql stable security definer set search_path = ''
as $$
 with raw as (
  select e.event_name, e.product_id, e.session_id, e.created_at,
   case
    when e.event_name='RUBI_STOREFRONT_SECTION_CLICK'
     then e.metadata->>'section_id'
    else e.metadata->>'editorial_section_id'
   end as section_text,
   e.metadata
  from public.analytics_events e
  where e.created_at>=now()-make_interval(days=>least(greatest(p_days,1),90))
   and e.session_id is not null and length(e.session_id) between 8 and 128
   and e.event_name in ('RUBI_STOREFRONT_SECTION_CLICK','RUBI_STORE_PRODUCT_VIEW','RUBI_PRECHECKOUT_CONTINUE')
 ),
 validated as (
  select r.event_name,r.product_id,r.session_id,r.created_at,r.section_text::uuid as section_id
  from raw r
  where r.section_text ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
   and (r.event_name<>'RUBI_PRECHECKOUT_CONTINUE' or
      (r.metadata->>'origin'='store' and r.metadata->>'has_partner_referral'='false'))
 ),
 eligible as (
  select v.* from validated v
  inner join public.rubi_storefront_sections s on s.id=v.section_id
  where v.product_id=any(s.product_ids)
 ),
 -- Each session enters a single section/product journey at its first click.
 clicks as (
  select e.section_id,e.product_id,e.session_id,min(e.created_at) as first_click
  from eligible e where e.event_name='RUBI_STOREFRONT_SECTION_CLICK'
  group by e.section_id,e.product_id,e.session_id
 ),
 views as (
  select c.section_id,c.product_id,c.session_id,c.first_click,
   min(e.created_at) as first_view
  from clicks c
  left join eligible e on e.section_id=c.section_id and e.product_id=c.product_id
   and e.session_id=c.session_id and e.event_name='RUBI_STORE_PRODUCT_VIEW'
   and e.created_at>=c.first_click and e.created_at<=c.first_click+interval '30 minutes'
  group by c.section_id,c.product_id,c.session_id,c.first_click
 ),
 journeys as (
  select v.section_id,v.product_id,v.session_id,v.first_view,
   exists(
    select 1 from eligible e
    where e.section_id=v.section_id and e.product_id=v.product_id
     and e.session_id=v.session_id and e.event_name='RUBI_PRECHECKOUT_CONTINUE'
     and v.first_view is not null and e.created_at>=v.first_view
     and e.created_at<=v.first_view+interval '30 minutes'
   ) as checkout_followed
  from views v
 )
 select j.section_id,j.product_id,count(*)::bigint,
  count(*) filter (where j.first_view is not null)::bigint,
  count(*) filter (where j.checkout_followed)::bigint
 from journeys j group by j.section_id,j.product_id
$$;
revoke all on function public.rubi_editorial_session_journey(integer) from public,anon,authenticated;
grant execute on function public.rubi_editorial_session_journey(integer) to service_role;
comment on function public.rubi_editorial_session_journey(integer) is
 'Counts distinct clicked sessions progressing in order within 30 minutes. No buyer identities or confirmed sales.';
