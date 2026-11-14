import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireOwnerRole } from "@/lib/auth-guards.server";

const uuid = z.string().uuid();
const inlineSchema = z.discriminatedUnion("field", [
  z.object({ id: uuid, field: z.literal("current_price"), value: z.number().finite().positive() }),
  z.object({ id: uuid, field: z.literal("category_id"), value: uuid }),
]);

export const updateProductInline = createServerFn({ method: "POST" })
  .middleware([requireOwnerRole])
  .inputValidator((input) => inlineSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: updated, error } = await (supabaseAdmin as any).rpc("rubi_update_product_inline_audited", {
      p_product_id: data.id,
      p_field: data.field,
      p_value: data.field === "current_price" ? String(data.value) : data.value,
      p_actor: context.userId,
    });
    if (error) throw new Error(error.message);
    return updated as { id: string; current_price: number; category_id: string | null };
  });

const bulkSchema = z.object({
  ids: z.array(uuid).min(1).max(100).refine((ids) => new Set(ids).size === ids.length, "Produtos duplicados na seleção."),
  status: z.enum(["published", "draft", "archived"]),
});

export const bulkSetProductStatus = createServerFn({ method: "POST" })
  .middleware([requireOwnerRole])
  .inputValidator((input) => bulkSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: updatedCount, error } = await (supabaseAdmin as any).rpc("rubi_bulk_product_status_audited", {
      p_product_ids: data.ids,
      p_status: data.status,
      p_actor: context.userId,
    });
    if (error) throw new Error(error.message);
    if (Number(updatedCount) !== data.ids.length) throw new Error("A alteração em lote não foi concluída integralmente.");
    return { success: true, count: Number(updatedCount), status: data.status };
  });
