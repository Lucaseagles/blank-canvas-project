import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { fetchAllFinancialRows, fetchFinancialRowsByIds } from "./financial-pagination.server";
import { approvedRubiCheckout } from "./rubi-checkout-validation";

/**
 * Public, read-only partner storefront. Exposes only approved commercial
 * profile fields and currently granted products with active, verified checkout.
 * Checkout URLs and internal profile/grant identifiers never leave the server.
 */
export const getPublicRubiPartnerStorefront = createServerFn({ method: "GET" })
  .validator((input: unknown) => z.object({
    storeCode: z.string().regex(/^[a-f0-9]{12}$/),
  }).parse(input))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: profile, error: profileError } = await (supabaseAdmin as any)
      .from("commercial_profiles")
      .select("id,display_name,partner_type,status,public_store_code")
      .eq("public_store_code", data.storeCode)
      .eq("audience", "partner")
      .eq("status", "approved")
      .maybeSingle();
    if (profileError) throw profileError;
    if (!profile) return null;

    const [grants, links] = await Promise.all([
      fetchAllFinancialRows(() => (supabaseAdmin as any)
        .from("hub_partner_product_grants")
        .select("product_id")
        .eq("commercial_profile_id", profile.id)
        .eq("active", true)
        .order("product_id", { ascending: true })),
      fetchAllFinancialRows(() => (supabaseAdmin as any)
        .from("hub_partner_referral_links")
        .select("id,product_id,code")
        .eq("commercial_profile_id", profile.id)
        .eq("active", true)
        .order("id", { ascending: true })),
    ]);
    const grantedIds = new Set((grants ?? []).map((grant: { product_id: string }) => grant.product_id));
    const eligibleLinks = (links ?? []).filter((link: { product_id: string }) => grantedIds.has(link.product_id));
    if (!eligibleLinks.length) {
      return {
        storeCode: profile.public_store_code as string,
        displayName: profile.display_name as string,
        partnerType: profile.partner_type as string | null,
        products: [],
      };
    }

    const productIds = [...new Set(eligibleLinks.map((link: { product_id: string }) => link.product_id))];
    const products = await fetchFinancialRowsByIds(productIds, (ids) => (supabaseAdmin as any)
      .from("hub_products")
      .select("id,title,description,image_url,category,retail_price,checkout_url,checkout_verified,active,hub_suppliers!inner(active,checkout_host)")
      .in("id", ids)
      .eq("active", true)
      .eq("hub_suppliers.active", true)
      .gt("retail_price", 0)
      .order("id", { ascending: true }));

    const productById = new Map<string, any>(
      (products ?? [])
        .filter((product: any) => approvedRubiCheckout(product))
        .map((product: any) => [product.id, product]),
    );
    const storefrontProducts = eligibleLinks.flatMap((link: { product_id: string; code: string }) => {
      const product = productById.get(link.product_id);
      if (!product) return [];
      return [{
        id: product.id as string,
        title: product.title as string,
        description: product.description as string | null,
        imageUrl: product.image_url as string | null,
        category: product.category as string | null,
        retailPrice: Number(product.retail_price),
        referralCode: link.code as string,
      }];
    });

    return {
      storeCode: profile.public_store_code as string,
      displayName: profile.display_name as string,
      partnerType: profile.partner_type as string | null,
      products: storefrontProducts,
    };
  });
