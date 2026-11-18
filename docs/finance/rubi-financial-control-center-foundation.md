# RUBI Eagles — Financial Control Center
## Foundation architecture and implementation contract

Status: architecture specification. Sprint 252 and Sprint 253 migration files are present on main, but read-only verification on 2026-11-18 found them NOT applied to production Supabase. No provider integration is active.
Scope: owner-only consolidated finance, partner-scoped statements, external providers, manual reconciliation, imports, future APIs/webhooks.

## 1. Product principle

RUBI is a financial control, visibility and reconciliation layer. It is not the payment processor, bank, marketplace settlement service, accounting ledger of record, or authority to move funds. Money may be collected or paid outside the application. Every UI and report must distinguish:
- commercial event (order/sale/commission entitlement);
- expected cash (receivable/payable forecast);
- provider-confirmed event (webhook/API/import with provenance);
- externally settled cash (verified settlement or evidence);
- manually entered claim (explicitly labeled, pending/verified by an authorized operator).

Never infer that an order is paid because it exists, that a commission is payable because it is calculated, or that a manual checkbox means a transfer happened.

## 2. Existing system inventory (verified against Supabase project heartful-helper-box)

Existing tables:
- hub_partner_confirmed_sales: partner-attributed sales, gross_amount, commission_percent, commission_amount, source, provider_name, payment_evidence_reference, payment_verified_at.
- hub_partner_commission_payouts: partner payout batches with payment_reference, paid_amount, paid_at, note.
- hub_partner_commission_payout_items: allocations from payout batches to sales.
- hub_partner_agreements: active commission percentage and revision.
- hub_partner_referral_links / hub_partner_referral_visits: attribution and traffic.
- admin_audit_log: owner audit trail.

Existing audited sale reconciliation RPC is rubi_reconcile_partner_sale_audited. Existing partner payout schema is not a general multi-provider cash ledger. Do not overload it to represent store orders, marketplace settlements, supplier bills, gateway fees or operating expenses.

Current production gap (verified 2026-11-18): no general-purpose financial transaction/receivable/payable/reconciliation domain was found in the inspected public schema. The repo contains the proposed Sprint 252 core migration and Sprint 253 atomic allocation/reversal migration, but neither appears in production migration history. The production history currently ends at version 20261118001747 (rubi_profile_privilege_hardening_sprint234); queries for rubi_finance_% tables returned no rows. Existing partner finance remains a specialized production sub-ledger and must be integrated by references/adapters, not replaced abruptly. Therefore no Master/Partner dashboard may present Sprint 252/253 data as live until the migrations are safely deployed and verified.

## 3. Bounded domain model

Introduce a canonical financial domain in a later implementation migration, after detailed review and tests. Proposed entities:

### finance_providers
One row per configured source/integration (Kairos, marketplace, supplier portal, bank/export source). Fields: id, provider_key, display_name, provider_type, environment, connection_status, capabilities JSON, created_at, updated_at. Never store raw credentials here; secret material belongs in Supabase Vault or a dedicated server-side secret store. UI only receives masked metadata.

### finance_accounts
Logical settlement accounts or balances at a provider, owned by the RUBI legal/commercial entity or a partner payout channel where appropriate. Include provider_id, external_account_ref (non-secret), currency, label, active. Avoid bank account numbers or PIX keys in general event payloads.

### finance_documents
Normalized external artifacts: provider statement, payout report, invoice, refund report, chargeback report, manual evidence metadata. Store secure Storage object path, checksum, mime type, source, import batch, uploaded_by, and timestamps. Do not store public URLs or sensitive document content in audit JSON.

### finance_events
Append-only normalized event inbox for provider observations: provider_id, external_event_id, event_type, external_order_ref, external_transaction_ref, occurred_at, received_at, currency, amount, status, payload_hash, safe_metadata, processing_status, processed_at, error_code. Unique idempotency key on provider + external_event_id; if provider lacks event IDs, derive a stable key from documented immutable fields and payload hash. Raw payloads must be minimized, access-controlled and retained only as necessary. Never trust client-supplied provider status.

