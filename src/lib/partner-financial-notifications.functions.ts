import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

async function getPartnerId(accessToken: string) {
  const { createClient } = await import("@supabase/supabase-js");
  const url = process.env["SUPABASE_URL"], key = process.env["SUPABASE_PUBLISHABLE_KEY"];
  if (!url || !key) throw new Error("Autenticação indisponível.");
  const auth = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: claims, error } = await auth.auth.getClaims(accessToken);
  if (error || !claims?.claims?.sub) throw new Error("Sessão inválida.");
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: profile, error: profileError } = await (supabaseAdmin as any).from("commercial_profiles")
    .select("id").eq("user_id", claims.claims.sub).eq("audience", "partner").eq("status", "approved").maybeSingle();
  if (profileError) throw profileError;
  return profile?.id as string | undefined;
}

export const getMyPartnerFinancialNotifications = createServerFn({ method: "POST" })
  .validator((input: unknown) => z.object({ accessToken: z.string().min(1) }).parse(input))
  .handler(async ({ data }) => {
    const profileId = await getPartnerId(data.accessToken);
    if (!profileId) return [];
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: notifications, error } = await (supabaseAdmin as any)
      .from("hub_partner_financial_notifications").select("id,event_type,title,message,created_at,read_at")
      .eq("commercial_profile_id", profileId).order("created_at", { ascending: false }).limit(50);
    if (error) throw error;
    return notifications ?? [];
  });

export const markMyPartnerFinancialNotificationRead = createServerFn({ method: "POST" })
  .validator((input: unknown) => z.object({ accessToken: z.string().min(1), notificationId: z.string().uuid() }).parse(input))
  .handler(async ({ data }) => {
    const profileId = await getPartnerId(data.accessToken);
    if (!profileId) throw new Error("Parceiro não autorizado.");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await (supabaseAdmin as any).from("hub_partner_financial_notifications")
      .update({ read_at: new Date().toISOString() })
      .eq("id", data.notificationId).eq("commercial_profile_id", profileId).is("read_at", null);
    if (error) throw error;
    return { success: true };
  });

export const getMyPartnerUnreadFinancialNotificationCount = createServerFn({ method: "POST" })
  .validator((input: unknown) => z.object({ accessToken: z.string().min(1) }).parse(input))
  .handler(async ({ data }) => {
    const profileId = await getPartnerId(data.accessToken);
    if (!profileId) return { unread: 0 };
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { count, error } = await (supabaseAdmin as any)
      .from("hub_partner_financial_notifications")
      .select("id", { count: "exact", head: true })
      .eq("commercial_profile_id", profileId)
      .is("read_at", null);
    if (error) throw error;
    return { unread: count ?? 0 };
  });
