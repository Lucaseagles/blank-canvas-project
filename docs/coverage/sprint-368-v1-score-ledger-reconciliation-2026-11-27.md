# Sprint 368 — V1 score ledger reconciliation (27 Nov 2026)

**Canonical operational score:** **39.0/48 = 81.25% (81.3%)**.  
**Remaining arithmetic gap:** 9.0/48 = 18.75%.  
**Next conversion candidate:** criterion 02.4, currently 0.5/1.0; +0.5 would produce 39.5/48 = 82.2917% (82.3%), but only after the hosted and provider acceptance gates below.

This addendum supersedes the *aggregate score reference* in the older Sprint 333 note. It does not claim that all 48 current row values have been independently reconciled. The 48-row Sprint 122 matrix remains a historical snapshot, not the current distribution.

## 1. Score authority and accepted deltas

| Event | Previous score | Accepted change | New score | Evidence / decision |
|---|---:|---:|---:|---|
| Sprint 122 historical reassessment | 31.0/48 | +0.5 (07.3) | 31.5/48 = 65.6% | `docs/rubi-coverage-v1-reassessment.md`; historical snapshot only |
| Sprint 135 — creative library partial | 31.5/48 | +0.5 (07.4: 0 → 0.5) | 32.0/48 = 66.7% | `docs/rubi-coverage-v1-sprint135-addendum.md`; PR #135 acceptance |
| Sprints 136–206 historical progression | 32.0/48 | +4.0 aggregate, row allocation not fully recoverable from current ledger | 36.0/48 = 75.0% | Reported as Sprint 207 starting baseline; do not invent criterion attribution |
| Sprint 207 — licensing implementation | 36.0/48 | +0.5 (07.4: 0.5 → 1.0) | 36.5/48 = 76.0% | `docs/rubi-coverage-v1-sprint207-license-review.md`; technical scope only |
| Sprint 329 — four-profile E2E | 36.5/48 | +1.0 (12.3: 0 → 1.0) | 37.5/48 = 78.1% | `docs/coverage/criterion-12-3-four-profile-e2e-closure-2026-11-26.md`; PR #329 |
| Sprint 359 — Story partial E2E | 37.5/48 | +0.5 (02.4: 0 → 0.5) | 38.0/48 = 79.2% | PR #359 and its accepted local Story → same product → internal pre-checkout evidence |
| Sprint 362 — administrative audit | 38.0/48 | +0.5 (11.3: 0.5 → 1.0) | 38.5/48 = 80.2% | PR #382 release + PR #383 accepted closure record |
| Sprint 363 — controlled A/B contract | 38.5/48 | +0.5 (08.3: 0.5 → 1.0) | **39.0/48 = 81.3%** | PR #390 release decision; #391 CI contract integration and same-HEAD release gates |

### Accepted current criterion values directly evidenced by later closure records

| Criterion | Current accepted value | Evidence boundary |
|---|---:|---|
| 02.4 — Story journey | **0.5/1.0** | Local authenticated Story → matching product → internal pre-checkout. Hosted HTTPS staging and official provider round-trip remain open |
| 07.4 — reusable/licensed creative library | **1.0/1.0** | Sprint 207 technical licensing, review/revocation and partner-access implementation. Does not certify that real commercial licenses or real assets have been supplied |
| 08.3 — creative/page A/B experiment | **1.0/1.0** | Sprint 363 technical controlled-experiment contract and CI/RLS validation. Does not claim real traffic or proven uplift |
| 11.3 — administrative audit | **1.0/1.0** | Sprint 362 release and accepted closure record. Later hardening PRs #394–#398 are upgrades/regressions, not additional points |
| 12.3 — four-profile E2E | **1.0/1.0** | Sprint 329 authenticated Consumer, Merchant, Partner and disposable Master on mobile/desktop |

All other current row values remain **unreconciled in this addendum** unless a separate accepted closure record is linked. Do not infer the current module distribution by copying the Sprint 122 table.

## 2. Explicit no-point releases

The following merged work is valuable but did not change the 39/48 aggregate:

- PRs #392–#393: guarded staging workflow and setup documentation for 02.4.
- PRs #394–#398: administrative audit inventory and SECURITY DEFINER/RLS hardening after the 11.3 closure.
- PR #399: stronger Story staging fixture validation and actual Playwright mobile emulation.
- PR #400: platform-specific publication permalink validation; 03.3 remains partial until official channel authorization and provider-confirmed publishing evidence exist.

Code integration, green CI, or a stronger safety boundary is not automatically a V1 point.

## 3. Exact next gate — criterion 02.4

Current value: **0.5/1.0**. Candidate gain: **+0.5 point**, producing **39.5/48 = 82.3%**.

Required external setup in GitHub Environment `rubi-staging`:
- isolated, disposable HTTPS application target;
- exact matching allowed origin;
- five distinct disposable product fixtures and all required Story fixture titles;
- dedicated least-privilege Master and Consumer QA identities;
- explicit authorization secret for fixture mutation.

Then manually run **RUBI Story → Offer — Authorized Staging E2E** and inspect the sanitized artifact. The current workflow proves the hosted Story → same product → official pre-checkout journey. The rubric's provider round-trip requirement must also be proven using a provider-approved sandbox/test integration or an explicitly authorized staging contract. Do not claim a completed purchase or sale unless a signed provider event and reconciled order are actually observed.

The workflow currently does not perform a purchase or prove payment-provider settlement. Therefore a successful staging run alone is not sufficient if the rubric requires provider round-trip. Keep 02.4 at 0.5 until every rubric gate is evidenced and formally accepted.

## 4. Historical integrity and unresolved work

- The Sprint 333 note's 37.5/48 aggregate is superseded by later accepted closures in PRs #359, #383 and #390.
- The Sprint 301/333 notes remain useful as historical evidence but must not override the later release decisions.
- The aggregate progression from 32.0 to 36.0 across Sprints 136–206 is documented as +4.0, but its criterion-by-criterion allocation is not recoverable from the current score artifacts. Keep that portion explicitly unallocated until a historical PR-to-row audit proves it.
- The current 39.0 aggregate is supported by successive accepted score decisions; the full 48-row current distribution is still not certified.
- Do not revise the denominator: V1 remains 48. Expanded product requirements belong in a separately versioned V2 matrix.

## 5. Method of acceptance

Every future Sprint must record:
1. criterion ID and accepted starting value;
2. exact missing gate and whether it is code-controlled or external;
3. PRs and commits contributing evidence;
4. exact same-HEAD CI/E2E/database results;
5. sanitized evidence artifact or provider reference;
6. accepted delta (0, +0.5 or +1.0) and new aggregate;
7. any unallocated historical discrepancy.

A PR may be merged as an upgrade without score movement. Only a criterion closure accepted against the rubric changes the numerator.

**Decision:** carry **39.0/48 = 81.3%** as the operational V1 aggregate; keep 02.4 at **0.5/1.0** and target the remaining +0.5 only after hosted staging and provider evidence. No points are awarded by this documentation change.
