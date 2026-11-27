-- Sprint 362: system-owned content events and legacy Owner-config tables must not expose direct API DML.
-- The notification worker and personalization reads already use trusted server/service-role paths.

drop policy if exists "owner manages content notification queue" on public.content_notification_queue;
create policy "owner can view content notification queue"
  on public.content_notification_queue for select to authenticated
  using (private.has_role((select auth.uid()), 'owner'::public.app_role));

drop policy if exists "owner manages content affinity logs" on public.content_affinity_log;
create policy "owner can view content affinity logs"
  on public.content_affinity_log for select to authenticated
  using (private.has_role((select auth.uid()), 'owner'::public.app_role));

revoke all privileges on table
  public.content_notification_queue,
  public.content_affinity_log
from public, anon, authenticated;

grant select on table
  public.content_notification_queue,
  public.content_affinity_log
to authenticated;

grant all privileges on table
  public.content_notification_queue,
  public.content_affinity_log
to service_role;

comment on table public.content_notification_queue is
  'System-owned notification queue: Owner reads only; queue transitions run through the service-role worker.';
comment on table public.content_affinity_log is
  'System-owned affinity events: Owner reads only; writes are produced by trusted affinity/notification workers.';

do $legacy_admin_tables$
begin
  -- These legacy tables exist in the connected project but are absent from the
  -- versioned migration bootstrap. Harden them only when present; never invent schema.
  if to_regclass('public.support_ai_config') is not null then
    execute 'drop policy if exists "Owners manage support AI config" on public.support_ai_config';
    execute $support_policy$
      create policy "Owners can view support AI config"
        on public.support_ai_config for select to authenticated
        using (public.is_admin())
    $support_policy$;
    execute 'revoke all privileges on table public.support_ai_config from public, anon, authenticated';
    execute 'grant select on table public.support_ai_config to authenticated';
    execute 'grant all privileges on table public.support_ai_config to service_role';
    execute $support_comment$
      comment on table public.support_ai_config is
        'Legacy support AI config: Owner reads only; Edge Function reads through service_role.'
    $support_comment$;
  end if;

  if to_regclass('public.offer_products') is not null then
    execute 'drop policy if exists "Owners can manage offer products" on public.offer_products';
    execute $offer_policy$
      create policy "Owners can view offer products"
        on public.offer_products for select to authenticated
        using (private.has_role((select auth.uid()), 'owner'::public.app_role))
    $offer_policy$;
    execute 'revoke all privileges on table public.offer_products from public, anon, authenticated';
    execute 'grant select on table public.offer_products to authenticated';
    execute 'grant all privileges on table public.offer_products to service_role';
    execute $offer_comment$
      comment on table public.offer_products is
        'Legacy offer product mapping: Owner reads only; mutations remain server-role controlled.'
    $offer_comment$;
  end if;

  if to_regclass('public.recommendation_config') is not null then
    execute 'drop policy if exists "Owners can manage recommendation config" on public.recommendation_config';
    execute $recommendation_policy$
      create policy "Owners can view recommendation config"
        on public.recommendation_config for select to authenticated
        using (private.has_role((select auth.uid()), 'owner'::public.app_role))
    $recommendation_policy$;
    execute 'revoke all privileges on table public.recommendation_config from public, anon, authenticated';
    execute 'grant select on table public.recommendation_config to authenticated';
    execute 'grant all privileges on table public.recommendation_config to service_role';
    execute $recommendation_comment$
      comment on table public.recommendation_config is
        'Legacy recommendation config: Owner reads only; mutations remain server-role controlled.'
    $recommendation_comment$;
  end if;
end
$legacy_admin_tables$;
