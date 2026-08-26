# Plan: Sprint 13 (Parte 3/3) — Strict Admin Access Hardening

Enforce absolute isolation between the administrative panel and final customers, ensuring only `eaglesfr49@gmail.com` has access.

## 1. Database & Security Audit
- **Check for unique owner**: Verify only `eaglesfr49@gmail.com` has the `owner` role.
- **Revoke unauthorized access**: Remove `owner` role from any other accounts (e.g., `admin@example.com`).
- **Hardened RLS Policies**: Ensure all admin tables (`products`, `marketplaces`, `videos`, `categories`, `campaigns`, `automation_rules`, `compliance_rules`, `offer_groups`, `banners`, `telegram_config`, etc.) have RLS enabled and strictly check `has_role(auth.uid(), 'owner')`.

## 2. Server-Side Protection (Real Security)
- **Implement Admin Middleware**: Create a specialized server middleware `requireOwnerRole` that uses `requireSupabaseAuth` and verifies the user has the `owner` role via the `user_roles` table or `has_role` function.
- **Secure Server Functions**: Apply `requireOwnerRole` to ALL `createServerFn` declarations in:
  - `src/lib/admin_intel.functions.ts`
  - `src/lib/automation.functions.ts`
  - `src/lib/campaigns.functions.ts`
  - `src/lib/compliance.functions.ts`
  - `src/lib/connectors.functions.ts`
  - `src/lib/personalization.functions.ts` (for weights/scoring)

## 3. Client-Side Protection (UX & Layer 1)
- **Route Gate**: Update `src/routes/admin.tsx` (the parent route for all `/admin/*`) to include a loader that checks for the `owner` role and redirects unauthenticated or non-owner users to `/` immediately, preventing "content flash".
- **Navigation Safety**: Audit all components for navigation buttons to ensure they only appear for owners.

## 4. Verification & Testing
- **Penetration Test**: Attempt to access `/admin/dashboard` as a logged-out user and a regular authenticated user.
- **API Test**: Attempt to call an admin `createServerFn` (e.g., `getAdminIntelligenceData`) directly from the console as a regular user.
- **Final Audit**: Confirm zero data leakage in network payloads for regular users.

## Technical Details

### Security Protocol Update
```typescript
// src/lib/auth-guards.server.ts (New)
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { createMiddleware } from "@tanstack/react-start";

export const requireOwnerRole = createMiddleware({ type: "function" })
  .middleware([requireSupabaseAuth])
  .server(async ({ next, context }) => {
    const { data: hasRole } = await context.supabase.rpc('has_role', { 
      _user_id: context.userId, 
      _role: 'owner' 
    });
    
    if (!hasRole) {
      throw new Error("Unauthorized: Owner role required");
    }
    
    return next();
  });
```

### Route Guard Example
```typescript
// src/routes/admin.tsx
export const Route = createFileRoute("/admin")({
  beforeLoad: async ({ context }) => {
     // Initial gate to redirect immediately
     // Verification happens in the loader/server functions
  },
  component: AdminLayout,
});
```
