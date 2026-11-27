-- Sprint 362: keep Telegram outbox rows readable by Owner, but close direct client DML.
-- The only supported mutations are the audited service_role prepare/finalize RPCs.
drop policy if exists "Admins manage telegram messages" on public.telegram_messages;
drop policy if exists "Owners manage telegram messages" on public.telegram_messages;

create policy "Admins can view telegram messages"
  on public.telegram_messages
  for select
  to authenticated
  using (public.is_admin());

revoke all privileges
  on table public.telegram_messages
  from public, anon, authenticated;

grant select
  on table public.telegram_messages
  to authenticated;

grant all privileges
  on table public.telegram_messages
  to service_role;

comment on table public.telegram_messages is
  'Telegram outbox: Owner-only reads; all state transitions must use the audited service_role prepare/finalize RPCs.';
