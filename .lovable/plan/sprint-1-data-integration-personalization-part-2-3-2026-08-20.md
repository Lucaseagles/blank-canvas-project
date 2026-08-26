# Sprint 1 — Data Integration & Personalization (Part 2/3)

## Technical Implementation Plan

Continuing exactly from Part 1 and current project state.

### 1. Offer Tracking
- Implement `trackOutboundClick` in `src/lib/analytics.ts`.
- Wrap affiliate links in `ProductCard` and `ProductDetail` to trigger analytics before redirect.
- Ensure original affiliate URL is preserved.

### 2. Price History
- Verified `price_history` table existence.
- Implement `recordPriceChange` trigger/logic in the backend.
- Update `/product/$slug` to display history chart/list when data exists.

### 3. Admin Products (`/admin/products`)
- Functional CRUD for products.
- Authorization checks (Owner role).
- Audit logging for admin actions.

### 4. Admin Marketplaces (`/admin/marketplaces`)
- Management interface for marketplace connectors.
- Status updates (connected, pending, error, disabled).
- Connectors remain in `pending` state for this sprint.

### 5. Personalization Backend
- Implement incremental score updates for `user_interests` based on events.
- Use PostgreSQL functions/triggers for efficiency.

### 6. Recommendations
- Implement `getPersonalizedRecommendations` server function.
- Scoring logic: `interest + quality + freshness - repetition`.
- Ensure sorting happens at the database level.

### 7. Performance & Security
- Add pagination to Feed, Category, and Search.
- Implement required database indices.
- Strict RLS enforcement for `user_interests` and `personalization_weights`.

### Technical Details
- **Tables**: `price_history`, `user_interests`, `personalization_weights`.
- **Server Functions**: `getPersonalizedFeed`, `updateInterestScore`, `adminUpdateProduct`.
- **UI**: Premium refinements, skeletons, and error boundaries for all new routes.
