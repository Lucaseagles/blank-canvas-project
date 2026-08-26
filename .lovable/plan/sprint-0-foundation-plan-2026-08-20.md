# Sprint 0 Foundation Plan

Establish the technical foundation for the Affiliate Commerce platform.

## Proposed Changes

### 1. Project Audit
- Confirmed project is currently a fresh template with shadcn components.
- No database tables or auth configured yet.
- Plan is to build the foundation from zero as per the Sprint 0 document.

### 2. Backend (Lovable Cloud)
- Enable Lovable Cloud.
- Create core tables: `profiles`, `user_preferences`, `categories`, `marketplaces`, `products`, `videos`, `analytics_events`.
- Implement user roles system with `user_roles` table and `has_role` function.
- Configure RLS policies and grants.

### 3. Frontend Architecture
- Set up a clean Design System in `src/styles.css`.
- Implement layout shells: `MainLayout` for public routes, `AdminLayout` for protected routes.
- Create route skeleton files for all 30+ requested paths.
- Build core UI components: `ProductCard`, `VideoCard`, `OfferCard` with skeletons.
- Configure `__root.tsx` with common head metadata.

### 4. Auth & Security
- Implement Login/Register/Recovery flows.
- Add middleware to protect `/admin/*` routes.

## Technical Details
- **Stack:** React 19, TanStack Start v1, Tailwind CSS v4, Lovable Cloud (Supabase).
- **Security:** RLS on all tables, `owner` role validation on client/server.
- **Mock Interfaces:** TypeScript interfaces for `RecommendationEngine`, `OfferEngine`, and `MarketplaceConnectors`.

## User Review Required
- Do you have a preferred primary color for the "premium/technological" identity? (e.g., Slate, Zinc, or a specific brand color?)
- Should we use any specific icon library (Lucide is default)?
