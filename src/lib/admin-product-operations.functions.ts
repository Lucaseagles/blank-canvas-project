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
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: existing, error: readError } = await supabaseAdmin.from("products")
      .select("id,status,title,current_price,category_id,marketplace_id,description,images")
      .in("id", data.ids);
    if (readError) throw readError;
    if ((existing?.length ?? 0) !== data.ids.length) throw new Error("Alguns produtos não foram encontrados. Nenhuma alteração foi feita.");
    if (data.status === "published") {
      const incomplete = (existing ?? []).filter((p) =>
        !p.title?.trim() || p.current_price == null || !Number.isFinite(p.current_price) || p.current_price <= 0 ||
        !p.category_id || !p.marketplace_id || !p.description?.trim() ||
        !Array.isArray(p.images) || p.images.length === 0
      );
      if (incomplete.length) throw new Error(`Existem ${incomplete.length} produtos sem informações obrigatórias. Corrija-os antes de publicar.`);
    }
    const { data: changed, error } = await supabaseAdmin.from("products")
      .update({ status: data.status, updated_at: new Date().toISOString() })
      .in("id", data.ids).select("id");
    if (error) throw error;
    if (changed?.length !== data.ids.length) throw new Error("A atualização não alcançou todos os produtos. Verifique a lista.");
    return { success: true, count: changed.length, status: data.status };
  });
