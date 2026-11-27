-- Sprint 362: prevent direct Owner DML from bypassing the audited Opportunity Engine RPCs.
-- Browser/API roles may read as Owner, but every mutation must use the audited service_role RPCs.
drop policy if exists opportunity_alerts_owner_all on public.opportunity_alerts;

create policy opportunity_alerts_owner_select
  on public.opportunity_alerts
  for select
  to authenticated
  using (public.has_role((select auth.uid()), 'owner'::public.app_role));

revoke all privileges
  on table public.opportunity_alerts
  from public, anon, authenticated;

grant select
  on table public.opportunity_alerts
  to authenticated;

grant all privileges
  on table public.opportunity_alerts
  to service_role;

comment on table public.opportunity_alerts is
  'Opportunity Engine alerts: Owner SELECT only; all mutations must use the audited service_role RPCs.';

-- The read RPC is SECURITY DEFINER; only the trusted server-side service role may call it.
-- Owner authorization is enforced by the server function before this RPC is reached.
revoke all on function public.get_opportunity_alerts(text) from public, anon, authenticated;
grant execute on function public.get_opportunity_alerts(text) to service_role;
