# Sprint 8 — Admin Command Center: Real Dashboard KPIs & Charts

Upgrade the `/admin/dashboard` from basic counters to a professional **Command Center** with real-time analytics, time-series charts, and engagement funnels using data from `analytics_events`.

## User details
- **Role**: Admin/Operator
- **View**: `/admin/dashboard`

## Technical details
- **Data Source**: `analytics_events`, `profiles`, `products`, `videos`, `favorites`, `price_alerts`, `marketplaces`.
- **Logic**: All aggregations performed server-side via `createServerFn` using `supabaseAdmin`.
- **Frontend**: `recharts` for visualization, Tailwind v4 for glassmorphism layout.
- **Filtering**: Global period filter (7d/30d/90d) passed to server functions.

## Implementation Plan

### 1. Backend: Analytics Aggregation Functions
- Update `src/lib/admin.functions.ts` to include:
    - `getAdminDashboardData`: Main function accepting a `days` param.
    - Fetch time-series data for clicks and user growth.
    - Aggregate top products and categories by event count.
    - Calculate funnel metrics (views -> favorites -> clicks).
    - Map clicks to marketplaces via product relations.

### 2. Frontend: Dashboard Layout & Filters
- Overhaul `src/routes/admin/dashboard.tsx`:
    - Add a `Select` period filter (7, 30, 90 days).
    - Implement a `Grid` layout for charts using `Card` components.
    - Use `Skeleton` loaders for a premium feel during data fetching.

### 3. Frontend: Visualization Components
- **KPI Cards**: Number + Percentage change vs previous period (if possible).
- **Line Chart**: Outbound Clicks vs User Growth over time.
- **Bar Chart**: Top 10 performing products.
- **Pie Chart**: Marketplace distribution (Shopee vs others).
- **Funnel Visual**: Percentage conversion between engagement layers.

### 4. Transparency Layer
- Add a visually distinct "Future Integrations" section (Info Banner).
- Explicitly label "Commission", "Revenue", and "Real-time Stock" as "Waiting for API Integration".

### 5. Verification
- Validate queries against manual `analytics_events` counts.
- Ensure proper handling of "Empty State" for new installations.