### finance_entries
Canonical append-only financial movements. Each entry has entry_type, direction, amount > 0, currency, effective_at, recorded_at, status, source_kind, source_id, provider_id nullable, external_reference nullable, related_order_id nullable, related_partner_profile_id nullable, related_document_id nullable, reversal_of_entry_id nullable, created_by nullable, verification_method, and metadata constrained to safe fields. Corrections use compensating entries, not destructive edits. Prevent self-reversal and duplicate reversal with constraints/idempotent RPC.

### finance_obligations
Expected receivables/payables with counterparty, source, due_at, expected amount, currency, status and links to originating order/sale/commission/supplier document. Expected is not cash received. Partial settlement is represented by multiple allocations.

### finance_allocations
Join between entries and obligations/documents/orders/partner commissions. Supports partial allocations and many-to-many reconciliation without mutating source amounts. Enforce allocation currency consistency and prevent total allocated amount exceeding eligible balance under row locks.

### finance_import_batches
Import provenance, provider, file/document, checksum, initiated_by, counts (total/accepted/rejected/duplicate), status, and completion timestamps. Preview/validate before commit. Re-import must be idempotent.

### finance_reconciliation_matches
Explicit match between internal expectation and external event/entry, with match method (automatic/manual), confidence, matched_by, timestamps, and reversal history. Do not auto-match solely on amount; use provider + external reference/order + currency + date tolerance and require review for ambiguous candidates.

## 4. Status model (separate dimensions)

Do not use one overloaded status column for every concept. Keep separate:
- provider_event_status: observed, pending, authorized, captured, settled, failed, refunded, partially_refunded, disputed, chargeback, reversed, unknown;
- internal_processing_status: received, validated, duplicate, rejected, needs_review, processed, failed;
- obligation_status: forecast, open, partially_settled, settled, overdue, cancelled, disputed;
- reconciliation_status: unmatched, suggested, matched, discrepancy, ignored_with_reason;
- evidence_status: missing, attached, reviewed, rejected.

Provider adapters map documented provider-specific statuses into canonical statuses and retain original provider status for traceability.

## 5. Financial calculations and reporting

All amounts use numeric/decimal arithmetic (never JS floating-point as source of truth), explicit currency and rounding rules. Store source amount and currency. Convert to BRL only for consolidated views, with FX rate, rate source and rate timestamp recorded; never silently combine currencies.

Core metrics:
- Gross merchandise/order value: commercial order value, not cash received.
- Provider-confirmed amount: amount reported by provider, not necessarily settled.
- Settled cash: only externally settled/verified entries.
- Receivables: open expected inflows, separately from cash.
- Fees: provider/platform charges, separately categorized.
- Supplier/product/logistics/marketing costs: expenses with evidence and allocation basis.
- Partner commission: contractual entitlement, with agreement revision and eligible base snapshot.
- Partner payout: external transfer allocation, not an instruction to initiate transfer.
- Contribution margin estimate: recognized revenue less attributable fees/costs/commission; label as estimate and do not claim statutory net profit without accounting/tax integration.

Partner commission base must be defined per agreement/product/channel (gross, discounted gross, or eligible net); persist the applied rule, agreement revision, base amount, rate and computed amount on the sale. Later agreement edits must not rewrite historical commissions.

## 6. External provider adapters

Each provider adapter must declare supported capabilities: order lookup, payment events, settlement reports, refunds, chargebacks, fee details, payout statements, signatures, pagination, currencies and idempotency guarantees.

No Kairos endpoint, webhook signature, status or settlement timing may be invented. Until official documentation and credentials exist, Kairos remains a provider configured as manual/import-only or disconnected, with an explicit UI status. The same rule applies to marketplaces and suppliers.

