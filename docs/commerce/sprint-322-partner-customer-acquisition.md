# Sprint 322 — Partner customer acquisition attribution

**Classification:** upgrade-only. No V1 matrix point claimed.

## Objective

Allow an approved RUBI partner to acquire a new Hub Eagles consumer account through an existing partner/product referral URL. Once the consumer authenticates, the app may bind one immutable partner acquisition record to that consumer for a 90-day eligibility window.

## Implemented flow

1. A customer opens a valid partner referral URL.
2. The partner code is preserved through optional sign-in/sign-up as `partner_ref`.
3. Register/login screens disclose attribution and the 90-day window; buyer price is unchanged.
4. After authentication, a server function verifies the current user from the access token and rechecks partner approval, active agreement, active product grant, product/supplier availability and approved checkout.
5. A service-role-only RPC writes the first acquisition for the authenticated customer. A second partner cannot overwrite it; self-referral and inactive links are rejected.
6. The partner portal shows aggregate acquired-customer counts only. It does not expose customer identity or contact data.

## Attribution rules

- One acquisition record per customer account; immutable first successful binding.
- 90-day attribution window, beginning at successful authenticated binding.
- Partner and product eligibility are revalidated; revocation prevents future attribution use.
- Consumer-to-consumer referrals remain separate from partner commercial attribution.
- Signup, visit, click, pre-checkout and acquisition are not orders, purchases, paid conversions or commissions.
- A future first-party Hub Eagles checkout must resolve the customer's active acquisition partner against the purchased SKU and require that partner's current grant and agreement. It must create a sale only after reliable payment confirmation.
- Existing RUBI pre-checkout redirects to external supplier/provider checkout. It is not a first-party payment processor. This sprint does not pretend to credit purchases from unrelated products through an external checkout that does not return trusted attribution metadata.

## Security

- Private table with RLS enabled and no anon/authenticated privileges.
- RPC execute permission restricted to service_role.
- Server verifies access token and never accepts a client-supplied customer ID.
- Database enforces one row per customer, self-referral rejection, partner approval, agreement, grant, product/supplier state and 90-day expiry.
- Partner dashboard receives counts only, scoped to the authenticated partner profile.

## Validation

- Regression suite: `src/lib/rubi-partner-customer-acquisition.test.mjs`.
- Required Sprint 33 QA runs the new suite.
- Full Hub V1 Integration QA and authenticated four-profile E2E remain release gates.
- No production migration or provider/payment integration is performed by this sprint.