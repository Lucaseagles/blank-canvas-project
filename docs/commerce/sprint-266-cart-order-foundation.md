# Sprint 266 — First-party cart and order foundation

Status: implementation boundary and release-gate specification. No production schema, catalog data, payment flow, provider integration, or customer balance is changed by this sprint document.

## 1. Objective

Prepare the first-party RUBI Store cart and canonical order flow without conflating it with marketplace affiliate links, supplier-hosted checkout, partner commission evidence, or financial settlement.

RUBI orchestrates discovery, cart intent, order snapshots, attribution context and financial visibility. Kairos and other external providers remain responsible for their own hosted checkout/payment behavior unless an official, authorized, tested integration is established.

## 2. Verified baseline carried forward

- Sprint 265 is merged; checkout destination validation rejects ambiguous URL parser inputs and the two required CI workflows passed on its merge candidate.
- `hub_products` is the RUBI/supplier catalog; `products` is the marketplace/affiliate catalog. Both use UUIDs, so cart identity must be `catalog_type + product_id`, never a bare UUID.
- Existing `rubi-precheckout.functions.ts` performs readiness checks and redirects to approved external checkout. It does not create an order or prove payment.
- `hub_partner_confirmed_sales` is the existing evidence-backed partner-sale domain. Do not duplicate its sales or commission amounts into a second commission source.
- Supplier cost and B2B pricing are private commercial fields; consumer cart responses expose only retail-facing snapshots.
- Production migration history and repository migration files are materially divergent (see Sprint 259). The seven post-Sprint-234 migrations require controlled reconciliation and dependency-order validation.

## 3. Separate commerce channels

### A. RUBI own-store / supplier checkout

- Catalog source: `hub_products`.
- Cart item discriminator: `catalog_type = 'hub_product'`.
- Retail price is re-read from the server at every mutation and checkout review.
- Supplier must be active; product must be active; retail price must be positive; destination must pass the approved exact-host HTTPS validator.
- The customer is redirected to the supplier/Kairos-hosted checkout only after a fresh server-side readiness check.
- A redirect, cart, pre-checkout, or internal order record is not a paid order.

### B. Marketplace affiliate

- Catalog source: `products`.
- Cart item discriminator: `catalog_type = 'marketplace_product'`.
- Preserve marketplace and affiliate destination metadata as a distinct outbound journey.
- Do not insert marketplace affiliate products into a supplier/Kairos order or imply RUBI controls the marketplace cart.
- Marketplace commission is recognized only from the appropriate external report/evidence and existing attribution rules.

### C. Partner attribution

- Preserve eligible first-touch and last-touch attribution references separately.
- A partner referral visit or outbound click is traffic evidence, not sale evidence.
- Partner commission is not generated from cart value, checkout redirect, customer claim, or unverified return URL.
- Confirmed partner sales continue to use `hub_partner_confirmed_sales` and existing audited reconciliation. Link a canonical order only when a reliable external reference match exists.
- Partner views remain partner-scoped; global commercial and finance records remain Shadow Master-only.

## 4. Proposed persistent model — not yet migrated

### `rubi_carts`

- UUID primary key; owner user ID and/or secure anonymous session reference; status; currency; revision; created/updated timestamps.
- One active cart per owner/session and currency, enforced by a database uniqueness strategy after anonymous-session semantics are approved.
- Never accept a client-supplied owner ID as authority. Resolve identity from the authenticated server context or a cryptographically protected anonymous session.

### `rubi_cart_items`

- Cart ID; catalog type; product UUID; positive bounded quantity; timestamps.
- Unique active identity on cart + catalog type + product ID.
- Store display snapshots for stable UX, but treat them as historical display data only—not authority for current price or availability.
- Do not store supplier cost, wholesale tiers, secrets, payment credentials or raw provider payloads.

### `rubi_orders` and `rubi_order_items`

- Canonical order ID, owner/session, channel, source, status, currency, subtotal/discount/shipping/tax/total snapshots, attribution references and timestamps.
- Immutable item snapshots include catalog type, product ID, title, image reference, quantity, unit price, currency, supplier/marketplace and destination classification.
- Order creation does not set payment-confirmed or settled status.
- Cart mutation after order creation cannot change order items or totals.

