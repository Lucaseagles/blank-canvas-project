import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireOwnerRole } from "./auth-guards.server";

const permissionInput = z.object({
  commercial_profile_id: z.string().uuid(),
  product_id: z.string().uuid(),
  active: z.boolean(),
});

// Shadow Master only. The table is deliberately not readable by client roles.
export const getPartnerWholesalePermissionsAdmin = createServerFn({ method: "GET" })
  .middleware([requireOwnerRole])
  .handler(async () => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await (supabaseAdmin as any)
      .from("hub_partner_wholesale_permissions")
      .select("id,commercial_profile_id,product_id,active")
      .limit(1000);
    if (error) throw error;
    return data ?? [];
  });

export const setPartnerWholesalePermissionAdmin = createServerFn({ method: "POST" })
  .middleware([requireOwnerRole])
  .validator((input: unknown) => permissionInput.parse(input))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const [profile, product, grant] = await Promise.all([
      (supabaseAdmin as any).from("commercial_profiles")
        .select("id,status").eq("id", data.commercial_profile_id)
        .eq("audience", "partner").maybeSingle(),
      (supabaseAdmin as any).from("hub_products")
        .select("id,active,b2b_base_price").eq("id", data.product_id).maybeSingle(),
      (supabaseAdmin as any).from("hub_partner_product_grants")
        .select("id").eq("commercial_profile_id", data.commercial_profile_id)
        .eq("product_id", data.product_id).eq("active", true).maybeSingle(),
    ]);
    if (profile.error) throw profile.error;
    if (product.error) throw product.error;
    if (grant.error) throw grant.error;
    if (!profile.data) throw new Error("Parceiro não encontrado.");
    if (!product.data) throw new Error("Produto não encontrado.");
    if (data.active) {
      if (profile.data.status !== "approved") throw new Error("Apenas parceiros aprovados podem divulgar atacado.");
      if (!grant.data) throw new Error("Autorize o produto antes de conceder acesso ao atacado.");
      if (!product.data.active || !(Number(product.data.b2b_base_price) > 0)) {
        throw new Error("O produto deve estar publicado com preço B2B válido.");
      }
    }
    const { error } = await (supabaseAdmin as any)
      .from("hub_partner_wholesale_permissions")
      .upsert(data, { onConflict: "commercial_profile_id,product_id" });
    if (error) throw error;
    return { success: true };
  });

export const getMyPartnerWholesaleOffers = createServerFn({ method: "POST" })
  .validator((input: unknown) => z.object({ accessToken: z.string().min(1) }).parse(input))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: auth, error: authError } = await supabaseAdmin.auth.getUser(data.accessToken);
    const userId = auth.user?.id;
    if (authError || !userId) throw new Error("Sessão inválida.");
    const { data: profile, error: profileError } = await (supabaseAdmin as any)
      .from("commercial_profiles").select("id").eq("user_id", userId)
      .eq("audience", "partner").eq("status", "approved").maybeSingle();
    if (profileError) throw profileError;
    if (!profile) return [];
    const { data: permissions, error: permissionsError } = await (supabaseAdmin as any)
      .from("hub_partner_wholesale_permissions").select("product_id")
      .eq("commercial_profile_id", profile.id).eq("active", true).limit(200);
    if (permissionsError) throw permissionsError;
    const ids = (permissions ?? []).map((p: { product_id: string }) => p.product_id);
    if (!ids.length) return [];
    const { data: grants, error: grantsError } = await (supabaseAdmin as any)
      .from("hub_partner_product_grants").select("product_id")
      .eq("commercial_profile_id", profile.id).eq("active", true).in("product_id", ids);
    if (grantsError) throw grantsError;
    const authorized = (grants ?? []).map((g: { product_id: string }) => g.product_id);
    if (!authorized.length) return [];
    const { data: products, error: productsError } = await (supabaseAdmin as any)
      .from("hub_products")
      .select("id,title,description,image_url,category,b2b_base_price,min_b2b_quantity,hub_b2b_tiers(min_quantity,unit_price)")
      .in("id", authorized).eq("active", true).gt("b2b_base_price", 0)
      .order("title").limit(200);
    if (productsError) throw productsError;
    return products ?? [];
  });
