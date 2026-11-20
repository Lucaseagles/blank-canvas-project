import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireOwnerRole } from "@/lib/auth-guards.server";

const productSchema = z.object({
  title: z.string().trim().min(1).max(300),
  description: z.string().max(10000).nullable(),
  category_id: z.string().uuid().nullable(),
  marketplace_id: z.string().uuid().nullable(),
  external_product_id: z.string().max(200).nullable(),
  affiliate_url: z.string().url().refine((value) => {
    try { const url = new URL(value); return url.protocol === "https:" && !url.username && !url.password; }
    catch { return false; }
  }, "O link de afiliado deve usar HTTPS sem credenciais."),
  current_price: z.number().finite().positive().max(10_000_000),
  previous_price: z.number().finite().min(0).max(10_000_000).nullable(),
  discount: z.number().finite().min(0).max(100).nullable(),
  rating: z.number().finite().min(0).max(5).nullable(),
  review_count: z.number().int().min(0).nullable(),
  free_shipping: z.boolean(),
  status: z.enum(["draft", "published", "archived", "active"]),
  images: z.array(z.string().url().max(2000)).max(30),
});

export const saveCatalogProduct = createServerFn({ method: "POST" })
  .middleware([requireOwnerRole])
  .inputValidator((input) => z.object({ id: z.string().uuid().nullable(), product: productSchema }).parse(input))
  .handler(async ({ data, context }) => {
    if (data.product.status === "published" && (
      !data.product.category_id || !data.product.marketplace_id ||
      !data.product.description?.trim() || data.product.images.length === 0
    )) throw new Error("Produto publicado precisa de categoria, marketplace, descrição e imagem.");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: saved, error } = await (supabaseAdmin as any).rpc("rubi_manage_catalog_product_audited", {
      p_action: "save", p_product_id: data.id, p_payload: data.product, p_actor: context.userId,
    });
    if (error) throw new Error(error.message);
    if (!saved?.id) throw new Error("A operação não retornou o produto salvo.");
    return saved;
  });

export const duplicateCatalogProduct = createServerFn({ method: "POST" })
  .middleware([requireOwnerRole])
  .inputValidator((input) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: duplicated, error } = await (supabaseAdmin as any).rpc("rubi_manage_catalog_product_audited", {
      p_action: "duplicate", p_product_id: data.id, p_payload: {}, p_actor: context.userId,
    });
    if (error) throw new Error(error.message);
    if (!duplicated?.id || duplicated.status !== "draft") throw new Error("A cópia não foi criada como rascunho.");
    return duplicated;
  });
