# Sprint 366 — staging Story fixture contract and mobile E2E fidelity

**Base:** `main` at `2ec452fcd260875f0f8dfaf850b070fb4032a696` (after Sprint 365 closure).  
**Target:** criterion 02.4 — Story → same product → official pre-checkout.  
**Classification:** upgrade / coverage enabler; **+0 matrix points** until hosted staging and provider round-trip acceptance are completed.

## Why this change is needed

The manual staging workflow already requires an isolated HTTPS origin, explicit human confirmation, a mutation authorization secret, separate Master/consumer QA identities and dedicated fixtures. The target resolver previously checked presence but did not validate product ID shape, uniqueness across the five product fixtures, or email syntax. A malformed or duplicated fixture could therefore pass preflight and fail later in the browser journey or contaminate a negative gate.

The existing local E2E suite also used mobile-sized viewports without enabling Playwright's mobile emulation flags. A 390×844 desktop context is not equivalent to a touch/mobile browser context.

## Changes

1. Validate the five product fixture identifiers as canonical UUIDs before starting Playwright.
2. Require distinct UUIDs across the five Story gate product fixtures to avoid fixture cross-contamination.
3. Validate Master and consumer QA email syntax before attempting browser authentication.
4. Add negative contract tests for malformed UUID, duplicate product UUID and malformed email.
5. Apply Playwright mobile emulation for mobile scenarios: `isMobile: true`, `hasTouch: true`, and device scale factor 2. Desktop remains a 1366×768 non-mobile context.
6. Apply the same device configuration to the separately created Master and consumer browser contexts in the approved Story journey.

## Safety and scope

- Does not create or mutate GitHub Environment secrets/variables.
- Does not point to production or change the configured staging origin.
- Does not contact social platforms or a checkout provider.
- Does not claim an external post, completed payment, order, commission or sale.
- Does not modify remote Supabase.
- Uses synthetic UUIDs only in unit tests; they are not actual database fixture IDs.

## Acceptance gates

- Node contract tests for accepted/rejected staging target values.
- Sprint 33 QA.
- Hub V1 Integration QA.
- Authenticated four-profile E2E.
- Any additional workflow checks required by branch protection.
- All required workflows must pass on the exact final PR HEAD.

## Matrix decision

This is **upgrade-only / coverage enabler (+0)**. It improves preflight reliability and makes mobile E2E more representative, but does not replace the required authorized hosted staging run. Criterion 02.4 remains **0.5/1.0** until:
- authorized isolated HTTPS staging run succeeds;
- Story → same SKU → official pre-checkout is evidenced there;
- provider sandbox round-trip and every rubric-required assertion are reviewed.

The existing partial score of 0.5 is retained. No new point is claimed.
