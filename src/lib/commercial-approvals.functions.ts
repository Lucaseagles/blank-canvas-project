import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireOwnerRole } from "./auth-guards.server";

export const getCommercialApprovalsAdmin = createServerFn({ method: "GET" })
  .middleware([requireOwnerRole])
  .handler(async () => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await (supabaseAdmin as any)
      .from("commercial_profiles")
      .select("id,user_id,audience,partner_type,display_name,business_name,instagram_handle,status,created_at,updated_at")
      .in("audience", ["merchant", "partner"])
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) throw error;
    return data ?? [];
  });

export const decideCommercialApprovalAdmin = createServerFn({ method: "POST" })
  .middleware([requireOwnerRole])
  .validator((input: unknown) => z.object({
    id: z.string().uuid(),
    decision: z.enum(["approved", "rejected"]),
  }).parse(input))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: updated, error } = await (supabaseAdmin as any)
      .from("commercial_profiles")
      .update({ status: data.decision })
      .eq("id", data.id)
      .eq("status", "pending")
      .in("audience", ["merchant", "partner"])
      .select("id,status")
      .maybeSingle();
    if (error) throw error;
    if (!updated) throw new Error("Solicitação não encontrada ou já analisada. Atualize a lista.");
    return { success: true, status: updated.status };
  });
