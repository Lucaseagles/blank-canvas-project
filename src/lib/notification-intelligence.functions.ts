import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireOwnerRole } from "./auth-guards.server";

export const getNotificationIntelligence = createServerFn({ method: "GET" })
  .middleware([requireOwnerRole])
  .handler(async () => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await (supabaseAdmin as any).rpc("get_notification_intelligence");
    if (error) throw error;
    return data ?? {};
  });

export const updateNotificationTemplateAdmin = createServerFn({ method: "POST" })
  .middleware([requireOwnerRole])
  .inputValidator((data: unknown) => z.object({ id: z.string().uuid(), template: z.string().trim().min(1).max(5000), is_active: z.boolean() }).parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row, error } = await (supabaseAdmin as any).from("notification_templates").update({ template: data.template, is_active: data.is_active, updated_at: new Date().toISOString() }).eq("id", data.id).select("id,type,template,is_active,updated_at").single();
    if (error) throw error;
    return row;
  });
