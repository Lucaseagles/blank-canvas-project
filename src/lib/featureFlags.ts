import { supabase } from "@/integrations/supabase/client";

export type FeatureFlagKey = "personalization" | "recommendations" | "popups" | "smart_banners" | "behavioral_marketing" | "notifications" | "ab_testing";

const FALLBACK: Record<FeatureFlagKey, boolean> = {
  personalization: true,
  recommendations: true,
  popups: true,
  smart_banners: true,
  behavioral_marketing: true,
  notifications: true,
  ab_testing: true,
};

export async function isFeatureEnabled(key: FeatureFlagKey): Promise<boolean> {
  const { data, error } = await supabase.from("feature_flags").select("is_enabled").eq("key", key).maybeSingle();
  if (error || !data) return FALLBACK[key];
  return data.is_enabled;
}

export async function getFeatureFlags(): Promise<Record<FeatureFlagKey, boolean>> {
  const { data, error } = await supabase.from("feature_flags").select("key,is_enabled");
  if (error) return FALLBACK;
  return data.reduce((acc, row) => {
    if (row.key in FALLBACK) acc[row.key as FeatureFlagKey] = row.is_enabled;
    return acc;
  }, { ...FALLBACK });
}

export async function getAbVariant(experimentId: string, userId: string): Promise<"A" | "B" | null> {
  const { data: existing } = await supabase.from("ab_assignments").select("variant").eq("experiment_id", experimentId).eq("user_id", userId).maybeSingle();
  if (existing?.variant === "A" || existing?.variant === "B") return existing.variant;
  const { data: experiment } = await supabase.from("ab_experiments").select("variant_a,variant_b,is_active").eq("id", experimentId).maybeSingle();
  if (!experiment?.is_active) return null;
  const variant = (Array.from(experimentId + userId).reduce((n, c) => (n * 31 + c.charCodeAt(0)) >>> 0, 7) % 2 === 0) ? "A" : "B";
  const { error } = await supabase.from("ab_assignments").insert({ experiment_id: experimentId, user_id: userId, variant });
  return error ? null : variant;
}
