import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const getMyPartnerVisitStats = createServerFn({ method: "POST" })
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
    if (!profile) return { links: 0, visits: 0, byProduct: [] };
    const { data: links, error: linksError } = await (supabaseAdmin as any)
      .from("hub_partner_referral_links").select("id,product_id")
      .eq("commercial_profile_id", profile.id).eq("active", true).limit(200);
    if (linksError) throw linksError;
    if (!links?.length) return { links: 0, visits: 0, byProduct: [] };
    const byProduct = await Promise.all(links.map(async (link: { id: string; product_id: string }) => {
      const { count, error } = await (supabaseAdmin as any)
        .from("hub_partner_referral_visits").select("id", { count: "exact", head: true })
        .eq("referral_link_id", link.id);
      if (error) throw error;
      return { productId: link.product_id, visits: count ?? 0 };
    }));
    return { links: links.length, visits: byProduct.reduce((sum, item) => sum + item.visits, 0), byProduct };
  });
