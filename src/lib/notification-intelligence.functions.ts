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
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: changed, error } = await (supabaseAdmin as any).rpc("rubi_update_notification_template_audited", {
      p_template_id: data.id, p_template: data.template,
      p_active: data.is_active, p_actor: context.userId,
    });
    if (error) throw new Error(error.message);
    if (!changed?.id) throw new Error("Template e auditoria não registrados.");
    return changed as { id: string; type: string; template: string; is_active: boolean; updated_at: string };
  });
