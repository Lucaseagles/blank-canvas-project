import { supabase } from "@/integrations/supabase/client";

export interface Category {
  id: string;
  name: string;
  slug: string;
  icon?: string | null;
  image_url?: string | null;
  color?: string | null;
  parent_id?: string | null;
  display_order?: number | null;
  product_count?: number;
  has_children?: boolean;
  created_at?: string | null;
}

type CategoryRow = Category & { is_active?: boolean | null };

export async function getMainCategories(): Promise<Category[]> {
  const { data, error } = await supabase.rpc("get_categories_with_counts" as never);
  if (error) throw error;
  return (data ?? []) as unknown as Category[];
}

export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  const { data, error } = await supabase
    .from("categories")
    .select("id,name,slug,icon,image_url,color,parent_id,display_order,is_active,created_at")
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw error;
  return (data ?? null) as unknown as Category | null;
}

export async function getSubcategories(parentId: string): Promise<Category[]> {
  const { data, error } = await supabase
    .from("categories")
    .select("id,name,slug,icon,image_url,color,parent_id,display_order,is_active,created_at")
    .eq("parent_id", parentId)
    .eq("is_active", true)
    .order("display_order", { ascending: true })
    .order("name", { ascending: true });
  if (error) throw error;

  const rows = (data ?? []) as unknown as Category[];
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
    const categoryId = product.category_id;
    if (categoryId) counts.set(categoryId, (counts.get(categoryId) ?? 0) + 1);
  }
  return rows.map((row) => ({ ...row, product_count: counts.get(row.id) ?? 0 }));
}

export async function getCategoryBreadcrumb(categoryId: string): Promise<Category[]> {
  const breadcrumb: Category[] = [];
  let currentId: string | null = categoryId;
  const visited = new Set<string>();

  while (currentId && !visited.has(currentId) && breadcrumb.length < 10) {
    visited.add(currentId);
    const { data: categoryData, error } = await supabase
      .from("categories")
      .select("id,name,slug,icon,image_url,color,parent_id,display_order,is_active,created_at")
      .eq("id", currentId)
      .maybeSingle();
    if (error || !categoryData) break;
    const row = categoryData as unknown as CategoryRow;
    breadcrumb.unshift(row);
    currentId = row.parent_id ?? null;
  }
  return breadcrumb;
}
