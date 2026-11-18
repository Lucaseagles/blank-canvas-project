# RUBI Eagles — Commerce Journey & Financial Evidence Contract

Status: implementation contract for Sprint 256; design only. No production schema, checkout behavior, prices, payment flow, or provider integration is changed by this document.

## 1. Decision

RUBI is the system of customer journey orchestration, product presentation, cart intent (once a first-party cart is implemented), commercial attribution, and financial visibility. The actual payment may happen outside RUBI. RUBI must never pretend it can observe an external checkout after the customer leaves unless a verifiable signal returns.

The algorithm is the intelligence layer: it interprets permitted, instrumented events and recommends actions. It is not the source of financial truth. The canonical order, evidence, reconciliation, and financial ledger are separate layers.

## 2. Verified current-state baseline

The connected Supabase project `heartful-helper-box` currently has:
- `analytics_events` with `user_id`, `anonymous_id`, `session_id`, `event_type`, `event_name`, `product_id`, `category_id`, `campaign_id`, `source`, `metadata`, and `created_at`.
- Existing product catalogs `hub_products` (RUBI/supplier catalog) and `products` (marketplace/affiliate catalog), with product identifiers, titles, images, prices and destination fields.
- Partner referral links and visits, including visit token and pre-checkout viewed timestamp.
- `hub_partner_confirmed_sales` for partner-attributed sale records and payment evidence fields.
- Existing RUBI pre-checkout currently revalidates an approved external HTTPS destination, emits `RUBI_PRECHECKOUT_CONTINUE` as an external checkout intent, then redirects the browser to that destination.
- No public table matching a first-party cart, universal RUBI order, purchase, or checkout session was found in the inspected database. Code search also did not find a persistent cart implementation.

Important: the existing RUBI pre-checkout is an internal orchestration/review step, not a payment processor or proof that a completed order exists. It does not collect card data or control the external provider's order state.


## 2.1 Verified catalog and partner schema details

A read-only inspection of the connected `heartful-helper-box` database confirms the two catalog domains must remain explicitly typed in cart and order items:

- `hub_products` (RUBI/supplier catalog): UUID, supplier ID, title, description, image URL, category, SKU, active flag, retail price, supplier cost, B2B price/minimum quantity, checkout URL/verification and revision.
- `products` (marketplace/affiliate catalog): UUID, title, description, image array, category ID, marketplace ID, external product ID, affiliate URL, current/previous price, discount, status and offer metadata.

Both domains use UUID identifiers, so an item reference must be the pair `catalog_type + product_id`; a bare UUID is not a sufficient catalog discriminator. Snapshot the selected title, image, displayed price, currency, marketplace/supplier and destination at cart/order time. Never expose supplier cost to consumers or partners unless an explicit authorized commercial view permits it.

Partner attribution already has a useful relational base:
- `hub_partner_referral_links` references `commercial_profiles` and `hub_products`; it has a unique code and a unique partner/product pair.
- `hub_partner_referral_visits` references the referral link and may retain a visit token, publication reference and pre-checkout viewed timestamp.
- `hub_partner_confirmed_sales` references the referral link, records external order ID, source, gross amount, commission percentage/amount, confirmation timestamp, provider and payment evidence reference/verification timestamp. A unique constraint on `source + external_order_id` already prevents duplicate external order references within a source.

This existing confirmed-sales table should remain the partner-sale evidence domain. A future canonical order may reference it when a reliable match exists; do not copy its rows into a second commission source or count the same sale twice.

RLS is enabled on the inspected catalogs and partner tables. The read-only policy inventory showed explicit public/owner policies on `products`, but did not return policies for `hub_products`, referral links/visits or confirmed sales. Treat this as an access-control review gate, not proof of exposure or intended access: inspect grants, security-definer RPCs and service-role paths before adding cart/order policies. Do not weaken RLS or create broad authenticated policies to make the cart work.

## 3. Four distinct records

Never collapse these into one "sale" record:

