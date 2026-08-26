# Plan: Sprint 14 (Part 1/3) — Real Social Proof Confirmation & Enhancement

Verify Sprint 12 social proof and implement aggregated real-time counters for honest persuasion.

## User Review Required

> [!IMPORTANT]
> This plan uses existing `analytics_events` data. No new tracking tables are created.

## Proposed Changes

### Database & Security
- Add configuration columns to `social_proof_config`: `show_aggregated_counters`, `min_events_for_counter`, and `counter_window_hours`.
- Ensure RLS and proper grants for the updated config.

### Backend Intelligence
- Implement `getAggregatedSocialProof` server function in `src/lib/social-proof.functions.ts`.
- Calculate real counts of views and favorites from `analytics_events` within the configured time window.
- Enforce truthfulness: return 0 if counts are below the minimum threshold (default 5-10).

### UI/UX Enhancement
- Create `AggregatedSocialProof.tsx` component with premium glassmorphism styling.
- Integrate compact counters in `ProductCard.tsx` (feed, trending, deals).
- Integrate full detail counters in `/product/:slug` below the price.
- Update `AdminSocialProof.tsx` to include controls for aggregated counters.

### Verification
- Audit Sprint 12 items: anon names, opt-out functionality, and dismiss logic.

## Technical Details

- **Data Consistency**: Counters will use a 5-minute cache to balance real-time feel with database performance.
- **Privacy**: No user-identifiable data is exposed in aggregated counters.
- **Visuals**: Uses standard `oklch` tokens and `glass-surface` utilities for design system parity.
