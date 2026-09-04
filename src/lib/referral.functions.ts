import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireOwnerRole } from "@/lib/auth-guards.server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const generateReferralCode = () => Math.random().toString(36).substring(2, 8).toUpperCase();

type ReferralRow = { id: string; referral_code: string; referrer_user_id: string };
type ReferralEvent = {
  id: string;
  referral_id: string;
  invited_user_id: string;
  campaign_id: string | null;
  status: string;
  created_at: string;
  referrals: { referral_code: string; referrer_user_id: string } | null;
};

export const getReferralInfo = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).handler(async ({ context }) => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const userId = context.userId;
  let { data: referral, error } = await supabaseAdmin.from("referrals" as never).select("*").eq("referrer_user_id", userId).maybeSingle() as { data: ReferralRow | null; error: Error | null };
  if (error) throw error;
  if (!referral) {
    const { data: created, error: createError } = await (supabaseAdmin.from("referrals" as never) as unknown as { insert: (values: { referrer_user_id: string; referral_code: string }) => { select: () => { single: () => Promise<{ data: ReferralRow | null; error: Error | null }> } } }).insert({ referrer_user_id: userId, referral_code: generateReferralCode() }).select().single();
    if (createError) throw createError;
    referral = created;
  }
  const r = referral as ReferralRow;
  const [invited, registered, activated] = await Promise.all([
    supabaseAdmin.from("referral_events" as never).select("id", { count: "exact", head: true }).eq("referral_id", r.id),
    supabaseAdmin.from("referral_events" as never).select("id", { count: "exact", head: true }).eq("referral_id", r.id).eq("status", "registered"),
    supabaseAdmin.from("referral_events" as never).select("id", { count: "exact", head: true }).eq("referral_id", r.id).eq("status", "activated"),
  ]);
  return { code: r.referral_code, stats: { invited: invited.count ?? 0, registered: registered.count ?? 0, activated: activated.count ?? 0 } };
});

export const processReferral = createServerFn({ method: "POST" }).validator((data: { code: string; invitedUserId: string; campaignId?: string | null }) => z.object({ code: z.string().trim().min(1).max(32), invitedUserId: z.string().uuid(), campaignId: z.string().uuid().nullable().optional() }).parse(data)).handler(async ({ data }) => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: referral } = await supabaseAdmin.from("referrals" as never).select("id").eq("referral_code", data.code.toUpperCase()).maybeSingle();
  if (!referral) return { success: false, error: "Invalid code" };
  const result = await (supabaseAdmin.from("referral_events" as never) as unknown as { insert: (values: { referral_id: string; invited_user_id: string; status: string; campaign_id: string | null }) => Promise<{ error: Error | null }> }).insert({ referral_id: (referral as { id: string }).id, invited_user_id: data.invitedUserId, status: "registered", campaign_id: data.campaignId ?? null });
  if (result.error) throw result.error;
  return { success: true };
});

export const getAdminReferralStats = createServerFn({ method: "GET" }).middleware([requireOwnerRole]).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const result = await (supabaseAdmin.from("referral_events" as never) as unknown as { select: (columns: string) => { order: (column: string, options: { ascending: boolean }) => { limit: (count: number) => Promise<{ data: ReferralEvent[] | null; error: Error | null }> } } }).select("id,referral_id,invited_user_id,campaign_id,status,created_at,referrals(referral_code,referrer_user_id)").order("created_at", { ascending: false }).limit(50);
  if (result.error) throw result.error;
  const [codes, totalEvents, activated, registered] = await Promise.all([
    supabaseAdmin.from("referrals" as never).select("id", { count: "exact", head: true }),
    supabaseAdmin.from("referral_events" as never).select("id", { count: "exact", head: true }),
    supabaseAdmin.from("referral_events" as never).select("id", { count: "exact", head: true }).eq("status", "activated"),
    supabaseAdmin.from("referral_events" as never).select("id", { count: "exact", head: true }).eq("status", "registered"),
  ]);
  return {
    events: result.data ?? [],
    summary: {
      totalCodes: codes.count ?? 0,
      totalEvents: totalEvents.count ?? 0,
      activated: activated.count ?? 0,
      registered: registered.count ?? 0,
    },
  };
});