1. **Behavior event** — view, search, favorite, cart add/remove, checkout intent, outbound click, return to app. Useful for algorithm and funnel analysis; may be missing, duplicated, delayed, blocked by browser settings, or client-tampered.
2. **Commercial order** — a first-party RUBI order snapshot or an external order reference obtained from a reliable source. Records items, quantity, displayed price, currency, source channel, and attribution. Order creation alone is not payment.
3. **Payment evidence** — external statement/export, provider confirmation, verified receipt/order status, or documented authorized manual review. Store evidence provenance, reference, timestamp, actor/method and checksum where relevant.
4. **Financial entry/settlement** — amount actually received/settled or externally paid, fees, refunds, chargebacks and commissions. Must reconcile to evidence and use immutable compensating entries for corrections.

## 4. Journey event taxonomy

Use stable, versioned event names and safe metadata. Suggested taxonomy for the implementation stage:

- Discovery: `RUBI_PRODUCT_IMPRESSION`, `RUBI_PRODUCT_VIEW`, `RUBI_SEARCH_SUBMITTED`, `RUBI_FAVORITE_ADDED`.
- Cart (only after persistent first-party cart exists): `RUBI_CART_CREATED`, `RUBI_CART_ITEM_ADDED`, `RUBI_CART_ITEM_QUANTITY_CHANGED`, `RUBI_CART_ITEM_REMOVED`, `RUBI_CART_VIEWED`.
- Checkout: `RUBI_CHECKOUT_STARTED`, `RUBI_CHECKOUT_REVIEWED`, `RUBI_EXTERNAL_CHECKOUT_REDIRECTED`.
- Return: `RUBI_EXTERNAL_CHECKOUT_RETURNED`, `RUBI_ORDER_REFERENCE_SUBMITTED`, `RUBI_PURCHASE_EVIDENCE_ATTACHED`.
- Reconciliation: `RUBI_ORDER_MATCH_SUGGESTED`, `RUBI_ORDER_MATCH_CONFIRMED`, `RUBI_ORDER_MATCH_REJECTED`, `RUBI_PAYMENT_SETTLED`, `RUBI_REFUND_RECORDED`.

Each event should include where applicable: schema_version, event_id/idempotency key, occurred_at, received_at, authenticated user or pseudonymous session reference, product/order/cart reference, quantity, displayed price snapshot, currency, channel, provider/marketplace, campaign, partner referral ID, attribution method, consent/processing basis, and source. Do not store card data, passwords, full payment credentials, unnecessary personal data, or raw sensitive provider payloads.

The taxonomy is a design contract, not a claim that all these events are already implemented.

## 5. Source and attribution model

Every product journey carries a canonical channel:
- `rubi_store` — first-party RUBI store.
- `marketplace_affiliate` — external marketplace product link.
- `partner_referral` — approved partner's tagged RUBI journey.
- `supplier_external` — supplier-hosted checkout.
- `other_external` — reviewed external destination.

Attribution should preserve first-touch and last eligible touch separately, plus the selected commercial rule. Do not silently overwrite one with the other. A partner commission is credited only under the partner agreement and after the required sale evidence is confirmed.

For outbound links, use a RUBI redirect/visit record before leaving the app where technically appropriate. The redirect record proves that RUBI sent a visitor to a destination; it does not prove that the destination accepted an order or payment.

If the external provider does not support a unique partner link, coupon, exportable attribution, order reference, or other independently verifiable signal, the result remains `attribution_unverified` and must not generate an automatic commission.

## 6. External checkout observability without APIs

No Kairos or marketplace API is assumed. Each source has a declared observation mode:
- `first_party`: RUBI records its own cart/order state.
- `redirect_only`: RUBI proves a click/redirect, not external checkout completion.
- `customer_return`: customer returns with an external order reference or evidence; initially unverified.
- `manual_review`: authorized operator checks evidence and records a decision with actor/time.
- `report_import`: provider/marketplace export is imported, validated, deduplicated and reconciled.
- `official_integration`: only enabled after official documentation, authorization, credentials and tests exist.

A return URL parameter alone is not payment proof; it can be copied or forged. A screenshot or customer-submitted receipt is a claim until reviewed. A marketplace commission report may confirm affiliate earnings without revealing the buyer's full order; report only the fields actually present. Keep gross order value, affiliate commission, seller settlement and RUBI cash receipt separate.

## 7. First-party cart and order design (future implementation)