Webhook requirements: verify signature on raw request body, timestamp/replay window where supported, provider-specific secret, event idempotency, schema validation, safe logging, retry strategy, dead-letter visibility and audit. Never accept a browser request as proof of provider payment.

## 7. Reconciliation workflow

1. Ingest event/report/manual evidence into a staging inbox.
2. Validate provider, schema, currency, amount, timestamps, identifiers and authenticity/provenance.
3. Detect duplicate events/imports idempotently.
4. Propose matches using exact external references first; show ambiguous matches for Owner review.
5. On approval, create immutable entries and allocations transactionally.
6. Update obligation balances through derived sums, not manually overwritten totals.
7. Emit owner audit event in the same transaction for sensitive manual adjustments.
8. Expose partner-only statement projections from eligible rows, never global ledger access.

Manual records must show "Registrado manualmente" and identify actor/time/evidence. They must not be labeled "Webhook confirmado" or "Integração automática".

## 8. Security and access

- Shadow Master remains restricted to the existing Owner identity/authorization mechanism.
- Partner reads are scoped by authenticated user -> approved commercial_profile -> own referral links/sales/commission/payout records.
- No client insert/update/delete on canonical ledger, provider events, reconciliation matches or payout allocations.
- Sensitive mutations go through server functions and security-invoker/definer RPCs with explicit authorization, fixed search_path, least privilege, row locks and atomic audit.
- Provider secrets never enter client bundles, ordinary tables, logs, audit JSON or exports.
- Export endpoints enforce the same scope and avoid exposing other partners or provider credentials.
- Add RLS tests for Owner, approved partner A, partner B, merchant, consumer, anonymous and revoked partner.

## 9. Dashboard UX contract

### Shadow Master
Top-level cards: gross sales, provider-confirmed inflows, settled cash, receivables, overdue receivables, expenses, fees, partner commissions payable, external partner payouts, estimated contribution margin. Every card has a definition tooltip and drill-down.
Filters: date range, channel, provider, product, supplier, partner, currency, status and verification source.
Views: cash flow timeline, channel comparison, provider settlement aging, expense categories, commission/payout reconciliation, discrepancies, import center and audit history.
Show "data last updated", source coverage and unconnected providers. Empty/partial data must be explicit; never display synthetic totals.

### Partner
Own attributed orders, commission base/rate/agreement revision, commission status, available/held/paid amounts, partial payout allocations, adjustments and evidence references. Never expose global revenue, costs, other partners, or Owner-only notes.

### Merchant/supplier
Only their own purchase orders, invoices, due dates, payments and reconciliation evidence where the commercial relationship permits it. No partner commissions or global Master data.

UX requirements: responsive desktop/mobile, accessible contrast, loading/empty/error/partial-data states, chart date filters, CSV export, pagination, currency formatting in pt-BR, timezone-aware dates, clear labels for estimate vs confirmed vs settled.

## 10. Delivery sequence and acceptance gates

F1 — domain inventory + data contracts (this document).
F2 — schema and secure RPCs for providers, obligations, events, entries, allocations, import batches, reconciliation.
F3 — import staging and CSV validation with preview, duplicate detection and error report.
F4 — partner commission/payout adapter that reads existing specialized tables and projects into the unified model without double-counting historical data.
F5 — Shadow Master dashboard and drill-downs.
F6 — partner and merchant scoped dashboards.
F7 — provider-specific API/webhook adapters, only after official docs and credentials.
F8 — refunds, chargebacks, compensating entries, reconciliation automation and operational monitoring.

Acceptance: no production migration before review; no invented provider integration; tests for idempotency, partial allocations, over-allocation, duplicate imports, reversal, concurrency, RLS isolation, audit atomicity, currencies, and no double-counting. TypeScript, lint, build and both repository QA workflows must pass before merge. Supabase migration application is a separate deployment gate with explicit verification.

## 11. Non-goals / safeguards

