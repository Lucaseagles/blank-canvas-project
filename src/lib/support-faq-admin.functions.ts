import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireOwnerRole } from "./auth-guards.server";

const faqPayload = z.object({
  question: z.string().trim().min(1).max(300),
  answer: z.string().trim().min(1).max(3000),
  keywords: z.array(z.string().trim().min(1).max(80)).max(40),
  priority: z.number().int().min(0).max(100000),
  is_active: z.boolean(),
});
const mutationInput = z.discriminatedUnion("action", [
  z.object({ action: z.literal("create"), payload: faqPayload }),
  z.object({ action: z.literal("update"), id: z.string().uuid(), expectedUpdatedAt: z.string().datetime({ offset: true }), payload: faqPayload }),
  z.object({ action: z.literal("toggle"), id: z.string().uuid(), expectedUpdatedAt: z.string().datetime({ offset: true }), isActive: z.boolean() }),
  z.object({ action: z.literal("delete"), id: z.string().uuid(), expectedUpdatedAt: z.string().datetime({ offset: true }) }),
]);

export const getAdminSupportFaq = createServerFn({ method: "GET" })
  .middleware([requireOwnerRole])
  .handler(async () => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await (supabaseAdmin as any).from("support_faq")
      .select("id,question,answer,keywords,priority,is_active,created_at,updated_at")
      .order("priority", { ascending: false })
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const manageAdminSupportFaq = createServerFn({ method: "POST" })
  .middleware([requireOwnerRole])
  .validator((input: unknown) => mutationInput.parse(input))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const payload = data.action === "create" || data.action === "update"
      ? data.payload
      : data.action === "toggle" ? { is_active: data.isActive } : {};
    const { data: result, error } = await (supabaseAdmin as any).rpc("rubi_manage_support_faq_audited", {
      p_action: data.action,
      p_id: "id" in data ? data.id : null,
      p_payload: payload,
      p_actor: context.userId,
      p_expected_updated_at: "expectedUpdatedAt" in data ? data.expectedUpdatedAt : null,
    });
    if (error) throw new Error(error.message);
    if (!result?.id) throw new Error("A alteração e sua auditoria não foram confirmadas.");
    return result;
  });
