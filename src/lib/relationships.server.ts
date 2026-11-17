import { supabaseAdmin } from "@/integrations/supabase/client.server";

export async function getProductRelationships(productId: string) {
  const { data, error } = await supabaseAdmin.from('product_relationships')
    .select(`id,type,related_product:products!product_relationships_related_product_id_fkey (id,slug,title,current_price,previous_price,discount,images,rating,review_count,affiliate_url,category_id,is_best_offer,offer_score)`)
    .eq('product_id', productId);
  if (error) throw error;
  return {
    cross_sell: data.filter(r => r.type === 'CROSS_SELL').map(r => r.related_product),
    upsell: data.filter(r => r.type === 'UPSELL').map(r => r.related_product),
    downsell: data.filter(r => r.type === 'DOWNSELL').map(r => r.related_product),
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
    .select(`id,title,slug,description,image_url,is_active,bundle_discount_price,created_at,products:bundle_products(position,product:products(id,slug,title,current_price,previous_price,discount,images,rating,review_count,affiliate_url,category_id,is_best_offer,offer_score,marketplace_id))`)
    .eq('slug', slug).eq('is_active', true).single();
  if (error) throw error;
  return data;
}
