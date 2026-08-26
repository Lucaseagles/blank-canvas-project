import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { createMiddleware } from "@tanstack/react-start";

const OWNER_EMAIL = "eaglesfr49@gmail.com";

/**
 * Server-side owner gate. Role membership remains the primary authorization
 * mechanism, while the configured owner email provides the explicit single-
 * owner invariant required by the V1 security contract.
 */
export const requireOwnerRole = createMiddleware({ type: "function" })
  .middleware([requireSupabaseAuth])
  .server(async ({ next, context }) => {
    const email = context.userEmail?.toLowerCase() ?? null;

    if (email !== OWNER_EMAIL) {
      console.error("Access denied: user is not the configured owner", {
        userId: context.userId,
        email,
      });
      throw new Error("Unauthorized: Owner access required");
    }

    const { data: hasRole, error } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "owner",
    });

    if (error || !hasRole) {
      console.error("Access denied: configured owner is missing owner role", {
        userId: context.userId,
        email,
        error,
      });
      throw new Error("Unauthorized: Owner role required");
    }

    return next();
  });