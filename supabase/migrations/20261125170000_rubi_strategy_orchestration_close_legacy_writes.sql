-- Sprint 308 hardening: close legacy direct-write and RPC paths.
-- The application now performs Strategy Orchestration mutations only through
-- server-side, Owner-verified, atomically audited RPCs. Keep authenticated
-- reads available, but remove direct DML and legacy mutation RPC execution.

-- Legacy overloads were granted to authenticated by earlier Sprint 31 migrations.
revoke all on function public.create_strategy_orchestration(text, text, integer, text, uuid[])
  from public, anon, authenticated, service_role;
revoke all on function public.create_strategy_orchestration(text, text, integer, text, uuid[], uuid[])
  from public, anon, authenticated, service_role;
revoke all on function public.generate_strategy_orchestration_plan(uuid)
  from public, anon, authenticated, service_role;
revoke all on function public.approve_strategy_orchestration(uuid)
  from public, anon, authenticated, service_role;

-- Owner-only RLS policies are not an audit boundary: an Owner with table DML
-- grants could still mutate rows directly and bypass the audited RPCs.
revoke all on table public.strategy_orchestrations,
  public.strategy_orchestration_items,
  public.strategy_orchestration_videos
  from public, anon, authenticated;

grant select on table public.strategy_orchestrations,
  public.strategy_orchestration_items,
  public.strategy_orchestration_videos
  to authenticated;

-- Trusted server functions use the service-role client and audited RPCs.
grant select, insert, update, delete on table public.strategy_orchestrations,
  public.strategy_orchestration_items,
  public.strategy_orchestration_videos
  to service_role;

comment on table public.strategy_orchestrations is
  'Strategy Orchestration records; authenticated clients are read-only and mutations must use audited server RPCs.';
comment on table public.strategy_orchestration_items is
  'Strategy Orchestration strategy links; authenticated clients are read-only and mutations must use audited server RPCs.';
comment on table public.strategy_orchestration_videos is
  'Strategy Orchestration video links; authenticated clients are read-only and mutations must use audited server RPCs.';
