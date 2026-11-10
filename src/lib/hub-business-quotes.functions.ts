import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireOwnerRole } from "./auth-guards.server";
import { calculateRubiBusinessLine } from "./rubi-business-quote-pricing";

const MAX_LINES = 12;
const MAX_QUANTITY = 100000;
const MAX_TOTAL_CENTS = 5_000_000_000;
const quoteLine = z.object({
  productId: z.string().uuid(),
  quantity: z.number().int().positive().max(MAX_QUANTITY),
});
const createQuoteSchema = z.object({
  accessToken: z.string().min(1),
  lines: z.array(quoteLine).min(1).max(MAX_LINES),
  merchantNote: z.string().trim().max(500).default(""),
});

type QuoteLine = {
  productId: string;
  title: string;
  quantity: number;
  unitPrice: number;
  total: number;
};

type QuoteRow = {
  id: string;
  status: string;
  total_estimate: number;
  requested_lines: QuoteLine[];
  merchant_note: string;
  owner_note: string;
  created_at: string;
  updated_at: string;
};

async function approvedMerchantProfile(accessToken: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: auth, error: authError } = await supabaseAdmin.auth.getUser(accessToken);
  const userId = auth.user?.id;
  if (authError || !userId) throw new Error("Sessão inválida. Faça login novamente.");
  const { data: profile, error } = await (supabaseAdmin as any)
    .from("commercial_profiles").select("id")
    .eq("user_id", userId).eq("audience", "merchant")
    .eq("status", "approved").maybeSingle();
  if (error) throw error;
  if (!profile) throw new Error("Somente lojistas aprovados podem enviar solicitações.");
  return { supabaseAdmin, userId, profileId: String(profile.id) };
}

/**
 * A quote request is never a paid order. Server independently checks each
 * active supplier/product and recalculates all tier prices from trusted rows.
 */
export const createHubBusinessQuote = createServerFn({ method: "POST" })
  .validator((input: unknown) => createQuoteSchema.parse(input))
  .handler(async ({ data }) => {
    const { supabaseAdmin, userId, profileId } = await approvedMerchantProfile(data.accessToken);
    const ids = data.lines.map(line => line.productId);
    if (new Set(ids).size !== ids.length) throw new Error("Não repita o mesmo produto na solicitação.");

    // Limit accidental repeated requests before evaluating suppliers.
    const hourly = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { count: recent, error: rateError } = await (supabaseAdmin as any)
      .from("hub_b2b_quote_requests").select("id", { count: "exact", head: true })
      .eq("commercial_profile_id", profileId).gte("created_at", hourly);
    if (rateError) throw rateError;
    if ((recent ?? 0) >= 10) throw new Error("Limite de 10 solicitações por hora. Tente novamente mais tarde.");

    const { data: products, error: productError } = await (supabaseAdmin as any)
      .from("hub_products")
      .select("id,title,b2b_base_price,min_b2b_quantity,hub_suppliers!inner(active),hub_b2b_tiers(min_quantity,unit_price)")
      .in("id", ids).eq("active", true).eq("hub_suppliers.active", true);
    if (productError) throw productError;
    if ((products ?? []).length !== ids.length) throw new Error("Um dos produtos não está mais disponível.");
    const byId = new Map<string, any>((products ?? []).map((product: any) => [String(product.id), product]));

    let totalCents = 0;
    const calculated: QuoteLine[] = data.lines.map(line => {
      const product = byId.get(line.productId);
      if (!product) throw new Error("Produto não disponível.");
      const { unitCents: priceCents, totalCents: amountCents } = calculateRubiBusinessLine({
        title: String(product.title),
        quantity: line.quantity,
        minQuantity: Number(product.min_b2b_quantity),
        basePrice: Number(product.b2b_base_price),
        tiers: (product.hub_b2b_tiers ?? []).map((tier: any) => ({
          min_quantity: Number(tier.min_quantity),
          unit_price: Number(tier.unit_price),
        })),
      });
      totalCents += amountCents;
      return {
        productId: line.productId,
        title: String(product.title),
        quantity: line.quantity,
        unitPrice: priceCents / 100,
        total: amountCents / 100,
      };
    });
    if (!Number.isSafeInteger(totalCents) || totalCents <= 0 || totalCents > MAX_TOTAL_CENTS)
      throw new Error("Total da solicitação excede o limite.");
    const { data: inserted, error } = await (supabaseAdmin as any)
      .from("hub_b2b_quote_requests")
      .insert({
        commercial_profile_id: profileId,
        merchant_user_id: userId,
        requested_lines: calculated,
        total_estimate: totalCents / 100,
        merchant_note: data.merchantNote,
      }).select("id,status,created_at").single();
    if (error) throw error;
    return { id: String(inserted.id), status: String(inserted.status), createdAt: String(inserted.created_at) };
  });

export const getMyHubBusinessQuotes = createServerFn({ method: "POST" })
  .validator((input: unknown) => z.object({ accessToken: z.string().min(1) }).parse(input))
  .handler(async ({ data }) => {
    const { supabaseAdmin, profileId } = await approvedMerchantProfile(data.accessToken);
    const { data: rows, error } = await (supabaseAdmin as any)
      .from("hub_b2b_quote_requests")
      .select("id,status,total_estimate,requested_lines,merchant_note,owner_note,created_at,updated_at")
      .eq("commercial_profile_id", profileId)
      .order("created_at", { ascending: false }).limit(30);
    if (error) throw error;
    return (rows ?? []) as QuoteRow[];
  });

export const getHubBusinessQuotesAdmin = createServerFn({ method: "GET" })
  .middleware([requireOwnerRole])
  .handler(async () => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await (supabaseAdmin as any)
      .from("hub_b2b_quote_requests")
      .select("id,commercial_profile_id,status,total_estimate,requested_lines,merchant_note,owner_note,created_at,updated_at")
      .order("created_at", { ascending: false }).limit(100);
    if (error) throw error;
    return data ?? [];
  });

export const updateHubBusinessQuoteAdmin = createServerFn({ method: "POST" })
  .middleware([requireOwnerRole])
  .validator((input: unknown) => z.object({
    quoteId: z.string().uuid(),
    status: z.enum(["requested", "reviewing", "responded", "closed"]),
    ownerNote: z.string().trim().max(500),
  }).parse(input))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: existing, error: lookupError } = await (supabaseAdmin as any)
      .from("hub_b2b_quote_requests").select("id,status").eq("id", data.quoteId).maybeSingle();
    if (lookupError) throw lookupError;
    if (!existing) throw new Error("Cotação não encontrada.");
    if (existing.status === "closed" && data.status !== "closed")
      throw new Error("Solicitação encerrada. Não é possível reabri-la.");
    const { error } = await (supabaseAdmin as any)
      .from("hub_b2b_quote_requests")
      .update({ status: data.status, owner_note: data.ownerNote, updated_at: new Date().toISOString() })
      .eq("id", data.quoteId);
    if (error) throw error;
    return { success: true };
  });
