-- Sprint 38 — Social Sharing security hardening
-- The application client must never be able to modify global sharing configuration unless the caller is Owner.

revoke all on public.share_templates from anon;
revoke all on public.share_card_config from anon;
revoke all on public.share_history from anon;

grant select on public.share_templates to anon, authenticated;
grant select, insert, update, delete on public.share_templates to authenticated;
grant select on public.share_card_config to authenticated;
grant insert, update, delete on public.share_card_config to authenticated;
grant select, insert on public.share_history to authenticated;

-- Keep public users limited to active templates. Owner can inspect inactive templates through the owner policy.
drop policy if exists share_templates_owner_write_s38 on public.share_templates;
create policy share_templates_owner_write_s38
on public.share_templates
for all
to authenticated
using (public.has_role((select auth.uid()), 'owner'))
with check (public.has_role((select auth.uid()), 'owner'));

drop policy if exists share_templates_owner_select_s38 on public.share_templates;
create policy share_templates_owner_select_s38
on public.share_templates
for select
to authenticated
using (public.has_role((select auth.uid()), 'owner'));

drop policy if exists share_card_config_owner_write_s38 on public.share_card_config;
create policy share_card_config_owner_write_s38
on public.share_card_config
for all
to authenticated
using (public.has_role((select auth.uid()), 'owner'))
with check (public.has_role((select auth.uid()), 'owner'));

drop policy if exists share_history_owner_select_s38 on public.share_history;
create policy share_history_owner_select_s38
on public.share_history
for select
to authenticated
using ((select auth.uid()) = user_id or public.has_role((select auth.uid()), 'owner'));
