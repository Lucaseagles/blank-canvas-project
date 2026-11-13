import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireOwnerRole } from "./auth-guards.server";
import { fetchAllFinancialRows } from "./financial-pagination.server";

export const getPartnerProductGrantsAdmin = createServerFn({ method: "GET" })
  .middleware([requireOwnerRole])
  .handler(async () => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const [profiles, products, grants] = await Promise.all([
      fetchAllFinancialRows(() => (supabaseAdmin as any)
        .from("commercial_profiles")
        .select("id,display_name,partner_type,status")
        .eq("audience", "partner")
        .order("id", { ascending: true })),
      fetchAllFinancialRows(() => (supabaseAdmin as any)
        .from("hub_products")
        .select("id,title,active,retail_price,hub_suppliers(active)")
        .order("id", { ascending: true })),
      fetchAllFinancialRows(() => (supabaseAdmin as any)
        .from("hub_partner_product_grants")
        .select("id,commercial_profile_id,product_id,active,revision")
        .order("id", { ascending: true })),
    ]);
    return { profiles, products, grants };
  });

export const setPartnerProductGrantAdmin = createServerFn({ method: "POST" })
  .middleware([requireOwnerRole])
  .validator((input: unknown) => z.object({
    commercial_profile_id: z.string().uuid(),
    product_id: z.string().uuid(),
    active: z.boolean(),
    expectedRevision: z.number().int().positive().nullable(),
  }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: rows, error } = await (supabaseAdmin as any)
      .rpc("rubi_set_partner_product_grant_audited", {
        p_actor: context.userId, p_profile_id: data.commercial_profile_id,
        p_product_id: data.product_id, p_active: data.active,
        p_expected_revision: data.expectedRevision
      });
    if (error) throw error;
    if (!rows?.length) throw new Error("Autorização não registrada.");
    return { success: true };
  });
