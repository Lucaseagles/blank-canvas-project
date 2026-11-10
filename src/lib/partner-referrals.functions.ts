import { fetchAllFinancialRows, fetchFinancialRowsByIds } from "./financial-pagination.server";
import { createServerFn } from "@tanstack/react-start";
import { approvedRubiCheckout } from "./rubi-checkout-validation";
import { z } from "zod";

export const createMyPartnerReferralLink = createServerFn({ method: "POST" })
  .validator((input: unknown) => z.object({ accessToken: z.string().min(1), productId: z.string().uuid() }).parse(input))
  .handler(async ({ data: input }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: verified, error: authError } = await supabaseAdmin.auth.getUser(input.accessToken);
    const userId = verified.user?.id;
    if (authError || !userId) throw new Error("Sessão inválida.");
    const { data: profile, error: profileError } = await (supabaseAdmin as any)
      .from("commercial_profiles").select("id").eq("user_id", userId)
      .eq("audience", "partner").eq("status", "approved").maybeSingle();
    if (profileError) throw profileError;
    if (!profile) throw new Error("Apenas parceiros aprovados podem gerar links.");
    const { data: grant, error: grantError } = await (supabaseAdmin as any)
      .from("hub_partner_product_grants").select("id")
      .eq("commercial_profile_id", profile.id).eq("product_id", input.productId)
      .eq("active", true).maybeSingle();
    if (grantError) throw grantError;
    if (!grant) throw new Error("Produto não autorizado para este parceiro.");
    const { data: product, error: productError } = await (supabaseAdmin as any)
      .from("hub_products").select("id,checkout_url,checkout_verified,hub_suppliers!inner(active,checkout_host)").eq("id", input.productId).eq("hub_suppliers.active", true).eq("active", true).gt("retail_price", 0).maybeSingle();
    if (productError) throw productError;
    if (!product || !approvedRubiCheckout(product as any)) throw new Error("Produto sem checkout aprovado para divulgação.");
    const { data: link, error: linkError } = await (supabaseAdmin as any)
      .from("hub_partner_referral_links")
      .upsert({ commercial_profile_id: profile.id, product_id: input.productId, active: true },
        { onConflict: "commercial_profile_id,product_id", ignoreDuplicates: true })
      .select("code").maybeSingle();
    if (linkError) throw linkError;
    if (link?.code) return { code: link.code as string };
    const { data: existing, error: existingError } = await (supabaseAdmin as any)
      .from("hub_partner_referral_links").select("code,active")
      .eq("commercial_profile_id", profile.id).eq("product_id", input.productId).single();
    if (existingError) throw existingError;
    if (!existing.active) throw new Error("Link desativado. Solicite liberação ao administrador.");
    return { code: existing.code as string };
  });

export const getMyPartnerReferralLinks = createServerFn({ method: "POST" })
  .validator((input: unknown) => z.object({ accessToken: z.string().min(1) }).parse(input))
  .handler(async ({ data: input }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: verified, error: authError } = await supabaseAdmin.auth.getUser(input.accessToken);
    const userId = verified.user?.id;
    if (authError || !userId) throw new Error("Sessão inválida.");
    const { data: profile, error: profileError } = await (supabaseAdmin as any)
      .from("commercial_profiles").select("id").eq("user_id", userId)
      .eq("audience", "partner").eq("status", "approved").maybeSingle();
    if (profileError) throw profileError;
    if (!profile) return [];
    const links = await fetchAllFinancialRows(() => (supabaseAdmin as any)
      .from("hub_partner_referral_links").select("product_id,code,active")
      .eq("commercial_profile_id", profile.id).eq("active", true).order("code", { ascending: true }));
    if (!links?.length) return [];
    // Revoking a product grant must also remove its referral link from the portal.
    const grants = await fetchAllFinancialRows(() => (supabaseAdmin as any)
      .from("hub_partner_product_grants").select("product_id")
      .eq("commercial_profile_id", profile.id).eq("active", true).order("product_id", { ascending: true }));
    const allowedIds = new Set((grants ?? []).map((grant: { product_id: string }) => grant.product_id));
    const products = allowedIds.size ? await fetchFinancialRowsByIds([...allowedIds], (batchIds) => (supabaseAdmin as any)
      .from("hub_products").select("id,checkout_url,checkout_verified,hub_suppliers!inner(active,checkout_host)").in("id", batchIds)
      .eq("hub_suppliers.active", true).eq("active", true).gt("retail_price", 0).order("id", { ascending: true })) : [];
    const publishedIds = new Set((products ?? []).filter((product: any) => approvedRubiCheckout(product)).map((product: { id: string }) => product.id));
    return links.filter((link: { product_id: string }) => publishedIds.has(link.product_id));
  });
