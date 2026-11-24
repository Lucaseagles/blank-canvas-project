-- Sprint 306: align the unified audit table with the audited business RPCs.
-- The actor identity remains mandatory; email is optional display metadata only.
-- Existing RLS and grants are intentionally unchanged.
alter table public.admin_audit_log
  add column if not exists actor_email text;

comment on column public.admin_audit_log.actor_email is
  'Optional audit display metadata. Never used for authorization; actor_user_id remains the authoritative identity.';
