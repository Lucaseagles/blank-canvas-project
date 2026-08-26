# Sprint 5 (Parte 3/3) — Marketplace Connector Architecture

## Context
With the base audited and remediated, the project is ready for the first **real** marketplace integration. This is the prerequisite for Offer Intelligence (real price comparison).

## Objective
Solidify the connector architecture (defined in Sprint 0) into a real implementation with secure credential management.

## Technical Tasks
- [ ] **Secure Credential Management**: Implement `/admin/integrations` to store API keys as Supabase secrets (never in plain text, never client-side).
- [ ] **Marketplace Adapter**: Build the `MarketplaceAdapter` contract for `searchProducts`, `getProduct`, `getOffers`, `getPrice`, `getAvailability`, and `getAffiliateLink`.
- [ ] **Real Connector Implementation**: Implement the first real connector (Shopee, Mercado Livre, or AliExpress) following official documentation and rate limits.
- [ ] **Product Normalization**: Map external API fields to the internal `products` schema without inventing missing data.
- [ ] **Manual Sync**: Add a "Sync Now" button in the admin to trigger real-time updates.

## Database
Populate existing `marketplaces`, `products`, and `price_history` tables with real data. Use the `jsonb` config column in `marketplaces` for API-specific metadata.

## Security & Compliance
- API credentials restricted to server-side only.
- Strict adherence to affiliate program rules (no masking links, no fake stock).
- Controlled backoff/retry for rate limiting.
