import { supabase } from "@/integrations/supabase/client";

export type ProductStatus = "draft" | "published" | "archived" | "active";

export interface ProductFormData {
  title: string;
  description: string | null;
  category_id: string | null;
  marketplace_id: string | null;
  external_product_id: string | null;
  affiliate_url: string;
  current_price: number;
  previous_price: number | null;
  discount: number | null;
  rating: number | null;
  review_count: number | null;
  free_shipping: boolean;
  status: ProductStatus;
  images: string[];
  is_active: boolean;
}

export async function getCategories() {
  const { data, error } = await supabase
    .from("categories")
    .select("id,name")
    .eq("is_active", true)
    .order("name");
  if (error) throw error;
  return data ?? [];
}

export async function getMarketplaces() {
  const { data, error } = await supabase
    .from("marketplaces")
    .select("id,name")
    .order("name");
  if (error) throw error;
  return data ?? [];
}

export async function createProduct(data: ProductFormData) {
  const payload = {
    title: data.title.trim(),
    description: data.description?.trim() || null,
    category_id: data.category_id || null,
    marketplace_id: data.marketplace_id || null,
    external_product_id: data.external_product_id?.trim() || null,
    affiliate_url: data.affiliate_url.trim(),
    current_price: Number(data.current_price),
    previous_price: data.previous_price == null ? null : Number(data.previous_price),
    discount: data.discount == null ? null : Number(data.discount),
    rating: data.rating == null ? null : Number(data.rating),
    review_count: data.review_count == null ? null : Number(data.review_count),
    free_shipping: Boolean(data.free_shipping),
    status: data.status,
    images: data.images ?? [],
  };

  const { data: result, error } = await supabase
    .from("products")
    .insert(payload)
    .select()
    .single();

  if (error) return { success: false as const, error: error.message };
  return { success: true as const, data: result };
}

export async function updateProduct(id: string, data: Partial<ProductFormData>) {
  const payload = {
    ...data,
    title: data.title?.trim(),
    description: data.description?.trim() || null,
    affiliate_url: data.affiliate_url?.trim(),
    current_price: data.current_price == null ? undefined : Number(data.current_price),
    previous_price: data.previous_price == null ? null : Number(data.previous_price),
    discount: data.discount == null ? null : Number(data.discount),
    rating: data.rating == null ? null : Number(data.rating),
    review_count: data.review_count == null ? null : Number(data.review_count),
    updated_at: new Date().toISOString(),
  };

  const { data: result, error } = await supabase
    .from("products")
    .update(payload)
    .eq("id", id)
    .select()
    .single();

  if (error) return { success: false as const, error: error.message };
  return { success: true as const, data: result };
}

export async function getProduct(id: string) {
  const { data, error } = await supabase
    .from("products")
    .select("*, categories:category_id(id,name), marketplaces:marketplace_id(id,name)")
    .eq("id", id)
    .single();
  if (error) throw error;
  return data;
}

export async function listProducts(options?: { limit?: number; offset?: number; status?: string; search?: string }) {
  let query = supabase
    .from("products")
    .select("*, categories:category_id(name), marketplaces:marketplace_id(name)", { count: "exact" })
    .order("created_at", { ascending: false });

  if (options?.status && options.status !== "all") query = query.eq("status", options.status);
  if (options?.search?.trim()) query = query.ilike("title", `%${options.search.trim()}%`);

  const limit = options?.limit ?? 50;
  const offset = options?.offset ?? 0;
  const { data, count, error } = await query.range(offset, offset + limit - 1);
  if (error) throw error;
  return { data: data ?? [], total: count ?? 0 };
}
