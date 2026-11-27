# Sprint 365 — SECURITY DEFINER execution grants

## Scope
Close the browser-execution gap for three audited SECURITY DEFINER functions.

- `append_admin_audit`: keep authenticated EXECUTE because its body derives the actor from `auth.uid()` and enforces Owner. Remove PUBLIC/anon.
- `get_eligible_benefit_popup`: server-only. The server resolves the authenticated user and calls via service_role; browser execution would permit arbitrary `p_user_id` probing.
- `audit_marketplace_mutation`: trigger-only; remove direct browser EXECUTE while preserving its attached PostgreSQL trigger.

## Evidence and gates
- Migration uses explicit REVOKE/GRANT and catalog assertions.
- Disposable PostgreSQL smoke checks effective privileges for anon, authenticated and service_role.
- Static contract test ties the migration to the actual server callsite.
- Never apply to remote/production as part of this PR.
- This is security/coverage work toward criterion 11.3, but no matrix point is converted until the complete admin mutation inventory and PostgreSQL evidence are reconciled.
