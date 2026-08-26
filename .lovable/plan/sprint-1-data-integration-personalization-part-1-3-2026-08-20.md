---
name: Sprint 1 — Data Integration & Personalization (Part 1/3)
description: Implement core features for catalog, user profiles, and the initial personalization engine.
type: feature
---

# Sprint 1 — Data Integration & Personalization (Part 1/3)

This plan covers the first part of Sprint 1, focusing on catalog navigation, user profiles, search, and the foundation of the Personalization Engine.

## Proposed Changes

### 1. Database Schema Extensions
- Create `user_interests` table to track user affinity for categories.
- Create `personalization_weights` table for dynamic scoring adjustment.
- Create `price_history` table (preparatory for Part 2).
- Update RLS policies and grants for these new tables.

### 2. Personalization Engine v1 (ADR-005)
- Implement `PersonalizationEngine` in `src/lib/personalization.functions.ts`.
- Weighted scoring system for interest calculation (view=1, click=3, etc.).
- Product recommendation scoring based on user interests, quality, and freshness.
- Integration with the `trackEvent` system.

### 3. User Profile & Preferences
- Create `src/routes/profile.tsx` for profile management.
- Allow editing `display_name`, `avatar`, `preferred_categories`, `price_range`, and `preferred_marketplaces`.
- Ensure preference updates trigger `PREFERENCE_UPDATED` analytics events.

### 4. Catalog & Discovery
- Implement `/category/$slug` route with dynamic data fetching, filtering, and pagination.
- Implement `/search` route with PostgreSQL text search and quick filters.
- Update `/feed` to use the `PersonalizationEngine` for product ranking.

### 5. UI/UX Refinement
- Improve `ProductCard` with real data support.
- Add loading, empty, and error states for catalog pages.
- Ensure premium visual consistency across new screens.

## Technical Details
- **Weighted Scoring:** Deterministic rules stored in `personalization_weights`.
- **Search:** `ILIKE` or full-text search on PostgreSQL (no AI/embeddings yet).
- **Architecture:** Modular implementation of the Personalization Engine to allow future expansion (ML/AI).

## User Review Required
- **Search Filters:** Are there specific marketplaces beyond Amazon, Mercado Livre, and Shopee that should be prioritized in filters?
- **Weighted Scoring:** The initial weights are view=1, click=3, favorite=5, share=6, skip=-1. Do you have any specific adjustments for these weights now?
