import { supabase as typedSupabase } from "@/integrations/supabase/client";

const supabase = typedSupabase as any;

export interface ExternalVideo {
  id: string;
  platform: string;
  external_url: string;
  thumbnail_url: string | null;
  product_id: string;
  title: string;
  description: string | null;
  is_active: boolean;
  view_count: number;
  click_count: number;
  added_at: string;
  updated_at?: string;
  product?: { name: string; slug: string };
}

export interface ExternalVideoFormData {
  platform: string;
  external_url: string;
  thumbnail_url: string | null;
  product_id: string;
  title: string;
  description: string | null;
  is_active: boolean;
}

export async function createExternalVideo(data: ExternalVideoFormData) {
  const { data: result, error } = await supabase
    .from("external_videos")
    .insert({ ...data, view_count: 0, click_count: 0, added_at: new Date().toISOString() })
    .select()
    .single();
  if (error) return { success: false as const, error: error.message };
  return { success: true as const, data: result };
}

export async function updateExternalVideo(id: string, data: Partial<ExternalVideoFormData>) {
  const { data: result, error } = await supabase
    .from("external_videos")
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();
  if (error) return { success: false as const, error: error.message };
  return { success: true as const, data: result };
}

export async function getExternalVideo(id: string) {
  const { data, error } = await supabase
    .from("external_videos")
    .select("*, products:product_id(id, title, slug)")
    .eq("id", id)
    .maybeSingle();
  return error ? null : data;
}

export async function listExternalVideos(options?: { platform?: string; search?: string; limit?: number }) {
  let query = supabase
    .from("external_videos")
    .select("*, products:product_id(id, title, slug)", { count: "exact" });
  if (options?.platform) query = query.eq("platform", options.platform);
  if (options?.search) query = query.ilike("title", `%${options.search}%`);
  const { data, count, error } = await query
    .order("added_at", { ascending: false })
    .limit(options?.limit ?? 100);
  if (error) return { data: [], total: 0, error: error.message };
  return { data: data ?? [], total: count ?? 0, error: null };
}

export async function deleteExternalVideo(id: string) {
  const { error } = await supabase.from("external_videos").delete().eq("id", id);
  if (error) return { success: false as const, error: error.message };
  return { success: true as const };
}

export async function toggleExternalVideoActive(id: string, is_active: boolean) {
  return updateExternalVideo(id, { is_active });
}
