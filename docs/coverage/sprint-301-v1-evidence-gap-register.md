# Sprint 301 — V1 evidence gap register and point-conversion plan

Date: 2026-11-20
Baseline carried forward: **36.5 / 48 = 76.0%** (Sprint 265 and Sprint 266 records).
Remaining: **11.5 points**.
Classification: **upgrade / audit governance**. This document does not award coverage points.

## Executive finding

The project has repeatedly improved code quality, CI, audit boundaries and architecture without moving the V1 score because those changes have mostly strengthened already-partial or already-scored capabilities. A passing unit/static regression is not equivalent to the operational evidence demanded by several V1 criteria.

The current repository does not contain a single reconciled per-criterion scorecard at 36.5/48. The older `docs/rubi-coverage-v1-reassessment.md` is explicitly a 31.5/48 historical snapshot; the Sprint 135 addendum moves it to 32/48; the Sprint 207 review and Sprint 265/266 baselines establish 36.5/48. Those documents do not provide a complete, consistent 48-row redistribution at 36.5. Therefore this register intentionally does **not** invent current scores for individual rows.

## Why the score stayed flat

1. Work was selected by subsystem/technical defect, not by the exact remaining half-point or full-point acceptance test.
2. Many PRs added static tests that inspect source code, but did not exercise the database transaction, authenticated browser journey, external provider, or settled financial event required by the criterion.
3. Operational dependencies were not separated from code tasks. Kairos/provider access, a safe staging environment, real product/SKU data, and authorized payment/refund evidence cannot be manufactured by writing more code.
4. The same shared primitives (audit RPC, CI workflows, server guards) were repeatedly improved. This is useful hardening, but once a criterion's implementation is already scored, further improvements do not add another point.
5. The 48-criterion scorecard was not maintained as a live acceptance ledger after the older 31.5/48 table.

## Evidence index (not a new score)

| Evidence source | What it establishes | What it does not establish |
|---|---|---|
| `docs/rubi-coverage-v1-reassessment.md` | Historical 48-row names and a 31.5/48 assessment | Current 36.5/48 distribution |
| `docs/rubi-coverage-v1-sprint135-addendum.md` | 07.4 historical progression to 32/48 and explicit limits | Current row-by-row scores |
| `docs/rubi-coverage-v1-sprint207-license-review.md` | 07.4 progression and formal 36.5/48 baseline | Real licensed assets/operational use |
| `docs/security/sprint-265-checkout-and-commerce-access-baseline.md` | 36.5/48 baseline; production access boundaries; no payment proof | Paid order, payout or refund |
| `docs/commerce/sprint-266-cart-order-foundation.md` | Cart/order safety design; no paid/settled implication | Operational order lifecycle |
| Browser E2E evidence script | Guest/public guards and explicit authenticated-profile gaps | Four authenticated profiles or Kairos checkout |
| PR #298 (open at audit time) | Social Proof legacy write path fix; both CI workflows passed on head `c8b1ed2` | Migration tested against disposable DB or merged |

## Candidate gap portfolio inherited from the last detailed 48-row table

The following IDs appeared as zero or partial in the historical detailed matrix. They are **revalidation targets**, not a claim that each current score is unchanged. Their current values must be reconciled against all post-Sprint-122/135/207 PRs before a point is assigned.

| ID | Historical criterion | Evidence required to close | Likely dependency |
|---|---|---|---|
| 01.4 | Paid cohorts and repeat purchase | Cohort definition, verified paid/settled events, repeat-purchase query and reproducible cohort report | Real paid events |
| 02.4 | Story journey E2E | Authenticated end-to-end Story/product journey, desktop and mobile, persisted event evidence | Staging + test accounts |
| 03.4 | External commissions reconciled | Provider-originated confirmed sale, attribution chain, commission calculation, reconciliation and idempotency proof | Affiliate/provider evidence |
| 04.4 | External checkout prepared and reconciled (historically partial) | Confirmed provider ownership/host, redirect round-trip, provider event/webhook, reconciliation and failure/idempotency cases | Kairos/provider access |
| 05.4 | Paid B2B order and audited freight | Approved merchant, server-validated quote, paid order, freight snapshot, status transitions and audit trail | Staging/provider payment |
| 06.4 | External purchase attributed and reconciled | Partner referral -> external purchase confirmation -> commission ledger -> reconciliation; click alone is insufficient | Affiliate network/provider |
| 09.3 | Order bump charged at Kairos checkout | Checkout request with bump, provider confirmation of both base item and bump, amount reconciliation | Kairos integration |
| 09.4 | Post-purchase upsell confirmed | Paid base order, separate upsell offer/acceptance, second confirmed charge, correct linkage/refund handling | Kairos integration |
| 10.4 | Real paid purchase and LTV | Settled purchase events, refunds excluded/reversed correctly, customer-level cohort LTV with reproducible denominator | Paid events + analytics |
| 11.3 | Complete administrative audit (historically partial) | Exhaustive inventory of sensitive mutations, no bypass paths, owner/actor enforcement, atomic audit, DB rollback/concurrency tests | Disposable DB |
| 11.4 | Multiple masters without hardcode | Only if product scope still requires multiple masters; otherwise preserve the explicitly approved single private Shadow Master and formally revise the criterion's scope | Product-scope decision |
| 12.3 | Four-role desktop/mobile E2E | Isolated authenticated Consumer, approved Merchant, approved Partner and sole Shadow Master journeys; positive and negative authorization assertions | Staging + isolated identities |
| 12.4 | Real order, payout and refund | Order lifecycle with confirmed payment, partner attribution, ledger/payout, refund/reversal and reconciliation evidence | Provider sandbox/authorized real operation |

