import { createServerFn } from "@tanstack/react-start";
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
      .from("hub_products").select("id").eq("id", input.productId).eq("active", true).gt("retail_price", 0).maybeSingle();
    if (productError) throw productError;
    if (!product) throw new Error("Produto indisponível.");
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
    const { data: links, error: linksError } = await (supabaseAdmin as any)
      .from("hub_partner_referral_links").select("product_id,code,active")
      .eq("commercial_profile_id", profile.id).eq("active", true).limit(200);
    if (linksError) throw linksError;
    if (!links?.length) return [];
    // Revoking a product grant must also remove its referral link from the portal.
    const { data: grants, error: grantsError } = await (supabaseAdmin as any)
      .from("hub_partner_product_grants").select("product_id")
      .eq("commercial_profile_id", profile.id).eq("active", true).limit(200);
    if (grantsError) throw grantsError;
    const allowedIds = new Set((grants ?? []).map((grant: { product_id: string }) => grant.product_id));
    const { data: products, error: productsError } = await (supabaseAdmin as any)
      .from("hub_products").select("id").in("id", [...allowedIds])
      .eq("active", true).gt("retail_price", 0);
    if (productsError) throw productsError;
    const publishedIds = new Set((products ?? []).map((product: { id: string }) => product.id));
    return links.filter((link: { product_id: string }) => publishedIds.has(link.product_id));
  });
