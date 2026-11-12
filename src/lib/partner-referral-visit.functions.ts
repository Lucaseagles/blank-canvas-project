import { createServerFn } from "@tanstack/react-start";
import { approvedRubiCheckout } from "./rubi-checkout-validation";
import { z } from "zod";

export const resolvePartnerReferral = createServerFn({ method: "POST" })
  .validator((input: unknown) => z.object({ code: z.string().uuid(), publicationId: z.string().uuid().optional(), visitToken: z.string().uuid().optional() }).parse(input))
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
      (supabaseAdmin as any).from("hub_products").select("id,title,description,image_url,category,retail_price,checkout_url,checkout_verified,hub_suppliers!inner(active,checkout_host)").eq("hub_suppliers.active", true).eq("id", link.product_id).eq("active", true).gt("retail_price", 0).maybeSingle(),
    ]);
    if (profile.error) throw profile.error;
    if (grant.error) throw grant.error;
    if (product.error) throw product.error;
    if (!profile.data || !grant.data || !product.data || !approvedRubiCheckout(product.data as any)) throw new Error("Indicação indisponível.");
    // Optional URL-tagged publication. Validate each relationship at click-time;
    // never accept an arbitrary publication UUID as source evidence.
    if (input.publicationId) {
      const { data: publication, error: publicationError } = await (supabaseAdmin as any)
        .from("rubi_creator_team_publication_evidence")
        .select("id,assignment_id,membership_id,review_status")
        .eq("id", input.publicationId).eq("review_status", "reviewed").maybeSingle();
      if (publicationError) throw publicationError;
      if (!publication) throw new Error("Publicação não autorizada para este link.");
      const [assignmentResult, memberResult] = await Promise.all([
        (supabaseAdmin as any).from("rubi_creator_team_campaign_assignments")
          .select("id,team_id,campaign_plan_id,status").eq("id", publication.assignment_id).maybeSingle(),
        (supabaseAdmin as any).from("rubi_creator_team_members")
          .select("id,team_id,commercial_profile_id,status").eq("id", publication.membership_id).maybeSingle(),
      ]);
      if (assignmentResult.error) throw assignmentResult.error;
      if (memberResult.error) throw memberResult.error;
      const assignment = assignmentResult.data, member = memberResult.data;
      if (!assignment || assignment.status !== "ready" || !member || member.status !== "active" ||
          member.team_id !== assignment.team_id || member.commercial_profile_id !== link.commercial_profile_id) {
        throw new Error("Publicação sem vínculo comercial ativo.");
      }
      const { data: plan, error: planError } = await (supabaseAdmin as any)
        .from("rubi_master_campaign_plans")
        .select("product_id,mode,status").eq("id", assignment.campaign_plan_id).maybeSingle();
      if (planError) throw planError;
      if (!plan || plan.mode !== "creator_team" || plan.status !== "approved" ||
          plan.product_id !== link.product_id) {
        throw new Error("Campanha da publicação sem aprovação para este produto.");
      }
    }
    // A repeated request with the same random navigation token should not
    // inflate the referral counter. Legacy clients without a token still work.
    const visitRecord = {
      referral_link_id: link.id,
      ...(input.publicationId ? { publication_id: input.publicationId } : {}),
      ...(input.visitToken ? { visit_token: input.visitToken } : {}),
    };
    const visitWrite = (supabaseAdmin as any).from("hub_partner_referral_visits");
    const { error: visitError } = input.visitToken
      ? await visitWrite.upsert(visitRecord, {
          onConflict: "referral_link_id,visit_token",
          ignoreDuplicates: true,
        })
      : await visitWrite.insert(visitRecord);
    if (visitError) throw visitError;
    const { hub_suppliers: _supplier, checkout_url: _checkoutUrl, checkout_verified: _checkoutVerified, ...publicProduct } = product.data;
    return publicProduct as { id: string; title: string; description: string | null; image_url: string | null; category: string | null; retail_price: number };
  });
