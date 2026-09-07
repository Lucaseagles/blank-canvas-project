import { supabase } from "./client";

export interface NativeVideo {
  id: string;
  title: string;
  description: string | null;
  video_url: string;
  thumbnail_url: string | null;
  caption: string | null;
  product_id: string | null;
  affiliate_url: string | null;
  is_active: boolean;
  status: "draft" | "published" | "archived";
  created_at: string;
  updated_at: string;
}

export interface NativeVideoFormData {
  title: string;
  description: string | null;
  video_url: string;
  thumbnail_url: string | null;
  caption: string | null;
  product_id: string | null;
  affiliate_url: string | null;
  status: "draft" | "published" | "archived";
  is_active: boolean;
}

export async function createNativeVideo(data: NativeVideoFormData) {
  const { data: result, error } = await supabase
    .from("videos")
    .insert({ ...data, is_active: data.status === "published" })
    .select()
    .single();
  if (error) return { success: false as const, error: error.message };
  return { success: true as const, data: result };
}

export async function updateNativeVideo(id: string, data: Partial<NativeVideoFormData>) {
  const { data: result, error } = await supabase
    .from("videos")
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();
  if (error) return { success: false as const, error: error.message };
  return { success: true as const, data: result };
}

export async function getNativeVideo(id: string) {
  const { data, error } = await supabase
    .from("videos")
    .select("*, products:product_id(id, title, slug)")
    .eq("id", id)
    .maybeSingle();
  return error ? null : data;
}

export async function listNativeVideos(options?: { status?: string; search?: string; limit?: number }) {
  let query = supabase
    .from("videos")
    .select("*, products:product_id(id, title, slug)", { count: "exact" });
  if (options?.status) query = query.eq("status", options.status);
  if (options?.search) query = query.ilike("title", `%${options.search}%`);
  const { data, count, error } = await query
    .order("created_at", { ascending: false })
    .limit(options?.limit ?? 100);
  if (error) return { data: [], total: 0, error: error.message };
  return { data: data ?? [], total: count ?? 0, error: null };
}

export async function toggleNativeVideoStatus(id: string, status: "draft" | "published" | "archived") {
  return updateNativeVideo(id, { status, is_active: status === "published" });
}

export async function deleteNativeVideo(id: string) {
  const { error } = await supabase.from("videos").delete().eq("id", id);
  if (error) return { success: false as const, error: error.message };
  return { success: true as const };
}
