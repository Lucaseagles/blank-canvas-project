import { fetchAllFinancialRows, fetchFinancialRowsByIds } from "./financial-pagination.server";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const getMyPartnerPortal = createServerFn({ method: "POST" })
  .validator((input: unknown) => z.object({ accessToken: z.string().min(1) }).parse(input))
  .handler(async ({ data: input }) => {
    // Verify the session with Supabase Auth on the server before loading grants.
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: verified, error: authError } = await supabaseAdmin.auth.getUser(input.accessToken);
    const userId = verified.user?.id;
    if (authError || !userId) throw new Error("Sessão expirada. Entre novamente.");
    const { data: profile, error: profileError } = await (supabaseAdmin as any)
      .from("commercial_profiles").select("id,display_name,partner_type,status")
      .eq("user_id", userId).eq("audience", "partner").maybeSingle();
    if (profileError) throw profileError;
    if (!profile) return { profile: null, products: [] };
    if (profile.status !== "approved") return { profile, products: [] };
    const grants = await fetchAllFinancialRows(() => (supabaseAdmin as any)
      .from("hub_partner_product_grants").select("product_id")
      .eq("commercial_profile_id", profile.id).eq("active", true).order("product_id", { ascending: true }));
    const ids = (grants ?? []).map((grant: { product_id: string }) => grant.product_id);
    if (!ids.length) return { profile, products: [] };
    const products = await fetchFinancialRowsByIds(ids, (batchIds) => (supabaseAdmin as any)
      .from("hub_products").select("id,title,description,image_url,category,retail_price,hub_suppliers!inner(active)")
      .in("id", ids).eq("hub_suppliers.active", true).eq("active", true).gt("retail_price", 0).order("id", { ascending: true }));
    return { profile, products: (products ?? []).map(({ hub_suppliers: _supplier, ...product }: any) => product) };
  });
