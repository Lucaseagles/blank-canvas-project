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
  .handler(async ({ context }) => {
    const supabase = await db();
    const { data, error } = await supabase.rpc("rubi_refresh_opportunity_alerts_audited", {
      p_actor: context.userId,
    });
    if (error) throw new Error(error.message);
    return { count: Number(data?.count ?? 0), runId: String(data?.run_id ?? "") };
  });

export const updateOpportunityAlertStatus = createServerFn({ method: "POST" })
  .middleware([requireOwnerRole])
  .inputValidator((data: unknown) => z.object({ id: z.string().uuid(), status: statusSchema }).parse(data))
  .handler(async ({ data }) => {
    const supabase = await db();
    const { data: updated, error } = await supabase.rpc("update_opportunity_alert_status", { p_id: data.id, p_status: data.status });
    if (error) throw error;
    return { updated: Boolean(updated) };
  });
