import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { createMiddleware } from "@tanstack/react-start";

/** Server-side access derived from database role, not mutable email or user metadata. */
export const requireOwnerRole = createMiddleware({ type: "function" })
  .middleware([requireSupabaseAuth])
  .server(async ({ next, context }) => {
    const { data: hasRole, error } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "owner",
    });
    if (error || hasRole !== true) {
      throw new Error("Unauthorized: Owner role required");
    }
    return next();
  });
