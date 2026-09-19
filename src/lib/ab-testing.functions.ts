import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { requireOwnerRole } from "./auth-guards.server";

const variantSchema = z.object({ experimentId: z.string().uuid() });

export const getAbVariantServer = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => variantSchema.parse(data))
  .handler(async ({ data, context }) => {
    const db = context.supabase as any;
    const { data: existing, error: existingError } = await db
      .from("ab_assignments").select("variant")
      .eq("experiment_id", data.experimentId).eq("user_id", context.userId).maybeSingle();
    if (existingError) throw existingError;
    if (existing?.variant === "A" || existing?.variant === "B") return existing.variant as "A" | "B";

    const { data: experiment, error: experimentError } = await db
      .from("ab_experiments").select("variant_a,variant_b,is_active")
      .eq("id", data.experimentId).maybeSingle();
    if (experimentError) throw experimentError;
    if (!experiment?.is_active) return null;

    const variant = Array.from(data.experimentId + context.userId).reduce(
      (n: number, c: string) => (n * 31 + c.charCodeAt(0)) >>> 0, 7,
    ) % 2 === 0 ? "A" : "B";

    const { error: insertError } = await db.from("ab_assignments").insert({
      experiment_id: data.experimentId, user_id: context.userId, variant,
    });
    if (!insertError) return variant as "A" | "B";

    const { data: persisted, error: persistedError } = await db
      .from("ab_assignments").select("variant")
      .eq("experiment_id", data.experimentId).eq("user_id", context.userId).maybeSingle();
    if (persistedError) throw persistedError;
    return persisted?.variant === "A" || persisted?.variant === "B" ? persisted.variant : null;
  });

export const getAdminAbExperimentResult = createServerFn({ method: "GET" })
  .middleware([requireOwnerRole])
  .inputValidator((data: unknown) => variantSchema.parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: result, error } = await (supabaseAdmin as any).rpc("get_ab_experiment_result", {
      p_experiment_id: data.experimentId,
    });
    if (error) throw error;
    return result;
  });
