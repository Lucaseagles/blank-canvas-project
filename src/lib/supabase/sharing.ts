import { supabase } from "@/integrations/supabase/client";

export type ShareFormat = "9_16" | "1_1";
export type SharePlatform = "tiktok" | "instagram" | "kwai" | "telegram" | "whatsapp";

export interface ShareTemplate {
  id: string;
  platform: string;
  caption_template: string;
  max_length: number;
  hashtags: string[];
  is_active: boolean;
}

export interface ShareCardConfig {
  primary_color: string;
  secondary_color: string;
  text_color: string;
  background: string;
  accent_color: string;
  title: string;
  subtitle: string;
  cta: string;
  reward_label: string;
}

const asTemplates = (data: unknown): ShareTemplate[] => (data ?? []) as ShareTemplate[];

export async function getShareTemplates(): Promise<ShareTemplate[]> {
  const { data, error } = await supabase.from("share_templates" as never).select("*").eq("is_active", true).order("platform");
  if (error) throw error;
  return asTemplates(data);
}

export async function getAllShareTemplates(): Promise<ShareTemplate[]> {
  const { data, error } = await supabase.from("share_templates" as never).select("*").order("platform");
  if (error) throw error;
  return asTemplates(data);
}

export async function getShareTemplate(platform: string): Promise<ShareTemplate | null> {
  const { data, error } = await supabase.from("share_templates" as never).select("*").eq("platform", platform).eq("is_active", true).maybeSingle();
  if (error) throw error;
  return (data ?? null) as ShareTemplate | null;
}

export async function getShareCardConfig(): Promise<ShareCardConfig | null> {
  const { data, error } = await supabase.from("share_card_config" as never).select("config_key,config_value").in("config_key", ["card_style", "card_texts"]);
  if (error) throw error;
  const rows = (data ?? []) as unknown as Array<{ config_key: string; config_value: unknown }>;
  const style = (rows.find((row) => row.config_key === "card_style")?.config_value ?? {}) as Partial<ShareCardConfig>;
  const texts = (rows.find((row) => row.config_key === "card_texts")?.config_value ?? {}) as Partial<ShareCardConfig>;
  return { ...style, ...texts } as ShareCardConfig;
}

export async function logShare(userId: string, referralCode: string, platform: SharePlatform, format: ShareFormat): Promise<void> {
  const { error } = await supabase.from("share_history" as never).insert({ user_id: userId, referral_code: referralCode, platform, format });
  if (error) throw error;
}

export async function updateShareTemplate(id: string, values: Pick<ShareTemplate, "caption_template" | "max_length" | "hashtags" | "is_active">): Promise<void> {
  const { error } = await supabase.from("share_templates" as never).update({ ...values, updated_at: new Date().toISOString() }).eq("id", id);
  if (error) throw error;
}

export async function updateShareCardConfig(config: ShareCardConfig): Promise<void> {
  const style = { primary_color: config.primary_color, secondary_color: config.secondary_color, text_color: config.text_color, background: config.background, accent_color: config.accent_color };
  const texts = { title: config.title, subtitle: config.subtitle, cta: config.cta, reward_label: config.reward_label };
  for (const [configKey, configValue] of [["card_style", style], ["card_texts", texts]] as const) {
    const { error } = await supabase.from("share_card_config" as never).update({ config_value: configValue, updated_at: new Date().toISOString() }).eq("config_key", configKey);
    if (error) throw error;
  }
}
