# Sprint 10 (Part 1/3): Campaign & Traffic Funnel Engine

Unified campaign management to orchestrate marketing efforts across Feed, Push, Telegram, and Referral channels with real-time funnel tracking.

## User Interface

### Admin Dashboard (`/admin/campaigns`)
- **Neural Campaign Manager**: Complete CRUD for campaigns (name, description, duration, status).
- **Channel Orchestration**: Toggle active channels per campaign (Feed Banner, Push, Telegram, Referral Boost).
- **Campaign Duplication**: One-click duplication to replicate successful strategies.
- **Traffic Funnel Visualization**: Real-time conversion metrics (Awareness → Consideration → Conversion).
- **Campaign Comparison**: Side-by-side performance analysis.

### Growth Engine Integration
- **UTM-like Attribution**: Systematic `campaign_id` and `source` tagging for all generated links.
- **Dynamic Banners**: Home banners automatically filter for active campaigns.
- **Channel-Specific Logic**: Integrated campaign context in Push, Telegram, and Referral modules.

## Technical Details

### Database Schema Expansion
- `campaigns`: Core campaign metadata and status.
- `campaign_products`: Product mapping for campaign-specific landing pages and feeds.
- `campaign_channels`: Configuration for multi-channel distribution.
- Updated `analytics_events`: Added `campaign_id` and `utm_source` for funnel aggregation.

### Intelligence Logic
- **Funnel Aggregator**: SQL-optimized views for calculating conversion rates per campaign/channel.
- **State Machine**: Automatic campaign activation/deactivation based on `starts_at` and `ends_at` timestamps.
- **Referral Booster**: Logic to scale referral rewards dynamically during campaign periods.

## Security & Reliability
- **Role Enforcement**: Campaign management restricted to `owner`.
- **Validation Layers**: Strict Zod validation for campaign periods and product assignments.
- **Non-Breaking Sync**: Safe integration with existing Sprint 6/8/9 features.
