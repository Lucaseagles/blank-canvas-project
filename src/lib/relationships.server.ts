import { supabaseAdmin } from "@/integrations/supabase/client.server";

export async function getProductRelationships(productId: string) {
  const { data, error } = await supabaseAdmin
    .from('product_relationships')
    .select(`
      id,
      type,
      related_product:products!product_relationships_related_product_id_fkey (id,slug,title,current_price,previous_price,discount,images,rating,review_count,affiliate_url,category_id,is_best_offer,offer_score)
    `)
    .eq('product_id', productId);

  if (error) throw error;
  
  // Group by type
  return {
    cross_sell: data.filter(r => r.type === 'CROSS_SELL').map(r => r.related_product),
    upsell: data.filter(r => r.type === 'UPSELL').map(r => r.related_product),
    downsell: data.filter(r => r.type === 'DOWNSELL').map(r => r.related_product)
  };
}

export async function getBundles() {
  const { data, error } = await supabaseAdmin
    .from('bundles')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

export async function getBundleBySlug(slug: string) {
  const { data, error } = await supabaseAdmin
    .from('bundles')
    .select(`
      id, title, slug, description, image_url, is_active, bundle_discount_price, created_at,
      products:bundle_products (
        position,
        product:products (id,slug,title,current_price,previous_price,discount,images,rating,review_count,affiliate_url,category_id,is_best_offer,offer_score,marketplace_id)
      )
    `)
    .eq('slug', slug)
    .single();

  if (error) throw error;
  return data;
}

export async function createBundle(data: any) {
  const { products, ...bundleData } = data;
  
  const { data: bundle, error } = await supabaseAdmin
    .from('bundles')
    .insert(bundleData)
    .select()
    .single();

  if (error) throw error;

  if (products && products.length > 0) {
    const bundleProducts = products.map((p: any) => ({
      bundle_id: bundle.id,
      product_id: p.id,
      position: p.position
    }));
    await supabaseAdmin.from('bundle_products').insert(bundleProducts);
  }

  return bundle;
}

export async function updateBundle(id: string, data: any) {
  const { products, ...bundleData } = data;
  
  const { data: bundle, error } = await supabaseAdmin
    .from('bundles')
    .update(bundleData)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;

  if (products) {
    // Simple approach: delete all and re-insert
    await supabaseAdmin.from('bundle_products').delete().eq('bundle_id', id);
    if (products.length > 0) {
      const bundleProducts = products.map((p: any) => ({
        bundle_id: id,
        product_id: p.id,
        position: p.position
      }));
      await supabaseAdmin.from('bundle_products').insert(bundleProducts);
    }
  }

  return bundle;
}

export async function deleteBundle(id: string) {
  const { error } = await supabaseAdmin
    .from('bundles')
    .delete()
    .eq('id', id);

  if (error) throw error;
  return { success: true };
}

export async function createProductRelationship(productId: string, relatedProductId: string, type: 'CROSS_SELL' | 'UPSELL' | 'DOWNSELL') {
  const { data, error } = await supabaseAdmin
    .from('product_relationships')
    .insert({
      product_id: productId,
      related_product_id: relatedProductId,
      type
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteProductRelationship(id: string) {
  const { error } = await supabaseAdmin
    .from('product_relationships')
    .delete()
    .eq('id', id);

  if (error) throw error;
  return { success: true };
}
