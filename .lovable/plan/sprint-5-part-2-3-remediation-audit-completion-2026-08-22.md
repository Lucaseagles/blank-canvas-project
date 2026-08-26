# Sprint 5 (Part 2/3) — Remediation & Audit Completion

This phase focuses on closing the gaps identified in the Sprint 0-4 audit, ensuring all features are functional and data-ready before the final phase.

## Remediation Targets

1.  **Activity Simulation (Engagement Data)**
    *   Extend `src/seed-activity.ts` to include `price_alerts` and `notifications`.
    *   Execute seeding to populate the User Vault (Favorites, Alerts, History).
2.  **Visual Consistency (Vault Routes)**
    *   Apply premium glass system to `/favorites`, `/alerts`, and `/profile`.
3.  **Admin Pipeline Preparation**
    *   Implement basic list views for `/admin/users` and `/admin/analytics` to move them from "Pipeline Placeholder" to "Functional Draft".
4.  **Security Audit Finalization**
    *   Verify RLS policies for all user-facing tables against the `authenticated` role.
    *   Fix the `SECURITY DEFINER` linter warnings by restricting `EXECUTE` permissions.

## Technical Details

*   **Database**: SQL migrations for RLS hardening and permission revokes on internal functions.
*   **Analytics**: Ensure `trackEvent` is properly firing from all UI interactions (Products, Clicks, Admin).
*   **UI**: Standardizing `Badge` and `Card` variants across the private member area.

## Steps

1.  **Seeding Completion**: Run the extended activity simulator.
2.  **Security Hardening**: Deploy SQL migration to fix linter warnings and tighten RLS.
3.  **Admin Expansion**: Create functional list routes for Users and Analytics dashboards.
4.  **Final Verification**: Audit the entire checklist one last time.
