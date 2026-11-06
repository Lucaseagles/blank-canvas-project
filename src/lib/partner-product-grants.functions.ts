import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireOwnerRole } from "./auth-guards.server";

export const getPartnerProductGrantsAdmin = createServerFn({ method: "GET" })
  .middleware([requireOwnerRole])
  .handler(async () => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const [profiles, products, grants] = await Promise.all([
      (supabaseAdmin as any).from("commercial_profiles").select("id,display_name,partner_type,status").eq("audience", "partner").order("created_at", { ascending: false }).limit(200),
      (supabaseAdmin as any).from("hub_products").select("id,title,active,retail_price,hub_suppliers(active)").order("title").limit(200),
      (supabaseAdmin as any).from("hub_partner_product_grants").select("id,commercial_profile_id,product_id,active").limit(1000),
    ]);
    if (profiles.error) throw profiles.error;
    if (products.error) throw products.error;
    if (grants.error) throw grants.error;
    return { profiles: profiles.data ?? [], products: products.data ?? [], grants: grants.data ?? [] };
  });

export const setPartnerProductGrantAdmin = createServerFn({ method: "POST" })
  .middleware([requireOwnerRole])
  .validator((input: unknown) => z.object({
    commercial_profile_id: z.string().uuid(),
    product_id: z.string().uuid(),
    active: z.boolean(),
  }).parse(input))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const [profileResult, productResult] = await Promise.all([
      (supabaseAdmin as any).from("commercial_profiles").select("id,status").eq("id", data.commercial_profile_id).eq("audience", "partner").maybeSingle(),
      (supabaseAdmin as any).from("hub_products").select("id,active,retail_price,hub_suppliers!inner(active)").eq("id", data.product_id).maybeSingle(),
    ]);
    if (profileResult.error) throw profileResult.error;
    if (productResult.error) throw productResult.error;
    if (!profileResult.data) throw new Error("Parceiro não encontrado.");
    if (data.active && profileResult.data.status !== "approved") throw new Error("Apenas parceiros aprovados podem receber produtos.");
    if (!productResult.data) throw new Error("Produto não encontrado.");
    if (data.active && !productResult.data.active) throw new Error("Não é possível autorizar produto não publicado.");
    if (data.active && !(Number(productResult.data.retail_price) > 0)) throw new Error("Configure preço de varejo válido antes de autorizar o produto.");
    if (data.active && !productResult.data.hub_suppliers?.active) throw new Error("Fornecedor inativo. Ative-o antes de autorizar o produto.");
    const { error } = await (supabaseAdmin as any).from("hub_partner_product_grants")
      .upsert(data, { onConflict: "commercial_profile_id,product_id" });
    if (error) throw error;
    return { success: true };
  });
