-- Sprint 362: close direct Owner DML bypasses on the generic Admin Settings surface.
-- All writes already flow through the allowlisted, audited service-role RPCs.
-- Preserve Owner reads and the public active-banner read policy.

drop policy if exists "Admins can manage points config" on public.app_points_config;
create policy "Owners can view points config"
  on public.app_points_config for select to authenticated
  using (public.has_role((select auth.uid()), 'owner'::public.app_role));

drop policy if exists "Admins can manage automation rules" on public.automation_rules;
create policy "Owners can view automation rules"
  on public.automation_rules for select to authenticated
  using (public.has_role((select auth.uid()), 'owner'::public.app_role));

drop policy if exists "Admins can manage banners" on public.banners;
create policy "Owners can view banners"
  on public.banners for select to authenticated
  using (public.has_role((select auth.uid()), 'owner'::public.app_role));
-- Keep "Allow public read-only access to active banners" unchanged.

drop policy if exists "Admins can manage compliance rules" on public.compliance_rules;
create policy "Owners can view compliance rules"
  on public.compliance_rules for select to authenticated
  using (public.has_role((select auth.uid()), 'owner'::public.app_role));

drop policy if exists feature_flags_owner_all on public.feature_flags;
create policy feature_flags_owner_select
  on public.feature_flags for select to authenticated
  using (exists (
    select 1 from public.user_roles ur
    where ur.user_id = (select auth.uid()) and ur.role = 'owner'::public.app_role
  ));

drop policy if exists "Admins can manage feed mix config" on public.feed_mix_config;
create policy "Owners can view feed mix config"
  on public.feed_mix_config for select to authenticated
  using (public.has_role((select auth.uid()), 'owner'::public.app_role));

drop policy if exists "Owners manage personalization weights" on public.personalization_weights;
create policy "Owners can view personalization weights"
  on public.personalization_weights for select to authenticated
  using (public.is_admin());

drop policy if exists "Owners manage social proof config" on public.social_proof_config;
create policy "Owners can view social proof config"
  on public.social_proof_config for select to authenticated
  using (public.is_admin());

drop policy if exists "Admins manage telegram config" on public.telegram_config;
drop policy if exists "Owners manage telegram config" on public.telegram_config;
create policy "Owners can view telegram config"
  on public.telegram_config for select to authenticated
  using (public.is_admin());

drop policy if exists whatsapp_config_admin_insert on public.whatsapp_config;
drop policy if exists whatsapp_config_admin_update on public.whatsapp_config;
-- Keep whatsapp_config_admin_select unchanged.

revoke all privileges on table
  public.app_points_config,
  public.automation_rules,
  public.banners,
  public.compliance_rules,
  public.feature_flags,
  public.feed_mix_config,
  public.personalization_weights,
  public.social_proof_config,
  public.telegram_config,
  public.whatsapp_config
from public, anon, authenticated;

grant select on table
  public.app_points_config,
  public.automation_rules,
  public.banners,
  public.compliance_rules,
  public.feature_flags,
  public.feed_mix_config,
  public.personalization_weights,
  public.social_proof_config,
  public.telegram_config,
  public.whatsapp_config
to authenticated;

-- Banners remain publicly readable only through their active/time-window RLS policy.
grant select on table public.banners to anon;

grant all privileges on table
  public.app_points_config,
  public.automation_rules,
  public.banners,
  public.compliance_rules,
  public.feature_flags,
  public.feed_mix_config,
  public.personalization_weights,
  public.social_proof_config,
  public.telegram_config,
  public.whatsapp_config
to service_role;

comment on table public.app_points_config is
  'Admin Settings: Owner reads only; mutations must use rubi_update_admin_setting_audited.';
comment on table public.automation_rules is
  'Admin Settings: Owner reads only; mutations must use rubi_update_admin_setting_audited.';
comment on table public.banners is
  'Admin Settings: Owner reads and public active-banner reads only; mutations must use rubi_update_admin_setting_audited.';
comment on table public.compliance_rules is
  'Admin Settings: Owner reads only; mutations must use rubi_update_admin_setting_audited.';
comment on table public.feature_flags is
  'Admin Settings: Owner reads only; mutations must use rubi_update_admin_setting_audited.';
comment on table public.feed_mix_config is
  'Admin Settings: Owner reads only; mutations must use rubi_update_admin_setting_audited.';
comment on table public.personalization_weights is
  'Admin Settings: Owner reads only; mutations must use rubi_update_admin_setting_audited.';
comment on table public.social_proof_config is
  'Admin Settings: Owner reads only; mutations must use rubi_update_admin_setting_audited.';
comment on table public.telegram_config is
  'Telegram config: Owner reads only; mutations must use rubi_save_telegram_config_audited.';
comment on table public.whatsapp_config is
  'WhatsApp config: Owner reads only; mutations must use rubi_update_admin_setting_audited.';
