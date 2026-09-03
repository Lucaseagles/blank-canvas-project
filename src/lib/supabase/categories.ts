import { supabase } from "@/integrations/supabase/client";

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  icon?: string | null;
  image_url?: string | null;
  color?: string | null;
  parent_id?: string | null;
  display_order?: number | null;
  product_count?: number;
  has_children?: boolean;
  created_at?: string | null;
}

export async function getMainCategories(): Promise<Category[]> {
  const { data, error } = await supabase.rpc("get_categories_with_counts");
  if (error) throw error;
  return (data ?? []) as Category[];
}

export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  const { data, error } = await supabase.from("categories").select("*").eq("slug", slug).maybeSingle();
  if (error) throw error;
  return data as Category | null;
}

export async function getSubcategories(parentId: string): Promise<Category[]> {
  const { data, error } = await supabase
    .from("categories")
    .select("id,name,slug,description,icon,image_url,color,parent_id,display_order,created_at")
    .eq("parent_id", parentId)
    .eq("is_active", true)
    .order("display_order", { ascending: true })
    .order("name", { ascending: true });
  if (error) throw error;

  const rows = (data ?? []) as Category[];
  if (!rows.length) return rows;

  const ids = rows.map((row) => row.id);
  const { data: products, error: productsError } = await supabase
    .from("products")
    .select("category_id")
    .in("category_id", ids)
    .eq("status", "active");
  if (productsError) throw productsError;

  const counts = new Map<string, number>();
  for (const product of products ?? []) {
    counts.set(product.category_id, (counts.get(product.category_id) ?? 0) + 1);
  }
  return rows.map((row) => ({ ...row, product_count: counts.get(row.id) ?? 0 }));
}

export async function getCategoryBreadcrumb(categoryId: string): Promise<Category[]> {
  const breadcrumb: Category[] = [];
  let currentId: string | null = categoryId;
  const visited = new Set<string>();

  while (currentId && !visited.has(currentId) && breadcrumb.length < 10) {
    visited.add(currentId);
    const { data, error } = await supabase.from("categories").select("*").eq("id", currentId).maybeSingle();
    if (error || !data) break;
    breadcrumb.unshift(data as Category);
    currentId = data.parent_id;
  }
  return breadcrumb;
}
