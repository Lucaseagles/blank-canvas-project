-- Sprint 233: make the partner product authorization ledger server-only.
-- Application reads/writes use service_role from server functions after auth/eligibility checks.
-- RLS remains enabled with no client policies; do not add generic client policies here.
revoke all privileges on table public.hub_partner_product_grants from public, anon, authenticated;
grant all privileges on table public.hub_partner_product_grants to service_role;
