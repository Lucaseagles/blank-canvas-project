# Sprint 369 — Story checkout redirect evidence boundary

**Base:** `main` after PR #401.  
**Focus:** criterion 02.4 — hosted Story → same product → official pre-checkout journey.  
**Classification:** upgrade-only / coverage enabler. **Accepted V1 score delta: +0.0.**

## Gap found

The existing hosted Playwright journey approved a Story, found the matching product and verified that the supplier-payment button was enabled. It did not verify what destination the browser attempted to open when the consumer clicked the button. That left a meaningful gap between "button enabled" and "provider checkout navigation requested".

## Delivered

1. Added `RUBI_QA_CHECKOUT_ALLOWED_HOSTS`, a required comma-separated allowlist of exact provider sandbox DNS hostnames.
2. Added strict parsing: no wildcards, URL schemes, ports, paths, invalid DNS labels or duplicate hosts.
3. Added contract tests for valid, missing, malformed, duplicate and URL-like allowlist entries.
4. Added the allowlist contract to Sprint 33 QA via `npm run test:rubi-story-staging`.
5. Extended the hosted Story E2E to click the supplier-payment button and observe the outbound browser navigation.
6. The test allows the staging app's own origin, captures only a top-level HTTPS document navigation whose hostname exactly matches the approved allowlist (not fetch/XHR or other subresources), and aborts external requests before they reach a payment page. It then asserts that the consumer remains on the RUBI pre-checkout page.
7. The test checks HTTPS and absence of embedded username/password. It deliberately never prints or stores the full destination or query values.
8. Updated the staging readiness guide with the new variable and precise evidence boundary.

## What this proves — and does not prove

This is stronger than checking that a button is enabled: it proves the authenticated consumer browser attempted a top-level document navigation to an exact, pre-approved HTTPS provider hostname, while the browser remained on the RUBI pre-checkout page because the external request was intentionally aborted.

It does **not** contact the provider page, create a provider checkout session, prove that the provider accepts the session, validate a callback/webhook, complete a payment, or prove a sale. The outbound request is intentionally aborted to avoid accidental interaction with real checkout infrastructure.

For full 02.4 acceptance, still required:
- real isolated HTTPS `rubi-staging` with disposable Story/product fixtures and QA identities;
- actual official provider sandbox hostname(s) entered in `RUBI_QA_CHECKOUT_ALLOWED_HOSTS`;
- provider-approved sandbox integration and a documented, verifiable callback/round-trip test;
- sanitized run artifact and criterion-owner acceptance against the complete rubric.

Do not use the example test hostnames from unit fixtures as real allowlist values. They are reserved `.example` placeholders.

## Safety and scope

- No real payment page is contacted by the new browser assertion.
- No purchase, order, payment, commission or sale is created or claimed.
- No remote Supabase, production data, secrets, GitHub Environment values or provider credentials are changed.
- The workflow remains manually dispatched and requires explicit disposable-staging confirmation.
- If the configured provider host is absent or malformed, the run fails closed before Playwright starts.

## Matrix decision

**02.4 remains 0.5/1.0.** This PR strengthens redirect-intent evidence but cannot establish provider round-trip. No new point is claimed.

Operational aggregate remains **39.0/48 = 81.3%**. The 39.5/48 = 82.3% target remains conditional on complete hosted and provider acceptance.
