# Sprint 8 (Part 2/2) — Automation Engine V1

Consolidate existing isolated automations into a central, auditable engine and implement new real-time rules for platform intelligence.

## Proposed Changes

### Database & Security
- **Schema Migration**:
  - Create `automation_rules` table for rule definitions (Trigger -> Action).
  - Create `automation_logs` table for auditability.
  - Enable RLS on both tables (admin-only access).
- **Automation Logic**:
  - Implement a `process_automation` function (Security Definer) to handle rule execution on the backend.
  - Set up cron/scheduled triggers for recurring tasks like "Trending Recalculation".

### Backend (Server Functions)
- **New Functions** (`src/lib/automation.functions.ts`):
  - `getAutomationRules`: List all active rules for the dashboard.
  - `toggleRuleStatus`: Enable/disable rules.
  - `getAutomationLogs`: Fetch execution history.
  - `recalculateTrendingManual`: Manual trigger for trending logic.

### UI / Dashboards
- **New Admin Route** (`src/routes/admin/automations.tsx`):
  - Rule management interface with status toggles.
  - Real-time log viewer.
  - Visual indicators for "Active" vs "Pending Integration" (Marketplace API adapters).
- **Navigation Update**:
  - Link the new Automations route in the sidebar/admin menu.

## Technical Details
- **Trigger Types**: `PRICE_CHANGED`, `NEW_OFFER_IN_GROUP`, `USER_INTEREST_THRESHOLD`, `SCHEDULED`.
- **Action Types**: `RECALCULATE_OFFER_SCORE`, `SEND_NOTIFICATION`, `ADJUST_FEED_WEIGHT`, `QUEUE_FOR_REVIEW`.
- **Safety Mechanism**: Sensitive changes (like price alerts or commercial data) will be queued for manual review if they exceed a specific risk threshold.

## Verification Plan
- **Manual QA**:
  - Trigger a price change and verify the `automation_logs` record the score recalculation.
  - Test the "Pending Integration" badge visibility for marketplace rules.
- **Automated Audit**:
  - Run Playwright tests to confirm `/admin/automations` is accessible and functional for owners.
