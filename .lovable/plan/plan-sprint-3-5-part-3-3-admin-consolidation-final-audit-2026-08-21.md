# Plan — Sprint 3.5 (Part 3/3): Admin Consolidation & Final Audit

Implement the final administrative layer, ensuring all 16 routes are functional or have high-quality placeholders, protecting them with role-based security, and performing a cross-app audit.

## Proposed Changes

### 1. Database & Security
- Ensure `categories` table has `parent_id` for hierarchical structure.
- Verify RLS policies on all admin-related tables (`products`, `categories`, `videos`, `marketplaces`, `analytics_events`).
- **GRANT** necessary permissions on all tables to `authenticated` and `service_role`.

### 2. Backend (Server Functions)
- **src/lib/admin.functions.ts**:
  - `getAdminMetrics`: Aggregated counts for Dashboard (Users, Products, Videos, Favorites, Alerts, Outbound Clicks).
  - `getCategoriesAdmin`: Hierarchical category fetch.
  - `saveCategory`: CRUD operation for categories.
  - `deleteCategory`: Deletion with safety checks.

### 3. Frontend — Admin Components
- **src/components/admin/AdminSidebar.tsx**:
  - A dedicated glassmorphism sidebar for `/admin/*` routes.
  - Links to all 16 administrative routes (Dashboard, Products, Videos, Marketplaces, Categories, Integrations, Users, Recommendations, Analytics, Campaigns, Telegram, Notifications, Referrals, Automations, Settings, Offers).
- **src/routes/admin/dashboard.tsx**:
  - KPI cards with real-time data from `getAdminMetrics`.
  - Premium visual style with glass overlays and tech-inspired typography.
- **src/routes/admin/categories.tsx**:
  - Full CRUD interface for category management.
  - Hierarchical display (Parent > Child).
- **src/routes/admin/integrations.tsx**:
  - Marketplace status overview (Connected, Pending, Error).

### 4. Route Shells & Navigation
- Standardize all other admin routes (`/admin/users`, `/admin/analytics`, etc.) with a "Sprint Pipeline" placeholder that matches the design system.
- Update `Navbar` to include a clear entry point to the "Command Center" for `owner` roles.

### 5. Final Audit
- Cross-route consistency check (Typography, Colors, Spacing).
- Mobile responsiveness audit for all new pages.
- Broken link scan across the entire app.

## Technical Details

- **Admin Protection**: Use a path-based layout or global guard in `__root.tsx` (or a specific `admin.tsx` layout route if refactored) to ensure only users with `has_role(auth.uid(), 'owner')` can access `/admin/*`.
- **Performance**: Use TanStack Query's `useSuspenseQuery` for dashboard metrics to ensure smooth loading states.
- **Visuals**: Utilize `oklch` tokens and `bg-glass` utilities consistently.

## User Review Required

> [!IMPORTANT]
> - Do you want a dedicated Sidebar for the Admin area, or should we keep the global Navbar with an expanded dropdown?
> - Are there any specific KPIs beyond the 6 mentioned (Users, Products, Videos, Favorites, Alerts, Clicks) that you want on the Dashboard?
