# Sprint 259 — Production schema drift and finance release blockers

Audit date: 2026-11-18  
Supabase project: `heartful-helper-box` (`akfvkjarpgocdsieuvvq`)  
Database: PostgreSQL 17.6  
Repository base: `main` after Sprint 258

## Executive finding

The production database migration history ends at `20261118001747` (`rubi_profile_privilege_hardening_sprint234`). The repository contains seven subsequent migrations through Sprint 253. Read-only catalog inspection confirms that several corresponding database objects are absent or still have their older definitions.

This is a release blocker for the affected flows. Merging application code does not deploy the matching SQL to Supabase.

## Verified runtime mismatches

| Area | Repository/application expectation | Production observation | Impact |
|---|---|---|---|
| Scheduled video launch (Sprint 243) | `automation.functions.ts` calls `rubi_process_due_video_launch_audited(uuid,uuid)` | Function absent | Worker RPC fails if this code path runs against this database |
| Editorial journey (Sprint 240) | Migration corrects canonical UUID regex | Existing `rubi_editorial_session_journey(integer)` still has an extra UUID group in its regex | Valid UUID section IDs do not match; journey metrics can be empty |
| Scheduled post worker (Sprint 246) | Audited claim/finish RPCs | Both functions absent | Worker cannot use the audited transition contract |
| Partner payout (Sprints 247/250) | Server sends `p_allocations` and `p_actor`; Owner authorization and partial allocations | Production only has legacy five-argument `uuid[]` RPC; payout item table still has `UNIQUE(sale_id)` | Current partial payout server call does not match the deployed function; one sale cannot be paid in installments |
| Finance core (Sprints 252/253) | `rubi_finance_*` tables and atomic allocation/reversal RPCs | No `rubi_finance_%` tables or allocation/reversal functions | Unified finance center is not live in this database |

The editorial function definition and payout RPC signature were read directly from `pg_proc`. Payout constraints were read from `pg_constraint`. Execute grants were checked in PostgreSQL. These are database observations, not assumptions based on migration filenames.

## Seven post-Sprint-234 migrations awaiting controlled deployment review

1. `20261118010100_rubi_video_launch_atomic_audit.sql`
2. `20261118020100_rubi_editorial_session_journey_uuid_fix.sql`
3. `20261118020200_rubi_scheduled_post_worker_atomic_audit.sql`
4. `20261118030000_rubi_partner_payout_atomic_audit.sql`
5. `20261118040000_rubi_partner_partial_payouts.sql`
6. `20261118050000_rubi_financial_domain_core_sprint252.sql`
7. `20261118060000_rubi_finance_atomic_operations_sprint253.sql`

They must be reviewed and applied in dependency order. In particular, payout audit/partial payout changes must be deployed before the new server call is treated as operational; the Sprint 253 finance operations depend on the Sprint 252 finance tables.

## Migration-history reconciliation warning

A naive exact comparison of every repository filename version with `schema_migrations.version` is not a safe deployment plan:

- Supabase reports 219 applied migration records.
- The current repository tree contains 217 migration SQL files.
- Only 30 version prefixes match exactly.
- 104 database migration names match a repository filename after normalizing the timestamp and punctuation.
- Eight repository version prefixes are duplicated across different SQL files.

Many historical files appear to have been renamed or re-timestamped after deployment. Therefore, the remaining exact-version/name mismatches must NOT be called 187 definitely unapplied migrations. Before any broad migration push, reconcile each historical migration by content, database objects, migration history and Git history. Do not run `migration repair`, mass-rename files, or blindly replay historical SQL.

## Release gates

1. Freeze broad schema rollout until the historical mapping is reconciled.
2. Build an explicit manifest for every pending migration: repository path, deployed version/name if any, object changes, prerequisites, and current catalog evidence.
3. Validate all seven post-Sprint-234 migrations in a clean disposable database using the exact migration order.
4. Verify RLS, grants, function owners, `SECURITY DEFINER` search paths, service-role restrictions, Owner actor checks, audit atomicity, and idempotency.
5. Back up production and use the approved migration deployment process. This audit did not modify production.
6. After deployment, verify each function signature and constraint against the application caller; run negative tests for anon, authenticated non-owner, partner, and Owner roles.
7. Only then enable the affected application flows and connect dashboard queries to the canonical finance tables.

## Reporting contract

- GitHub PR merged = source integrated.
- Migration file in repository = SQL prepared.
- Version in `schema_migrations` = migration recorded as applied.
- Catalog object/signature verified = database structure present.
- End-to-end test passed = behavior verified for that test path.

Do not report the finance dashboard, payout installments, audited video worker, or corrected editorial journey as production-ready before their corresponding database and runtime checks pass.

## Sprint classification

Upgrade-only: production/repository drift audit and release-safety controls. No V1 coverage point is claimed.
