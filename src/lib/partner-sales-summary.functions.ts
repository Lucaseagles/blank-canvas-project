import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const getMyPartnerSalesSummary = createServerFn({ method: "POST" })
  .validator((input: unknown) => z.object({ accessToken: z.string().min(1) }).parse(input))
  .handler(async ({ data: input }) => {
    const { createClient } = await import("@supabase/supabase-js");
    const url = process.env["SUPABASE_URL"];
    const key = process.env["SUPABASE_PUBLISHABLE_KEY"];
    if (!url || !key) throw new Error("Serviço de autenticação indisponível.");
    const auth = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data: verified, error: authError } = await auth.auth.getClaims(input.accessToken);
    const userId = verified?.claims?.sub;
    if (authError || !userId) throw new Error("Sessão inválida.");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: profile, error: profileError } = await (supabaseAdmin as any)
      .from("commercial_profiles").select("id").eq("user_id", userId)
      .eq("audience", "partner").eq("status", "approved").maybeSingle();
    if (profileError) throw profileError;
    if (!profile) return { sales: 0, grossAmount: 0, commissionAmount: 0, agreementPercent: null as number | null };
    const { data: agreement, error: agreementError } = await (supabaseAdmin as any)
      .from("hub_partner_agreements").select("commission_percent,active")
      .eq("commercial_profile_id", profile.id).maybeSingle();
    if (agreementError) throw agreementError;
    const { data: links, error: linksError } = await (supabaseAdmin as any)
      .from("hub_partner_referral_links").select("id")
      .eq("commercial_profile_id", profile.id).limit(200);
    if (linksError) throw linksError;
    if (!links?.length) return { sales: 0, grossAmount: 0, commissionAmount: 0, agreementPercent: agreement?.active ? Number(agreement.commission_percent) : null };
    const { data: sales, error: salesError } = await (supabaseAdmin as any)
      .from("hub_partner_confirmed_sales").select("gross_amount,commission_amount")
      .in("referral_link_id", links.map((link: { id: string }) => link.id)).limit(1000);
    if (salesError) throw salesError;
    return {
      sales: sales?.length ?? 0,
      grossAmount: (sales ?? []).reduce((sum: number, sale: { gross_amount: number }) => sum + Number(sale.gross_amount), 0),
      commissionAmount: (sales ?? []).reduce((sum: number, sale: { commission_amount: number }) => sum + Number(sale.commission_amount), 0),
      agreementPercent: agreement?.active ? Number(agreement.commission_percent) : null,
    };
  });
