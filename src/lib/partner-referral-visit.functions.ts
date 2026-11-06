import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const resolvePartnerReferral = createServerFn({ method: "POST" })
  .validator((input: unknown) => z.object({ code: z.string().uuid() }).parse(input))
  .handler(async ({ data: input }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: link, error: linkError } = await (supabaseAdmin as any)
      .from("hub_partner_referral_links").select("id,commercial_profile_id,product_id")
      .eq("code", input.code).eq("active", true).maybeSingle();
    if (linkError) throw linkError;
    if (!link) throw new Error("Indicação indisponível.");
    const [profile, grant, product] = await Promise.all([
      (supabaseAdmin as any).from("commercial_profiles").select("id").eq("id", link.commercial_profile_id).eq("audience", "partner").eq("status", "approved").maybeSingle(),
      (supabaseAdmin as any).from("hub_partner_product_grants").select("id").eq("commercial_profile_id", link.commercial_profile_id).eq("product_id", link.product_id).eq("active", true).maybeSingle(),
      (supabaseAdmin as any).from("hub_products").select("title,description,image_url,retail_price").eq("id", link.product_id).eq("active", true).gt("retail_price", 0).maybeSingle(),
    ]);
    if (profile.error) throw profile.error;
    if (grant.error) throw grant.error;
    if (product.error) throw product.error;
    if (!profile.data || !grant.data || !product.data) throw new Error("Indicação indisponível.");
    const { error: visitError } = await (supabaseAdmin as any)
      .from("hub_partner_referral_visits").insert({ referral_link_id: link.id });
    if (visitError) throw visitError;
    return product.data as { title: string; description: string | null; image_url: string | null; retail_price: number };
  });
