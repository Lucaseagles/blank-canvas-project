-- Sprint 362: prevent direct Owner DML from bypassing the audited social-channel RPC.
-- Reads remain Owner-only; all mutations must go through rubi_manage_social_channel_audited.
drop policy if exists "Owners can manage social channels" on public.social_channels;

create policy "Owners can view social channels"
  on public.social_channels
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.user_roles ur
      where ur.user_id = auth.uid()
        and ur.role::text = 'owner'
    )
  );

revoke insert, update, delete
  on table public.social_channels
  from public, anon, authenticated;

grant select on table public.social_channels to authenticated;
grant all on table public.social_channels to service_role;

comment on table public.social_channels is
  'Private channel configuration. Reads are Owner-only; mutations must use rubi_manage_social_channel_audited.';
