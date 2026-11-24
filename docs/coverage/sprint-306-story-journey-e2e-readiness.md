# Sprint 306 — Story → oferta oficial: readiness para E2E autenticado

Date: 2026-11-23
Base: `main` at `b928afd65bf554c61e3e6c090e3bdee741c06d40` (Sprint 305 merged)
Target criterion: **02.4 — Story journey E2E**
Classification: **upgrade-only / evidence readiness**. No V1 point is awarded by this document.

## Current implementation verified on main

- `RubiProductStories` loads only approved public Stories and offers an internal CTA to `#rubi-purchase`.
- `listRubiApprovedProductStories` requires an active product, positive retail price, verified official checkout, active supplier, approved Story, confirmed rights, linked movement and current approved movement revision.
- `getRubiCheckoutReadiness` returns a direct checkout destination only for the validated product path. Partner checkout remains closed until a verified supplier attribution URL exists; it does not silently fall back to a direct URL.
- Existing `rubi-story-offer-journey.test.mjs` checks source contracts and fail/recovery conditions. Existing browser E2E covers public storefront/feed and anonymous access boundaries, but does not execute a real Story-to-offer journey with persisted Story data.

## Integration baseline

Sprint 305 PR #305 has been merged into `main` at `b928afd65bf554c61e3e6c090e3bdee741c06d40`. Its isolated four-profile authenticated E2E passed 10/10 tests. This proves the shared local authentication harness, but does not replace the Story-to-offer journey evidence below.

## Evidence already available

- Static/source contract tests for Story → same-product precheckout.
- Approval, rights, supplier and movement-version gates in server code.
- Story approval and audit are routed through the atomic audited RPC.
- Browser test harness already supports mobile (390×844) and desktop (1366×768).

## Missing acceptance gates

| Gate | Required evidence | Status |
|---|---|---|
| G0 — implementation | Confirm current main path and product/story data contract | Passed by source review |
| G1 — behavior | Success, no Story, stale movement, missing rights, unavailable product/checkout, retry and failure cases | Partial: source tests exist; browser behavior incomplete |
| G2 — persistence/security | Disposable DB migrations, RLS/grants, owner approval, public read filters and negative authorization | Partial: isolated local Supabase bootstrap and full migration chain passed; Story-specific persisted fixtures and negative authorization assertions remain unproven |
| G3 — real journey | HTTPS staging browser journey with isolated consumer identity, real approved Story fixture, mobile and desktop | Partial: four authenticated profiles passed local mobile/desktop E2E; Story-to-offer with persisted approved Story remains unexecuted; staging origin/identities not confirmed |
| G4 — external proof | Official checkout redirect/round-trip and provider-confirmed attribution where applicable | Blocked on provider-owned test checkout; no purchase or commission may be inferred |
| G5 — evidence bundle | Run IDs, sanitized event/story/product references, screenshots and reviewer sign-off | Pending |

## Safety and integrity constraints

- Do not create or publish fake commercial Stories or fabricate product, checkout, payment or commission evidence.
- Use only an isolated staging project and explicitly disposable identities/data.
- Never point this test at production or a hosted customer database.
- Preserve rights confirmation, supplier approval, official checkout validation and current movement revision checks.
- Do not loosen RLS, grants or authorization to make a test pass.
- A click or `RUBI_STORY_OFFER_INTEREST` event is interest only, not a sale or settled payment.
- Do not substitute the Sprint 305 local four-profile E2E for this distinct Story-to-offer journey.

## Acceptance plan

1. Confirm an authorized HTTPS staging origin and isolated test identities.
2. Seed a disposable, owner-approved product + supplier + consumer-audience movement + rights-confirmed Story with a verified official checkout test destination.
3. Run the same Story-to-offer journey at 390×844 and 1366×768.
4. Assert Story content is visible only while all approval/version/rights/checkout gates hold.
5. Click the Story CTA and assert it lands on the same product's official precheckout section.
6. Assert the interest event is emitted as `interest_only`; do not treat it as an order or payment.
7. Verify negative cases: no rights, stale movement revision, inactive supplier/product, unverified checkout and unrelated product/movement.
8. Attach run IDs, screenshots, sanitized records and review the result before any scoring decision.

## Score decision

- Carried V1 baseline: **36.5/48 = 76.0%**.
- This readiness audit adds **0 points**.
- Criterion 02.4 remains a revalidation target; the historical Sprint 160 document proposed partial credit only after the applicable CI/merge/re-audit gates, while the current Sprint 301 register requires authenticated staging evidence for browser closure.
- No new-point-ready claim is made until the full required evidence bundle passes.

## Next dependency

The next executable step is to obtain/confirm the authorized staging URL and isolated staging test identity/data. Until then, work is limited to local disposable tests and source review; do not claim the staging gate passed.

## Sprint 306 CI evidence update

Validated on head commit `ae4881c5c6e0dbb8b7804616832cf26c4f535bb3`:

- `RUBI Local Authenticated E2E — Four Profiles`, run `45286495595`: **success**. Ten browser tests passed (consumer, merchant, partner and Master on mobile and desktop, plus non-owner Master access denial on both viewports). Isolated Supabase migrations and disposable identities succeeded; local Supabase was stopped/discarded.
- `Hub V1 integration QA`, run `45286495870`: **success**. Includes the dedicated Story-to-offer contract command: `npm run test:rubi-story-offer-journey`, with **10/10 passing**.
- `Sprint 33 QA`, run `45286495557`: **success**, including TypeScript, ESLint and production build.

These results strengthen CI confidence but do not prove a persisted Story-to-offer browser journey, staging checkout round-trip, provider attribution, or Story-specific runtime authorization. The score remains unchanged until those acceptance gates are satisfied.


## CI evidence update — 2026-11-24

Validated on Sprint 306 head commit `214f05fe8fdb8987e2567b1c9c24055cad3b950b`:

- `Hub V1 integration QA`, run `45301766933`: **success**. Dedicated `npm run test:rubi-story-offer-journey` passed **14/14** tests, including the public response minimization and product/movement binding assertions. Browser E2E configuration safety passed 3/3; TypeScript and ESLint passed.
- `Sprint 33 QA`, run `45301766782`: **success**, including route generation, TypeScript, ESLint and production build.
- `RUBI Local Authenticated E2E — Four Profiles`, run `45301766985`: **success**. The isolated local Supabase flow and all four authenticated profiles passed on mobile and desktop; disposable database was stopped/discarded.
- No failed steps were reported in the three completed workflow jobs.

This green CI confirms the corrected test suite and current code contracts. It does **not** close G2/G3/G4: the persisted Story fixture, Story-specific browser navigation on staging, and provider-owned checkout round-trip remain unexecuted. V1 remains **36.5/48 (76.0%)**; this update awards **0 additional points**.
