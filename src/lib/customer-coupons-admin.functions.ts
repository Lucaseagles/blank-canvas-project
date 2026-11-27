import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireOwnerRole } from "./auth-guards.server";

const couponPayload = z.object({
  code: z.string().trim().min(1).max(120),
  description: z.string().nullable(),
  discount_type: z.enum(["percentage", "fixed"]),
  discount_value: z.number().finite().positive(),
  valid_from: z.string().datetime({ offset: true }),
  valid_until: z.string().datetime({ offset: true }).nullable(),
  marketplace_id: z.string().uuid(),
  product_id: z.string().uuid().nullable(),
  category_id: z.string().uuid().nullable(),
  is_active: z.boolean(),
  max_uses: z.number().int().positive().nullable(),
});

const mutationInput = z.discriminatedUnion("action", [
  z.object({ action: z.literal("create"), payload: couponPayload }),
  z.object({ action: z.literal("update"), id: z.string().uuid(), expectedUpdatedAt: z.string().datetime({ offset: true }), payload: couponPayload }),
  z.object({ action: z.literal("toggle"), id: z.string().uuid(), expectedUpdatedAt: z.string().datetime({ offset: true }), isActive: z.boolean() }),
  z.object({ action: z.literal("delete"), id: z.string().uuid(), expectedUpdatedAt: z.string().datetime({ offset: true }) }),
]);

export const manageCustomerCouponAdmin = createServerFn({ method: "POST" })
  .middleware([requireOwnerRole])
  .validator((input: unknown) => mutationInput.parse(input))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const payload = data.action === "create" || data.action === "update"
      ? data.payload
      : data.action === "toggle" ? { is_active: data.isActive } : {};
    const { data: result, error } = await (supabaseAdmin as any).rpc("rubi_manage_customer_coupon_audited", {
      p_action: data.action,
      p_id: "id" in data ? data.id : null,
      p_payload: payload,
      p_actor: context.userId,
      p_expected_updated_at: "expectedUpdatedAt" in data ? data.expectedUpdatedAt : null,
    });
    if (error) throw error;
    if (!result?.id) throw new Error("A alteração do cupom não foi confirmada.");
    return result;
  });