- This system does not itself execute PIX/TED/card/bank transfers.
- It does not claim statutory accounting or tax compliance.
- It does not infer net profit from gross sales.
- It does not treat click/pre-checkout/visit as a sale.
- It does not automatically pay a partner because a balance is positive.
- It does not overwrite historical agreement terms or financial entries.
- It does not assume every provider exposes real-time webhooks or settlement data.

## Commerce journey observability — Sprint 256

The detailed contract is maintained in `docs/commerce/rubi-commerce-journey-observability.md`.

Verified boundary: `analytics_events` captures behavioral observations; current `RubiPreCheckout` records an external checkout intent and redirects to an approved destination. It does not prove an order or payment. The inspected schema did not contain a persistent first-party cart or canonical universal order table.

Target integration: add a persistent cart, immutable item/price snapshots, canonical RUBI orders and idempotent order events. Track outbound marketplace/supplier redirects, but mark external outcomes unknown until supported by a reliable report, external reference with verifiable evidence, authorized manual review, or a documented official integration. Keep behavior events, commercial orders, payment evidence and settled financial entries separate. The algorithm may estimate intent and demand, but cannot promote intent into a confirmed sale or cash receipt.


## 11. Production migration readiness — Sprint 258 audit

Read-only checks against project `heartful-helper-box` (`akfvkjarpgocdsieuvvq`) on 2026-11-18 establish:

- Project is `ACTIVE_HEALTHY`, PostgreSQL 17.6.
- Production migration history currently ends at `20261118001747` (`rubi_profile_privilege_hardening_sprint234`).
- No production table matching `rubi_finance_%` exists.
- The repository already contains:
  - `20261118050000_rubi_financial_domain_core_sprint252.sql`
  - `20261118060000_rubi_finance_atomic_operations_sprint253.sql`
- Therefore the financial domain and its atomic allocation/reversal RPCs are committed to the repository but are not yet deployed to production. This is a deployment gap, not a claim that the migrations failed.

### Deployment gates — do not skip

1. Reconcile every pending migration after `20261118001747` in strict timestamp order; do not apply Sprint 252/253 in isolation if earlier migrations are pending.
2. Verify the exact repository migration list against Supabase production migration history and schema drift. The database has other later Sprint 235–251 migration files that must be included in the same review.
3. Run the repository's migration-version uniqueness and finance schema/operations tests on the exact merge commit.
4. Review every migration for prerequisites, security-definer RPC authorization, RLS, grants, audit atomicity, idempotency and rollback/forward-repair strategy.
5. Confirm the Supabase backup/restore posture and deploy only through the approved migration workflow. This audit did not apply any production migration.
6. After deployment, verify table existence, RLS flags, policies, grants, RPC execute privileges, and run negative tests for anon, ordinary authenticated users, partner users, and the Owner.
7. Only then wire dashboard queries to the canonical tables. Until then, dashboards must continue to use the existing production sub-ledgers and label unsupported metrics as unavailable rather than zero or paid.

### Sprint 253 implementation review note

The Sprint 253 migration adds an atomic allocation RPC that locks the financial entry and obligation, checks currency/direction and prevents over-allocation on both sides. Its reversal operation is explicitly ledger-only and does not claim to reverse external provider funds. These guarantees are present in repository SQL/tests; they are not live production guarantees until the migration is applied and verified.

### Operational distinction

- GitHub merged: source code is integrated.
- Supabase migration present in repository: schema change is prepared.
- Supabase migration recorded in `schema_migrations`: schema change was applied.
- Runtime verified: access controls and behavior have been tested against the deployed database.

These states must never be conflated in sprint reports.

## Sprint 259 — production schema drift

The live database audit and exact release blockers are documented in [Sprint 259 production schema drift audit](./sprint-259-production-schema-drift-audit.md). The repository contains seven migrations after the production history head, and current runtime RPC signatures do not fully match production. No finance or partner payout flow should be marked live until the migration-history reconciliation and controlled deployment gates in that audit are complete.
