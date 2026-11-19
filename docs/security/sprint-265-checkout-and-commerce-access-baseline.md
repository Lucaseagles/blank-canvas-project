# Sprint 265 — checkout destination and commercial access baseline

Status: read-only production inspection plus automated regression tests. No production writes.

## Scope

Project: `heartful-helper-box` (`akfvkjarpgocdsieuvvq`). This sprint combines checkout URL hardening tests with a permission inventory so the next cart/order schema is designed against actual access boundaries.

## Checkout URL controls already implemented

The shared validator in `src/lib/rubi-checkout-validation.ts`:
- Requires a separately declared supplier hostname with a constrained DNS-host syntax.
- Requires HTTPS and exact hostname equality; rejects credentials, non-default ports, fragments, oversized URLs and malformed URLs.
- Requires an owner-verified checkout flag and active supplier before returning a usable destination.
- Does not establish provider ownership or prove that a payment occurred; owner verification is an operational approval, not provider API verification.

Sprint 265 expands regression coverage for URL parser edge cases: backslash authority confusion, hostname suffix attacks, trailing-dot hosts, IPv4/IPv6 literals, explicit default/non-default ports, malformed allowlist values and oversized URLs.

## Production permission snapshot (read-only)

RLS is enabled on all seven inspected tables:

| Table | RLS | anon | authenticated | service_role |
|---|---|---|---|---|
| `products` | yes | table grants; RLS limits reads to active/published | table grants; RLS allows active/published reads and owner management | grants |
| `favorites` | yes | table grants exist, but no anon policy | own-row policy on `auth.uid() = user_id` | grants |
| `hub_products` | yes | no table grants observed | no table grants observed | grants |
| `hub_suppliers` | yes | no table grants observed | no table grants observed | grants |
| `hub_partner_referral_links` | yes | no table grants observed | no table grants observed | grants |
| `hub_partner_referral_visits` | yes | no table grants observed | no table grants observed | grants |
| `hub_partner_confirmed_sales` | yes | no table grants observed | no table grants observed | grants |

Policy role identifiers were resolved: 16484 = `anon`; 16485 = `authenticated`.

Important nuance: broad table grants do not bypass RLS. For `products`, the active/published read policy and owner policy are the actual row-level controls. For `favorites`, the only inspected policy is authenticated own-row access, so anonymous access is not authorized by RLS despite table grants. The four `hub_*` commercial tables have no policies in this snapshot and no anon/authenticated table grants; access is through privileged server-side paths and service_role.

## Design consequences for cart/order

1. Do not expose service-role tables directly to browser clients.
2. Cart and order operations must be authenticated server functions or narrowly scoped RPCs with explicit owner checks; never trust client-supplied user IDs.
3. Keep `supplier_cost` server-side; consumer responses expose only retail-facing fields.
4. Keep marketplace affiliate acquisition separate from supplier checkout and own-store order creation.
5. A click, precheckout marker or internal order record is not a paid/settled transaction.
6. Partner sales remain sourced from verified external evidence; do not duplicate them as RUBI store orders.
7. Any new table requires explicit authenticated owner policies, least-privilege grants, negative tests for anon/other users/partner roles, and service-role write-path review.
8. Existing `FORCE ROW LEVEL SECURITY` is false for inspected tables; do not change it casually because service and administrative workflows may depend on role bypass. Assess per new table and execution path.

## Gates before first cart/order migration

- Reconcile production migration history and test the complete migration chain in a disposable database.
- Define cart owner/session semantics and safe anonymous-to-authenticated merge, if supported.
- Validate price and active product/supplier on the server at add/update/checkout time.
- Add uniqueness/idempotency for active cart item identity and order creation key.
- Use immutable order item snapshots and append-only order events.
- Add concurrent update/checkout tests and negative access tests.
- Confirm owner-only Shadow Master access remains unchanged.
- Do not deploy to production without explicit authorization.

## Hybrid scorecard

- Sprint 265 classification: upgrade + regression-test coverage + architecture/security baseline.
- V1 coverage: no new matrix point claimed. Last formally established baseline remains 36.5/48 = 76.0%, with 11.5 points pending.
- Upgrade completion: percentage not published until the upgrade inventory has a reconciled denominator.
- Production: read-only.
