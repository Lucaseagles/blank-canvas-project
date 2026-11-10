import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const productSchema = z.object({ productId: z.string().uuid() });
const checkoutSchema = productSchema.extend({ partnerCode: z.string().uuid().optional() });

type PublicProduct = {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  category: string | null;
  retail_price: number;
};

const publicFields = "id,title,description,image_url,category,retail_price,hub_suppliers!inner(active)";

async function getAvailableProduct(productId: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await (supabaseAdmin as any).from("hub_products")
    .select(publicFields).eq("id", productId)
    .eq("active", true).eq("hub_suppliers.active", true)
    .gt("retail_price", 0).maybeSingle();
  if (error) throw error;
  return data;
}

/** Show only other published RUBI products, with an active supplier and consumer price. */
export const getRubiRelatedProducts = createServerFn({ method: "POST" })
  .validator((input: unknown) => productSchema.parse(input))
  .handler(async ({ data }): Promise<PublicProduct[]> => {
    const primary = await getAvailableProduct(data.productId);
    if (!primary) return [];
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const baseQuery = () => (supabaseAdmin as any).from("hub_products")
      .select(publicFields).eq("active", true).eq("hub_suppliers.active", true)
      .gt("retail_price", 0).neq("id", data.productId)
      .order("created_at", { ascending: false });
    const category = typeof primary.category === "string" ? primary.category.trim() : "";
    const first = await (category ? baseQuery().eq("category", category) : baseQuery()).limit(4);
    if (first.error) throw first.error;
    // Prefer the same category; never silently merge results from different offers.
    const rows = first.data ?? [];
    return rows.map(({ hub_suppliers: _supplier, ...item }: any) => item as PublicProduct);
  });

type CheckoutReadiness =
  | { ready: true; destination: string }
  | { ready: false; reason: string };

function getApprovedCheckoutUrl(identifier: string, partner: boolean): string | null {
  // Private deployment configuration only: never take a destination from query parameters.
  const variable = partner
    ? process.env["RUBI_APPROVED_PARTNER_CHECKOUT_URLS_JSON"]
    : process.env["RUBI_APPROVED_CHECKOUT_URLS_JSON"];
  const hosts = (process.env["RUBI_APPROVED_CHECKOUT_HOSTS"] ?? "")
    .split(",").map(value => value.trim().toLowerCase()).filter(Boolean);
  if (!variable || !hosts.length) return null;
  try {
    const parsed: unknown = JSON.parse(variable);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return null;
    const value = (parsed as Record<string, unknown>)[identifier];
    if (typeof value !== "string") return null;
    const url = new URL(value);
    if (url.protocol !== "https:" || url.username || url.password || url.port) return null;
    if (!hosts.includes(url.hostname.toLowerCase())) return null;
    return url.toString();
  } catch {
    return null;
  }
}

/**
 * Only returns a verified, explicitly configured external checkout destination.
 * This does not create an order or claim payment confirmation. Partner attribution
 * requires a separately approved checkout URL keyed by the partner's referral code.
 */
export const getRubiCheckoutReadiness = createServerFn({ method: "POST" })
  .validator((input: unknown) => checkoutSchema.parse(input))
  .handler(async ({ data }): Promise<CheckoutReadiness> => {
    const product = await getAvailableProduct(data.productId);
    if (!product) return { ready: false, reason: "Produto indisponível para compra." };
    const partnerCode = data.partnerCode;
    if (partnerCode) {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const { data: referral, error } = await (supabaseAdmin as any)
        .from("hub_partner_referral_links")
        .select("commercial_profile_id,product_id")
        .eq("code", partnerCode).eq("active", true).maybeSingle();
      if (error) throw error;
      if (!referral || referral.product_id !== data.productId) {
        return { ready: false, reason: "Esta indicação não está mais disponível." };
      }
      const [profile, grant] = await Promise.all([
        (supabaseAdmin as any).from("commercial_profiles").select("id")
          .eq("id", referral.commercial_profile_id).eq("audience", "partner")
          .eq("status", "approved").maybeSingle(),
        (supabaseAdmin as any).from("hub_partner_product_grants").select("id")
          .eq("commercial_profile_id", referral.commercial_profile_id)
          .eq("product_id", data.productId).eq("active", true).maybeSingle(),
      ]);
      if (profile.error) throw profile.error;
      if (grant.error) throw grant.error;
      if (!profile.data || !grant.data) return { ready: false, reason: "Indicação sem autorização comercial ativa." };
      // A direct checkout URL must never be substituted for a partner link:
      // that would lose attribution and make commissions unreliable.
      const destination = getApprovedCheckoutUrl(partnerCode, true);
      if (!destination) return {
        ready: false,
        reason: "Checkout do parceiro aguardando link oficial e atribuição confirmada pelo fornecedor.",
      };
      return { ready: true, destination };
    }

    const destination = getApprovedCheckoutUrl(data.productId, false);
    if (!destination) return {
      ready: false,
      reason: "Checkout principal aguardando o link oficial aprovado para este produto.",
    };
    return { ready: true, destination };
  });