## Point conversion model

The score remains fixed at 36.5/48 until evidence meets the criterion's acceptance contract.

For every target criterion, track these gates individually:

- **G0 — Existing implementation:** locate the production code path and current main-branch commit.
- **G1 — Behavior tests:** test success, invalid input, failure, retry/idempotency and authorization boundaries.
- **G2 — Persistence/security:** where applicable, execute migrations and transaction tests in a disposable database; verify RLS/grants, rollback and concurrency.
- **G3 — Real journey:** execute the browser/API journey in staging using isolated identities and desktop/mobile coverage where required.
- **G4 — External/financial proof:** where applicable, use provider sandbox callbacks or authorized real settlement/refund evidence. Never substitute a click, precheckout, simulated event or internal order row for a paid transaction.
- **G5 — Evidence bundle:** attach run IDs, test output, sanitized event/order references, screenshots or reconciliation artifacts, plus reviewer conclusion.

A criterion receives 1.0 only when all of its required gates pass. It remains 0.5 when only the partial scope defined by the rubric is proven. No point is inferred from PR count, file count or CI green alone.

## Evidence Functional Index (EFI / IEF)

Do not publish a guessed global percentage. Track two distinct denominators:

1. **V1 score:** 36.5/48 = 76.0%, the formally carried baseline.
2. **Remaining-gap evidence readiness:** points among the 11.5 remaining for which the complete required evidence bundle has already passed review.

At this audit, no newly completed bundle was identified as ready to add to the remaining 11.5. Thus the *new-point-ready portion of the remaining gap* is **0/11.5 = 0%**. This is not a claim that the whole product has 0% functional evidence, nor does it invalidate the 36.5 already scored.

The next audit must assign a row-level evidence state to all 48 criteria and compute the weighted IEF from actual evidence, rather than extrapolating from CI status.

## Execution order: maximize point gain per unit effort

### Wave A — code-closeable, no external provider required
1. Reconcile the full 48-row rubric against every post-207 merged PR and current `main`.
2. Finish 11.3 only if the exhaustive mutation inventory finds remaining bypasses; validate the Social Proof and Smart Collections migrations in a disposable DB. Do not count PR #298 until merged and DB gates pass.
3. Build authenticated E2E harness readiness for 12.3 using isolated staging identities. If staging is unavailable, produce a blocked readiness report without pretending E2E ran.
4. Re-check 02.4 and other browser criteria for existing test journeys before adding new tests.

### Wave B — measurable product/analytics evidence
5. Reconcile 08.2, 08.3, 08.4 and 10.3 against current implementations and existing tests. Close only a specific missing behavior such as controlled allocation, sample-size/denominator integrity, experiment isolation or cohort correctness.
6. Use real, non-synthetic event streams in staging; clearly label synthetic fixtures as test data.

### Wave C — external commercial lifecycle
7. Confirm provider API/webhook capability and test environment for Kairos and affiliate networks.
8. Execute 04.4, 06.4, 09.3 and 09.4 through provider-confirmed events.
9. Execute 05.4 and 12.4 with a complete paid order, payout and refund/reversal lifecycle.
10. Close 01.4 and 10.4 using settled transaction history and reproducible cohorts/LTV.

### Scope governance
11. Review 11.4 against the approved architecture: the Shadow Master is intentionally private and single-account today. Do not add more masters merely to satisfy a stale criterion; if the criterion is no longer a product requirement, formally version the rubric rather than weakening security.

## Sprint acceptance rule

Every new sprint must state before implementation:
- exact criterion ID(s) and current confirmed score;
- potential gain (+0.5/+1.0), or explicitly “upgrade only”;
- evidence already present on main;
- one concrete missing gate;
- smallest change and acceptance tests;
- environmental/external dependencies;
- proof artifacts expected;
- score change only after all gates pass.

If a sprint cannot identify a plausible point conversion, it must be explicitly classified as upgrade-only and should not displace a higher-value eligible gap.

## Current operational status

- Baseline: 36.5/48 (76.0%); 11.5 points remain.
- PR #298: open, mergeable; Hub V1 Integration QA and Sprint 33 QA both green on head `c8b1ed2`; migration not yet validated in a disposable database and not applied to production.
- PR #300: merged; its TypeScript/test corrections do not independently add a V1 point.
- No production migration or production write is authorized by this audit.

## Next action

The next implementation sprint should select the first code-closeable criterion only after the 48-row reconciliation is complete. Prioritize the highest point gain with available evidence and no external dependency; keep provider-dependent commercial criteria in a separate execution queue so they do not block independent progress.
