import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireOwnerRole } from "./auth-guards.server";

export const getPartnerAgreementsAdmin = createServerFn({ method: "GET" })
  .middleware([requireOwnerRole])
  .handler(async () => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const [profiles, agreements] = await Promise.all([
      (supabaseAdmin as any).from("commercial_profiles").select("id,display_name,partner_type,status")
        .eq("audience", "partner").order("created_at", { ascending: false }).limit(200),
      (supabaseAdmin as any).from("hub_partner_agreements").select("commercial_profile_id,commission_percent,active,revision").limit(200),
    ]);
    if (profiles.error) throw profiles.error;
    if (agreements.error) throw agreements.error;
    return { profiles: profiles.data ?? [], agreements: agreements.data ?? [] };
  });

export const setPartnerAgreementAdmin = createServerFn({ method: "POST" })
  .middleware([requireOwnerRole])
  .validator((input: unknown) => z.object({
    commercial_profile_id: z.string().uuid(),
    commission_percent: z.number().min(0).max(100),
    active: z.boolean(),
    expectedRevision: z.number().int().positive().nullable(),
  }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: rows, error } = await (supabaseAdmin as any)
      .rpc("rubi_set_partner_agreement_audited", {
        p_actor: context.userId, p_profile_id: data.commercial_profile_id,
        p_percent: data.commission_percent, p_active: data.active,
        p_expected_revision: data.expectedRevision
      });
    if (error) throw error;
    if (!rows?.length) throw new Error("Acordo não registrado.");
    return { success: true };
  });
