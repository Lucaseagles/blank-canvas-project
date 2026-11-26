# Sprint 324 — Creator discovery directory

**Classification:** upgrade-only. No V1 matrix point claimed.

## Objective

Turn the existing creator recruitment landing page into a discovery channel where consumers can find approved creators, inspect their public content and enter the creator's tracked storefront.

## Delivery

- Public directory lists only approved partner profiles with a valid 12-character public store code.
- Search filters by display name and partner type.
- Each card links to the creator's public profile and existing public storefront.
- Public video counts include only submissions approved by Shadow Master and videos separately published by the Owner.
- Future-scheduled videos are excluded from counts until their publication time.
- Directory payload omits partner user IDs, email addresses, customer identities and internal commercial IDs.
- A defensive cap fails closed if the published-submission query exceeds its configured bound.

## Guardrails

- The directory does not approve partners, grant products, alter commissions or confirm sales.
- Partner profile and storefront routes continue to perform their own live authorization checks.
- Creator discovery traffic is not counted as product sales or commissions.

## Validation

- Regression suite: `src/lib/rubi-public-creator-directory.test.mjs`.
- Required Sprint 33 QA runs the new suite.
- TypeScript, ESLint, production build, Hub V1 Integration QA and authenticated four-profile E2E are release gates.