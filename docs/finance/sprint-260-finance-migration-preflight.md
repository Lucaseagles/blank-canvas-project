# Sprint 260 — finance migration preflight review

Audit date: 2026-11-18
Repository base: `main`
Supabase project: `heartful-helper-box` (`akfvkjarpgocdsieuvvq`)

## Purpose

Continue the Sprint 259 release-blocker audit with a read-only production catalog check and static review of the seven post-Sprint-234 migrations. This document is not an approval to deploy and contains no production database changes.

## Production facts rechecked

The Supabase migration history contains 219 records and ends at `20261118001747` (`rubi_profile_privilege_hardening_sprint234`). The following expected objects remain absent:

- `rubi_process_due_video_launch_audited(uuid,uuid)`
- `rubi_claim_scheduled_post_audited(uuid)`
- `rubi_finish_scheduled_post_audited(uuid,text,text)`
- `rubi_finance_*` tables and Sprint 253 allocation/reversal functions

The production partner payout RPC is still the legacy five-argument overload:
`hub_settle_partner_commissions(uuid,uuid[],text,timestamptz,text)`.

The production table `hub_partner_commission_payout_items` still has the unique constraint `hub_partner_commission_payout_items_sale_id_key`, which prevents multiple installments for one sale.

The helper used by the planned Owner-only finance read policy exists in production:
`public.has_role(uuid, public.app_role)`, currently SECURITY INVOKER with `search_path=public`.

## Static review of the seven pending migrations

| Migration | Review result | Notes |
|---|---|---|
| Sprint 243 video launch | Static review completed | Owner check; row lock; video transition, audit and Telegram queue record share a transaction; Telegram delivery itself remains external. |
| Sprint 240 editorial UUID fix | Static review completed | Canonical UUID regex has five UUID groups; journey aggregation is not a sales confirmation. |
| Sprint 246 scheduled-post worker | Static review completed | Worker claim/finish RPCs are restricted to service_role and preserve the initiating Owner in audit. External delivery is not made exactly-once by this transaction. |
| Sprint 247 partner payout audit | Dependency review only | This migration introduces the six-argument legacy-shaped RPC; Sprint 250 replaces it with the JSON allocation signature. Deploy in order. |
| Sprint 250 partial payouts | Static review completed | Drops the legacy unique sale constraint and old overloads; locks sale rows in deterministic order; caps installments against the remaining commission; writes audit in the transaction. |
| Sprint 252 finance core | Static review completed | Creates provider/event/obligation/entry/allocation/reconciliation structures; enables RLS; authenticated reads are Owner-gated; service-role writes only. |
| Sprint 253 finance operations | Static review completed | Allocation locks entry then obligation and caps both balances; reversal creates compensating ledger entries and allocations; external-provider refunds remain separate. |

## Important implementation boundaries

1. These migrations are not deployed to production. GitHub merge status is not database deployment status.
2. No Kairos or marketplace API integration is assumed. The provider registry supports manual-only and report-import workflows.
3. A redirect, click, cart action, or checkout intent is not a confirmed sale or cash receipt.
4. A finance ledger reversal does not issue a refund at an external gateway or marketplace.
5. Existing partner sales and payout tables remain the specialized legacy sub-ledger. A later integration must reconcile/import them exactly once; do not duplicate commission obligations or historical payouts.
6. The migration files have not yet been executed together against a clean disposable database in this preflight. Static review is not a substitute for that test.
7. Production backup, migration-history reconciliation, negative authorization tests, and post-deployment catalog verification remain release gates.

## Deployment order

The intended dependency order remains:

1. `20261118010100_rubi_video_launch_atomic_audit.sql`
2. `20261118020100_rubi_editorial_session_journey_uuid_fix.sql`
3. `20261118020200_rubi_scheduled_post_worker_atomic_audit.sql`
4. `20261118030000_rubi_partner_payout_atomic_audit.sql`
5. `20261118040000_rubi_partner_partial_payouts.sql`
6. `20261118050000_rubi_financial_domain_core_sprint252.sql`
7. `20261118060000_rubi_finance_atomic_operations_sprint253.sql`

This order is a proposed sequence, not permission to run it in production.

## Release gates still open

- Reconcile the full historical migration mapping by SQL content and deployed objects, not filename alone.
- Execute the exact seven-file sequence in a clean disposable database.
- Run Supabase security advisors and inspect RLS, grants, function owners, SECURITY DEFINER search paths, and service-role execution.
- Add negative tests for anon, authenticated non-owner, partner, and Owner.
- Back up production and obtain explicit deployment authorization.
- Deploy using the approved migration workflow, then verify all signatures, constraints, and behavior against application callers.
- Only after verification, enable dependent UI and dashboard queries.

## Sprint classification

Upgrade-only: release readiness, schema safety, and evidence quality. No V1 coverage gain is claimed.
