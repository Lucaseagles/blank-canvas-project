import { supabaseAdmin } from "@/integrations/supabase/client.server";

const PUBLIC_PRODUCT_STATUSES = ["active", "published"] as const;
const emptyRelationships = { cross_sell: [], upsell: [], downsell: [] };

export async function getProductRelationships(productId: string) {
  const { data: source, error: sourceError } = await supabaseAdmin.from('products')
    .select('id,status').eq('id', productId).maybeSingle();
  if (sourceError) throw sourceError;
  if (!source || !PUBLIC_PRODUCT_STATUSES.includes(source.status as (typeof PUBLIC_PRODUCT_STATUSES)[number])) {
    return emptyRelationships;
  }

  const { data, error } = await supabaseAdmin.from('product_relationships')
    .select(`id,type,related_product:products!product_relationships_related_product_id_fkey (id,slug,title,current_price,previous_price,discount,images,rating,review_count,affiliate_url,category_id,is_best_offer,offer_score,status)`)
    .eq('product_id', productId);
  if (error) throw error;
  const visible = (data ?? []).filter((row) =>
    row.related_product && PUBLIC_PRODUCT_STATUSES.includes(row.related_product.status as (typeof PUBLIC_PRODUCT_STATUSES)[number])
  );
  return {
    cross_sell: visible.filter(r => r.type === 'CROSS_SELL').map(r => r.related_product),
    upsell: visible.filter(r => r.type === 'UPSELL').map(r => r.related_product),
    downsell: visible.filter(r => r.type === 'DOWNSELL').map(r => r.related_product),
  };
}

export async function getBundles() {
  const { data, error } = await supabaseAdmin.from('bundles')
    .select('id,slug,title,description,image_url,is_active,bundle_discount_price,created_at,bundle_products(product_id,position)')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function getBundleBySlug(slug: string) {
  const { data, error } = await supabaseAdmin.from('bundles')
    .select(`id,title,slug,description,image_url,is_active,bundle_discount_price,created_at,products:bundle_products(position,product:products(id,slug,title,current_price,previous_price,discount,images,rating,review_count,affiliate_url,category_id,is_best_offer,offer_score,marketplace_id,status))`)
    .eq('slug', slug).eq('is_active', true).single();
  if (error) throw error;
  return {
    ...data,
    products: (data.products ?? []).filter((item) =>
      item.product && PUBLIC_PRODUCT_STATUSES.includes(item.product.status as (typeof PUBLIC_PRODUCT_STATUSES)[number])
    ),
  };
}
