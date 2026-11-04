import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const getMyPartnerPortal = createServerFn({ method: "POST" })
  .validator((input: unknown) => z.object({ accessToken: z.string().min(1) }).parse(input))
  .handler(async ({ data: input }) => {
    const { createClient } = await import("@supabase/supabase-js");
    const url = process.env["SUPABASE_URL"];
    const key = process.env["SUPABASE_PUBLISHABLE_KEY"];
    if (!url || !key) throw new Error("Serviço de autenticação indisponível.");
    const auth = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data: verified, error: authError } = await auth.auth.getClaims(input.accessToken);
    const userId = verified?.claims?.sub;
    if (authError || !userId) throw new Error("Sessão expirada. Entre novamente.");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: profile, error: profileError } = await (supabaseAdmin as any)
      .from("commercial_profiles").select("id,display_name,partner_type,status")
      .eq("user_id", userId).eq("audience", "partner").maybeSingle();
    if (profileError) throw profileError;
    if (!profile) return { profile: null, products: [] };
    if (profile.status !== "approved") return { profile, products: [] };
    const { data: grants, error: grantsError } = await (supabaseAdmin as any)
      .from("hub_partner_product_grants").select("product_id")
      .eq("commercial_profile_id", profile.id).eq("active", true).limit(200);
    if (grantsError) throw grantsError;
    const ids = (grants ?? []).map((grant: { product_id: string }) => grant.product_id);
    if (!ids.length) return { profile, products: [] };
    const { data: products, error: productsError } = await (supabaseAdmin as any)
      .from("hub_products").select("id,title,description,image_url,category,retail_price")
      .in("id", ids).eq("active", true).order("title");
    if (productsError) throw productsError;
    return { profile, products: products ?? [] };
  });
