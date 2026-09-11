import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/server";
import { requireOwnerRole } from "@/lib/auth.middleware";

const statusSchema = z.enum(["open", "dismissed", "actioned"]);

export const getOpportunityAlerts = createServerFn({ method: "GET" })
  .middleware([requireOwnerRole])
  .handler(async ({ data }: { data?: { status?: string | null } }) => {
    const { data: rows, error } = await supabaseAdmin.rpc("get_opportunity_alerts", { p_status: data?.status ?? "open" });
    if (error) throw error;
    return rows ?? [];
  });

export const refreshOpportunityAlerts = createServerFn({ method: "POST" })
  .middleware([requireOwnerRole])
  .handler(async () => {
    const { data, error } = await supabaseAdmin.rpc("refresh_opportunity_alerts");
    if (error) throw error;
    return { count: Number(data ?? 0) };
  });

export const updateOpportunityAlertStatus = createServerFn({ method: "POST" })
  .middleware([requireOwnerRole])
  .validator((data: unknown) => z.object({ id: z.string().uuid(), status: statusSchema }).parse(data))
  .handler(async ({ data }) => {
    const { data: updated, error } = await supabaseAdmin.rpc("update_opportunity_alert_status", { p_id: data.id, p_status: data.status });
    if (error) throw error;
    return Boolean(updated);
  });
