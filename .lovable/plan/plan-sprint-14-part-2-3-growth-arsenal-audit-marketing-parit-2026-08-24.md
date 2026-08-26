# Plan: Sprint 14 (Part 2/3) — Growth Arsenal Audit & Marketing Parity

Verify the active state of all growth and marketing features (Sprints 8-12) and map the gap for full marketplace parity (Shopee/Mercado Livre).

## User Review Required

> [!IMPORTANT]
> This phase focuses on **verification and reporting**. I will implement missing "marketing logic" glue (like contextual referral prompts or missing reward triggers) only if found strictly absent during the audit, as per the checklist.

## Proposed Changes

### 1. Growth Audit & Hardening
- **Referral Engine**: Verify milestone rewards (Badges/Levels) are granted via database triggers. If triggers are missing, implement them.
- **Personalization Pulse**: Ensure `PRODUCT_VIEW` and `VIDEO_VIEW` events correctly update `user_interests` with the assigned weights.
- **Retention Triggers**: Confirm the `runRetentionCheck` automation correctly identifies users and queues notifications based on the 3-day inactivity rule.
- **Campaign Funnels**: Verify that UTM parameters correctly map clicks to campaign channels for ROI calculation.

### 2. UI Growth Polish (Checklist Items)
- **Contextual Referral**: Add a subtle, non-intrusive invite prompt in `ProductCard` or `ProductDetailPage` after a favorite action (high-intent moment).
- **Gamification Visibility**: Ensure unlocked milestones are clearly highlighted in the `/profile` Network tab.

### 3. Marketing Parity Mapping (Report)
- Research and document specific mechanics for the next sprint:
    - **Gamification**: Streaks, coins, and daily mission structure.
    - **Dynamic Vouchers**: Logic for personalized discount codes.
    - **Engagement Loops**: Daily reward wheel/mini-game mechanics.

## Technical Details

- **Referral Logic**: Implement `check_referral_milestones()` trigger to auto-grant rewards.
- **Engagement Glue**: Update `VideoPlayer` or video routes to ensure engagement signals flow into the personalization engine.
- **Verification**: Use Playwright to simulate the invite-to-activation funnel.
