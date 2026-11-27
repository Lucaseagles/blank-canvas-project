-- Sprint 362: marketplace administration already uses an atomic Owner RPC.
-- Remove the legacy authenticated table-write path so direct Owner DML cannot bypass it.

drop policy if exists "Admin marketplaces manage" on public.marketplaces;
drop policy if exists "Admins manage marketplaces" on public.marketplaces;
drop policy if exists marketplaces_owner_select_s362 on public.marketplaces;
create policy marketplaces_owner_select_s362
  on public.marketplaces for select to authenticated
  using (public.has_role((select auth.uid()), 'owner'::public.app_role));

revoke insert, update, delete, truncate, references, trigger
  on public.marketplaces from public, anon, authenticated;

-- Preserve the established public catalog fields only. Sensitive API fields remain
-- hidden from anon/authenticated; trusted server functions use service_role.
revoke select on public.marketplaces from anon, authenticated;
revoke select (api_config, api_status, affiliate_link_structure, updated_at) on public.marketplaces from anon, authenticated;
grant select (id, name, slug, status, created_at, icon)
  on public.marketplaces to anon, authenticated;
grant all privileges on public.marketplaces to service_role;

-- The only mutation entrypoint remains the Owner-verified, atomic audit RPC.
revoke all on function public.rubi_manage_marketplace_audited(text,uuid,jsonb,uuid)
  from public, anon, authenticated;
grant execute on function public.rubi_manage_marketplace_audited(text,uuid,jsonb,uuid)
  to service_role;
