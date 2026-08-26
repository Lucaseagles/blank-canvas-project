# Plan: Sprint 11 (Part 2/2) — Admin Mobile-Friendly & Final Button Sweep

Implement responsive admin navigation, adaptive tables/forms, and conduct a comprehensive functionality audit of all clickable elements.

## User Review Required

> [!IMPORTANT]
> - The admin sidebar will be replaced by a collapsible drawer on mobile.
> - Admin tables will transform into vertical card stacks on small screens.
> - The "Neural Dashboard" charts will be optimized for small viewports.

## Proposed Changes

### 1. Responsive Admin Navigation
- Modify `AdminSidebar.tsx` to handle responsive behavior.
- Use `Sheet` or `Drawer` component for the mobile sidebar.
- Ensure the admin layout adapts correctly on mobile.

### 2. Mobile-Friendly Admin Interfaces
- **Tables**: Update `/admin/products`, `/admin/marketplaces`, `/admin/videos`, and `/admin/categories` to stack data on mobile.
- **Charts**: Adjust `ResponsiveContainer` and axes in `/admin/dashboard` and `/admin/campaigns` for mobile.
- **Forms**: Refine admin dialogs and forms to be fully accessible on mobile devices.

### 3. Final Functionality Audit & Sweep
- Verify all interactive elements: favorites, alerts, shares, filters, search, and navigation.
- Audit all admin controls: CRUD operations, sync buttons, telegram triggers, and compliance checks.
- Fix any identified "dead" buttons or UX regressions.

## Technical Details

- **Responsive Sidebar**: Use a mobile-first approach. Add a hamburger menu in the admin header (to be added) that triggers the `Sheet`.
- **Adaptive Tables**: Implement a CSS-based or conditional rendering strategy to switch between `Table` and a card-based view (`grid-cols-1`).
- **Safe Area Insets**: Leverage the `pb-safe` and `pt-safe` classes established in Part 1.
- **Form UX**: Ensure inputs use `type="email"`, `type="tel"`, etc., for better mobile keyboards.

## Verification Plan

- **Automated Tests**: Run Playwright scripts targeting all 16 admin routes at mobile viewports.
- **Manual Verification**: Physical sweep of every button in the "WHAT MUST BE BUILT" list (Section 2).
- **Audit Log**: Document the status of every button and any fixes applied.
