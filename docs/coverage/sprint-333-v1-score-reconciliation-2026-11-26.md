# Sprint 333 — V1 score reconciliation and 100% execution roadmap

**Date:** 2026-11-26  
**V1 denominator:** 48 criteria, each scored 0 / 0.5 / 1.0  
**Confirmed carried score:** **37.5 / 48 = 78.125% (78.1%)**  
**Remaining:** **10.5 / 48 = 21.875% (21.9%)**

## Score decision

The formal Sprint 301 evidence-gap register still carries the older 36.5/48 (76.0%) baseline. The Sprint 329 closure document records the additional +1.0 point for criterion 12.3, with successful four-profile mobile/desktop E2E and associated QA evidence. Therefore the latest documented V1 score is 37.5/48 (78.1%), not 36.5/48.

This addendum does not reconstruct or invent the other 47 current criterion values. The detailed 48-row assessment in `docs/rubi-coverage-v1-reassessment.md` is a Sprint 122 historical snapshot; later reviews changed the aggregate without maintaining a fully reconciled row-by-row ledger. A criterion-by-criterion reconciliation against all merged work after Sprint 207 remains required before publishing a definitive distribution by module.

## Verified score movement

| Event | Score | Change | Decision |
|---|---:|---:|---|
| Sprint 301 / formal carried baseline | 36.5/48 = 76.0% | — | Historical formal baseline |
| Sprint 329 — criterion 12.3 | 37.5/48 = 78.1% | +1.0 point / +2.1 pp | Accepted from the documented four-profile E2E evidence |
| Sprint 333 — individual Academy progress | 37.5/48 = 78.1% | +0.0 | Product/security upgrade; no V1 point claimed |

The Sprint 333 PR #333 is merged into `main` at `9c36f2dff7ac7cc2cd6e9acf57412e4aea75a174`. Its three required workflows passed before merge: Sprint 33 QA, Hub V1 Integration QA and authenticated E2E across the four profiles. The disposable local Supabase E2E workflow applies migrations and runs the added Academy progress isolation smoke. The migration is part of the merged repository; this is not a statement that it has been deployed to the production Supabase project.

## What remains for V1

The following are remaining evidence targets inherited from the historical matrix and Sprint 301 gap register. They are not a claim that all these items currently have score zero; their exact current partial/full values must be confirmed in the row-by-row reconciliation.

| Priority | Criterion | Remaining proof required | Dependency |
|---|---|---|---|
| P1 | 02.4 — Story journey E2E | Authenticated Story-to-product journey, persisted evidence, mobile and desktop | Isolated test identities and browser E2E |
| P1 | 11.3 — Complete administrative audit | Inventory every sensitive mutation, eliminate bypasses, prove actor/owner enforcement, atomic audit, rollback and concurrency | Disposable PostgreSQL |
| P1 | 08.2 / 08.3 / 08.4 — movement validation, experiment and performance | Validated audience/angle, controlled comparable A/B design, trustworthy denominators and performance by audience/movement | Real or explicitly labelled test traffic; analytics validation |
| P1 | 03.4 / 06.4 — external commission and purchase reconciliation | Provider-confirmed external sale, referral attribution, idempotent commission calculation and reconciliation | Affiliate/provider integration and evidence |
| P2 | 04.4 — external checkout prepared and reconciled | Verified checkout host, redirect round-trip, provider event/webhook, retries and reconciliation | Kairos/provider access |
| P2 | 05.4 — paid B2B order and audited freight | Server-validated quote, paid order, freight snapshot, lifecycle transitions and audit trail | Payment/shipping provider sandbox |
| P2 | 09.3 / 09.4 — bump and post-purchase upsell | Provider-confirmed base + bump charge, separate upsell charge, linkage and refund handling | Kairos checkout capability |
| P2 | 10.4 / 01.4 — paid purchase, LTV and repeat cohorts | Settled events, refunds/reversals handled, customer-level cohort definitions and reproducible denominators | Real paid events |
| P2 | 12.4 — real order, payout and refund | Confirmed payment, attributed partner ledger, payout, refund/reversal and reconciliation | Provider sandbox or authorized real operation |
| Governance | 11.4 — multiple Masters | Reassess whether this is still a valid requirement. Current approved product scope is one private Shadow Master; preserve it and formally version the rubric if multiple Masters are no longer required | Product scope governance |

## Execution sequence toward 100%

1. **Reconcile all 48 rows.** Compare the historical matrix with every relevant merged PR and current `main`, including #313 and #327–#333. Publish each criterion's current score, evidence link, missing acceptance gate, owner and dependency. Do not allocate aggregate points to individual rows without proof.
2. **Close code-controlled gaps first.** Prioritize 02.4 and the remaining verifiable parts of 11.3, then identify the smallest real acceptance gap in 08.2–08.4. Run browser and disposable-Postgres tests rather than relying only on source-pattern tests.
3. **Complete partner commercial attribution.** Ensure partner goals and commissions are driven only by verified eligible sales. Keep clicks, visits, pending orders and provider-confirmed paid events distinct.
4. **Run provider-dependent commerce journeys.** Confirm Kairos and affiliate-network capabilities before implementing or claiming 03.4, 04.4, 06.4, 09.3, 09.4, 10.4 and 12.4.
5. **Complete B2B lifecycle and paid cohorts.** Use sandbox/authorized events and reconciliation artifacts; never fabricate sales, payouts, refunds or LTV.
6. **Resolve stale scope requirements.** Keep the sole Shadow Master private. Do not create extra Masters solely to satisfy an outdated criterion; revise and version the rubric with an explicit scope decision.
7. **Maintain premium UX and stability throughout.** Every onboarding, consumer/merchant/partner portal, affiliate workflow, Academy, catalog and Master surface must retain responsive premium design, accessible controls, reduced-motion support, clear loading/empty/error states and performance safeguards. These are release gates and upgrades; they add V1 points only when a defined matrix criterion's full acceptance contract is met.

## Operating rule for every sprint

Every sprint must state: exact criterion ID (or “upgrade-only”), current verified score, potential gain, existing main-branch evidence, one concrete missing gate, smallest implementation, test plan, external dependencies and sanitized proof artifact. Only award +0.5/+1.0 after all required gates pass. Keep the V1 denominator at 48 for historical comparability; track expanded V2 scope in a separate matrix and denominator.

**Current reference for planning: 37.5/48 (78.1%), with 10.5 points (21.9%) remaining.** The 48-row distribution is still under reconciliation; this aggregate is not permission to guess module-level percentages.
