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
      (supabaseAdmin as any).from("hub_partner_agreements").select("commercial_profile_id,commission_percent,active").limit(200),
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
  }).parse(input))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: profile, error: profileError } = await (supabaseAdmin as any)
      .from("commercial_profiles").select("id,status").eq("id", data.commercial_profile_id)
      .eq("audience", "partner").maybeSingle();
    if (profileError) throw profileError;
    if (!profile) throw new Error("Parceiro não encontrado.");
    if (data.active && profile.status !== "approved") throw new Error("Acordos ativos exigem parceiro aprovado.");
    const { error } = await (supabaseAdmin as any).from("hub_partner_agreements")
      .upsert({ ...data, updated_at: new Date().toISOString() }, { onConflict: "commercial_profile_id" });
    if (error) throw error;
    return { success: true };
  });