### `rubi_order_events` and external references

- Append-only order event history with actor, source, event type, idempotency key and evidence reference.
- Unique idempotency constraint for order creation and event ingestion.
- External order references include provider/source, external reference, verification state and evidence provenance.
- Return URL parameters and user-uploaded claims remain unverified until an authorized evidence review or official provider signal validates them.

## 5. Server-side transaction contract

Every cart mutation and checkout review must:

1. Authenticate or validate the protected anonymous session.
2. Resolve cart ownership on the server; reject cross-user and cross-partner access.
3. Validate catalog type and UUID pair; reject ambiguous catalog IDs.
4. Re-read product active state, supplier/marketplace state and current retail-facing price from the authoritative catalog.
5. Recompute totals server-side using exact decimal/numeric arithmetic; never trust client totals.
6. Enforce quantity bounds and stock/availability checks only where authoritative stock data exists. Do not invent stock guarantees.
7. Preserve attribution references without allowing a client to award itself a commission.
8. Use transaction-level locking/revision checks to prevent lost updates and duplicate conversion.
9. Convert cart to immutable order atomically and idempotently.
10. Emit audit/order events in the same transaction; a failed write must not leave a partial order or false success.

For a changed price or inactive product, return a structured conflict requiring the customer to review the updated cart; never silently charge or redirect at a stale price.

## 6. Security and RLS gates

- Browser clients never receive service-role credentials or direct write access to privileged commerce tables.
- Use authenticated server functions or narrowly scoped RPCs with explicit owner checks.
- Add least-privilege grants and explicit RLS policies for each new table.
- Add negative tests for anon, another consumer, merchant, partner, and non-owner authenticated users.
- Keep Shadow Master access owner-only; do not add another master role or broaden administrative visibility.
- Review SECURITY DEFINER ownership, fixed search_path, execute grants and audit atomicity.
- Do not change existing FORCE ROW LEVEL SECURITY behavior casually.

## 7. Migration release blocker

Do not create or deploy the cart/order migration until the Sprint 259 migration-history reconciliation is complete.

Required sequence:
1. Build a content-based manifest for every repository migration after production version `20261118001747`, including historical renames/re-timestamps and duplicate version prefixes.
2. Reconcile all seven post-Sprint-234 migrations in timestamp/dependency order; do not deploy Sprint 252/253 in isolation.
3. Validate the complete pending chain in a disposable database from a production-compatible baseline.
4. Run migration uniqueness, SQL, RLS/grant, RPC authorization, idempotency, rollback/forward-repair and application caller contract tests.
5. Confirm backup/restore posture and obtain explicit deployment authorization.
6. Apply only through the approved migration workflow; verify recorded versions and live catalog objects afterward.

This sprint does not run migration repair, mass rename SQL files, replay historical migrations, or write to production.

## 8. Acceptance tests required before enabling cart writes

- Same UUID in different catalog domains remains two distinct items.
- User A cannot read or mutate User B's cart/order.
- Anonymous cart cannot be claimed by changing a client-supplied user ID.
- Inactive product/supplier and invalid checkout destination are rejected.
- Client-supplied price, supplier cost, subtotal and total are ignored.
- Price changes force cart review; order snapshots remain immutable.
- Concurrent add/update/checkout does not lose quantity or create duplicate orders.
- Repeated idempotency key returns the original order result without duplicate events.
- Partner attribution is preserved but no commission is created without confirmed sale evidence.
- Marketplace affiliate outbound journey cannot become a RUBI supplier order.
- Order creation and checkout redirect never imply payment or settlement.
- Shadow Master-only records remain inaccessible to consumers, merchants and partners.

## 9. Sprint 266 classification and scorecard

- Classification: upgrade / architecture hardening; no V1 coverage point claimed by this document alone.
- V1 baseline carried forward: 36.5 / 48 = 76.0%; 11.5 points remain.
- Global upgrade completion: not published until the upgrade inventory has a reconciled denominator.
- Production database: read-only; no migrations applied.
- Cart writes: not enabled until migration and runtime acceptance gates pass.
