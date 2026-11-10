import { fetchAllFinancialRows, fetchFinancialRowsByIds } from "./financial-pagination.server";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const getMyPartnerSalesSummary = createServerFn({ method: "POST" })
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
    if (!profile) return { sales: 0, grossAmount: 0, commissionAmount: 0, agreementPercent: null as number | null, byProduct: [] as Array<{ productId: string; sales: number; grossAmount: number; commissionAmount: number }> };
    const { data: agreement, error: agreementError } = await (supabaseAdmin as any)
      .from("hub_partner_agreements").select("commission_percent,active")
      .eq("commercial_profile_id", profile.id).maybeSingle();
    if (agreementError) throw agreementError;
    const links = await fetchAllFinancialRows(() => (supabaseAdmin as any)
      .from("hub_partner_referral_links").select("id,product_id")
      .eq("commercial_profile_id", profile.id).order("id", { ascending: true }));
    if (!links?.length) return { sales: 0, grossAmount: 0, commissionAmount: 0, agreementPercent: agreement?.active ? Number(agreement.commission_percent) : null, byProduct: [] as Array<{ productId: string; sales: number; grossAmount: number; commissionAmount: number }> };
    const sales = await fetchFinancialRowsByIds(links.map((link: { id: string }) => link.id), (ids) => (supabaseAdmin as any)
      .from("hub_partner_confirmed_sales").select("id,referral_link_id,gross_amount,commission_amount")
      .in("referral_link_id", ids).order("id", { ascending: true }));
    // Aggregate only confirmed orders belonging to links of the authenticated partner.
    // Historical confirmed sales remain visible even if a product link was later revoked;
    // the UI only renders per-product figures for products currently authorized.
    const productByLink = new Map<string, string>(
      links.map((link: { id: string; product_id: string }) => [link.id, link.product_id]),
    );
    const byProductTotals = new Map<string, { productId: string; sales: number; grossAmount: number; commissionAmount: number }>();
    for (const sale of (sales ?? []) as Array<{ referral_link_id: string; gross_amount: number; commission_amount: number }>) {
      const productId = productByLink.get(sale.referral_link_id);
      if (!productId) throw new Error("Venda sem indicação correspondente ao parceiro.");
      const entry = byProductTotals.get(productId) ?? { productId, sales: 0, grossAmount: 0, commissionAmount: 0 };
      entry.sales += 1;
      entry.grossAmount += Number(sale.gross_amount);
      entry.commissionAmount += Number(sale.commission_amount);
      byProductTotals.set(productId, entry);
    }
    return {
      byProduct: Array.from(byProductTotals.values()).sort((a, b) => a.productId.localeCompare(b.productId)),
      sales: sales?.length ?? 0,
      grossAmount: (sales ?? []).reduce((sum: number, sale: { gross_amount: number }) => sum + Number(sale.gross_amount), 0),
      commissionAmount: (sales ?? []).reduce((sum: number, sale: { commission_amount: number }) => sum + Number(sale.commission_amount), 0),
      agreementPercent: agreement?.active ? Number(agreement.commission_percent) : null,
    };
  });
