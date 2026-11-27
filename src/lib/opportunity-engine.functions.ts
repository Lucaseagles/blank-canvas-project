import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireOwnerRole } from "@/lib/auth-guards.server";

const statusSchema = z.enum(["open", "dismissed", "actioned"]);

export type OpportunityAlert = {
  id: string;
  opportunity_type: string;
  title: string;
  recommended_action: string;
  score: number;
  priority: number;
  reasons: string[];
  updated_at: string;
};

async function db() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin as any;
}

export const getOpportunityAlerts = createServerFn({ method: "GET" })
  .middleware([requireOwnerRole])
  .inputValidator((data: unknown) => z.object({ status: statusSchema.default("open") }).parse(data ?? {}))
  .handler(async ({ data }): Promise<OpportunityAlert[]> => {
    const supabase = await db();
    const { data: rows, error } = await supabase.rpc("get_opportunity_alerts", { p_status: data.status });
    if (error) throw error;
    return (rows ?? []) as OpportunityAlert[];
  });

export const refreshOpportunityAlerts = createServerFn({ method: "POST" })
  .middleware([requireOwnerRole])
  .handler(async () => {
    const supabase = await db();
    const { data, error } = await supabase.rpc("refresh_opportunity_alerts");
    if (error) throw error;
    return { count: Number(data ?? 0) };
  });

export const updateOpportunityAlertStatus = createServerFn({ method: "POST" })
  .middleware([requireOwnerRole])
  .inputValidator((data: unknown) => z.object({ id: z.string().uuid(), expectedUpdatedAt: z.string().datetime({ offset: true }), status: statusSchema }).parse(data))
  .handler(async ({ data, context }) => {
    const supabase = await db();
    const { data: updated, error } = await supabase.rpc("rubi_update_opportunity_alert_status_audited", {
      p_id: data.id,
      p_expected_updated_at: data.expectedUpdatedAt,
      p_status: data.status,
      p_actor: context.userId,
    });
    if (error) throw new Error(error.message);
    if (!updated?.id) throw new Error("Oportunidade não atualizada.");
    return { updated: true, updatedAt: updated.updated_at };
  });
