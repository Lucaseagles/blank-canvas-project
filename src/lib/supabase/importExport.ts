import { supabase } from "@/integrations/supabase/client";

const cell = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;

export async function exportProductsToCSV(filters?: { status?: string; category_id?: string }) {
  let query = supabase.from("products").select("id,title,description,current_price,previous_price,discount,rating,review_count,status,affiliate_url,free_shipping,categories:category_id(name),marketplaces:marketplace_id(name)");
  if (filters?.status && filters.status !== "all") query = query.eq("status", filters.status);
  if (filters?.category_id && filters.category_id !== "all") query = query.eq("category_id", filters.category_id);
  const { data, error } = await query.order("created_at", { ascending: false });
  if (error) throw error;
  const headers = ["id","name","description","price","old_price","discount","rating","review_count","status","affiliate_url","shipping","category","marketplace"];
  const rows = (data ?? []).map((p: any) => [p.id,p.title,p.description,p.current_price,p.previous_price,p.discount,p.rating,p.review_count,p.status,p.affiliate_url,p.free_shipping ? "free" : "paid",p.categories?.name ?? "",p.marketplaces?.name ?? ""]);
  return [headers, ...rows].map(r => r.map(cell).join(",")).join("\r\n");
}

