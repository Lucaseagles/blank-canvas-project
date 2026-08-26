# Sprint 14 Part 3: Social Proof Evolution & Admin Hardening

Extend the existing Social Proof system with new event types, hybrid simulation for low-traffic periods, and a robust management interface.

## User Review Required

> [!IMPORTANT]
> The hybrid simulation logic will display "Recent Activity" using historical data if no new events occur within the recency window. This ensures the UI stays "warm" while remaining technically honest about past user interactions.

## Technical Details

### 1. Database Schema
- **Table**: `social_proof_config` extension
  - `hybrid_simulation_enabled`: boolean (Fallback to historical events if recent window is empty)
  - `show_location`: boolean (Display user's city/state if available)
  - `simulated_volume_boost`: number (Percentage multiplier for aggregated counters - optional/admin only)
- **Table**: `profiles` extension
  - `location_city`: string
  - `location_state`: string

### 2. Server Functions (`src/lib/social-proof.functions.ts`)
- Update `getSocialProofEvents`:
  - Add support for `VIDEO_START` and `VIDEO_COMPLETE` event types.
  - Implement hybrid logic: if recent events < 5, fetch historical high-quality events (favorites/clicks) from the last 7 days.
  - Resolve user location from profiles.
- Update `getAggregatedSocialProof`:
  - Include video metrics (views/completions) in the aggregate summary.

### 3. UI Components
- **SocialProofPopup (`src/components/SocialProofPopup.tsx`)**:
  - Add animations for new event types (Video Play icon).
  - Include location string (e.g., "de São Paulo, SP").
  - Refine mobile positioning for safe areas.
- **Admin Interface (`src/routes/admin/social-proof.tsx`)**:
  - Add toggles for Hybrid Mode and Location display.
  - Add checkboxes for Video events (Elegibilidade).
  - Implement "Preview" button to trigger a test popup.

### 4. Personalization Engine Integration
- Ensure video events are correctly emitted with `product_id` in metadata to feed the social proof pipeline.
