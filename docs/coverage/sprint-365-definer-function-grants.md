# Sprint 365 — SECURITY DEFINER execution grants

## Scope
Close the browser-execution gap for three audited SECURITY DEFINER functions.

- `append_admin_audit`: keep authenticated EXECUTE because its body derives the actor from `auth.uid()` and enforces Owner. Remove PUBLIC/anon.
- `get_eligible_benefit_popup`: server-only. The server resolves the authenticated user and calls via service_role; browser execution would permit arbitrary `p_user_id` probing.
- `audit_marketplace_mutation`: trigger-only; remove direct browser EXECUTE while preserving its attached PostgreSQL trigger.

## Catalog finding — marketplace trigger function

The disposable PostgreSQL run found that `public.audit_marketplace_mutation()` exists but is not attached to any non-internal trigger in the migrated schema. The marketplace mutation path is already handled by the audited RPC `rubi_manage_marketplace_audited`; therefore this PR does not invent or reattach a legacy trigger (which could duplicate audit records). It only removes direct browser EXECUTE from the residual trigger-function signature. The catalog assertion requiring a live trigger attachment was removed because it contradicted the actual migrated schema. The remaining grant assertions still prove browser roles cannot invoke the function directly.

This finding is not evidence that all marketplace auditing is missing: the RPC, its atomic audit path, and its existing regression tests are already present. It is also not counted as an additional matrix point.

## Evidence and gates
- Migration uses explicit REVOKE/GRANT and catalog assertions.
- Disposable PostgreSQL smoke checks effective privileges for anon, authenticated and service_role.
- Static contract test ties the migration to the actual server callsite.
- Never apply to remote/production as part of this PR.
- This is security/coverage work toward criterion 11.3, but no matrix point is converted until the complete admin mutation inventory and PostgreSQL evidence are reconciled.