Before implementing the cart, agree the following model:
- `rubi_carts`: owner user or anonymous session, status, currency, revision, timestamps.
- `rubi_cart_items`: cart, catalog type + product ID, quantity, immutable display snapshot (title, image reference, unit price, currency, supplier/marketplace, destination classification), added/updated timestamps.
- `rubi_orders`: canonical RUBI order ID, user/session, source, status, currency, subtotal/discount/shipping/tax/total snapshots, attribution snapshot, created_at. No payment status inferred from order creation.
- `rubi_order_items`: immutable item snapshots; never rely on current catalog price/image to reconstruct a past purchase.
- `rubi_order_events`: append-only state/event history with actor/source, idempotency key and evidence reference.
- `rubi_external_order_refs`: provider/marketplace, external order reference, source link/partner attribution, verification state and evidence.
- Cart-to-order conversion is atomic and idempotent. Cart changes after order creation cannot mutate the order snapshot.

This model must be reconciled with existing catalogs and partner records before migrations. Do not duplicate the specialized partner confirmed-sale table; link its confirmed records to canonical orders/financial entries where a reliable mapping exists.

## 8. Algorithm contract

The algorithm may use permitted events to:
- rank and recommend products;
- detect high-intent sessions (repeated views, cart additions, checkout starts);
- identify abandoned first-party carts;
- compare channel/product funnel performance;
- suggest campaign and creative adjustments;
- flag unusual click/order/evidence mismatches for review.

The algorithm must label each output as observed, estimated, or confirmed. It cannot infer an external purchase solely from time-on-page, a click, a redirect, an app close, a return URL, or a recommendation response. Do not create fake urgency, fake social proof, or synthetic sales.

## 9. Dashboard definitions

### Shadow Master — global
- Product views, cart adds, first-party carts, checkout starts and outbound redirects (behavior funnel).
- First-party orders created and external order references received (commercial funnel).
- Orders with evidence pending review, confirmed external orders, refunds/disputes.
- Gross order value, external affiliate commission, provider-confirmed amount, settled cash, receivables, expenses, fees, partner commissions and payouts as separate metrics.
- Channel/provider coverage and last import/reconciliation time.
- Drill-down from every total to source records and evidence.

### Partner — own scope only
- Visits/clicks attributed to their approved links.
- Orders attributed under the agreement, separated into pending/unverified/confirmed/reversed.
- Commission base, percentage and agreement revision snapshot.
- Commission pending/eligible/held/paid and payout allocations.
- No global Master financials, other partners' data, supplier costs or private audit notes.

### Consumer
- Own cart and order history, if authenticated or securely linked to an anonymous session.
- Clear status wording: "checkout opened", "order reference submitted", "awaiting verification", "confirmed", "cancelled/refunded".
- Never imply a purchase is complete until the evidence state supports it.

## 10. Privacy, audit and data quality

- Instrument only events necessary for product, security and commercial operations; disclose tracking and honor applicable LGPD rights, consent and retention requirements.
- Anonymous IDs are pseudonymous, not proof of identity. Do not silently merge devices or infer a person's identity.
- Owner analytics access is restricted. Partner access is strictly scoped to that partner's approved records.
- Client-generated events are untrusted observations. Validate server-side references and never let clients set payment-confirmed or settled statuses.
- Deduplicate with stable event IDs where available; tolerate retries and out-of-order delivery.
- Snapshot prices and product descriptors at cart/order time. Store currency explicitly and use decimal/numeric amounts.
- Keep an audit trail for manual verification and corrections; never overwrite the original evidence or delete financial history.
- Provide event retention, deletion/anonymization and export processes consistent with the declared privacy policy and legal requirements.

## 11. Delivery gates

1. Inventory and reconcile catalog IDs, current partner attribution and finance tables.
2. Create migration through the repository's supported Supabase CLI workflow; review RLS, grants, constraints, indexes and RPC privileges before application.
3. Implement persistent cart and immutable item snapshots; test anonymous/authenticated ownership and concurrency.
4. Implement first-party order creation and idempotent order events; keep payment status separate.
5. Instrument outbound redirect and return paths without treating them as paid orders.
6. Add report-import/manual-evidence workflow with duplicate detection and review queue.
7. Project confirmed orders and existing partner sales into the finance center without double counting.
8. Build Master and partner dashboards from reconciled sources.
9. Run role-isolation, LGPD/privacy, idempotency, concurrency, reversals, TypeScript, lint, build, CI and browser tests.

No migration is applied to production by this specification. Provider integration stays disabled until there is official documentation and a verifiable mechanism.
