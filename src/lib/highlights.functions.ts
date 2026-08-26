import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const getCategoryHighlightsAdmin = createServerFn({ method: "GET" })
  .handler(async () => {
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
    
    // Get all categories first
    const { data: categories } = await supabaseAdmin
      .from("categories")
      .select("id, name")
      .order("name");
      
    // Get all current highlights
    const { data: highlights } = await supabaseAdmin
      .from("category_highlights" as any)
      .select(`
        *,
        products (
          id,
          title,
          current_price,
          images
        )
      `)
      .order("category_id");
      
    return {
      categories: categories || [],
      highlights: highlights || []
    };
  });

export const saveManualHighlight = createServerFn({ method: "POST" })
  .validator((data: { categoryId: string; productId: string; rank: number }) => 
    z.object({
      categoryId: z.string().uuid(),
      productId: z.string().uuid(),
      rank: z.number().int().min(1)
    }).parse(data)
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
    
    // 1. Get current score for the product to keep rank consistency if possible
    const { data: product } = await supabaseAdmin
      .from("products")
      .select("offer_score")
      .eq("id", data.productId)
      .single();
      
    const score = (product as any)?.offer_score || 0;
    
    // 2. Upsert as manual override
    const { error } = await supabaseAdmin
      .from("category_highlights" as any)
      .upsert({
        category_id: data.categoryId,
        product_id: data.productId,
        rank: data.rank,
        offer_score: score,
        is_manual_override: true,
        calculated_at: new Date().toISOString()
      }, { onConflict: 'category_id, rank' } as any);
      
    if (error) throw error;
    return { success: true };
  });

export const deleteHighlight = createServerFn({ method: "POST" })
  .validator((data: { id: string }) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
    const { error } = await supabaseAdmin
      .from("category_highlights" as any)
      .delete()
      .eq("id", data.id);
      
    if (error) throw error;
    return { success: true };
  });

export const recalculateCategoryHighlights = createServerFn({ method: "POST" })
  .handler(async () => {
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
    
    // 1. Get all active categories
    const { data: categories } = await supabaseAdmin
      .from("categories")
      .select("id");
      
    if (!categories) return { success: false, message: "No categories found" };
    
    let processed = 0;
    
    for (const cat of categories) {
      const { data: existingHighlights } = await supabaseAdmin
        .from("category_highlights" as any)
        .select("rank, product_id")
        .eq("category_id", cat.id)
        .eq("is_manual_override", true);
        
      const manualHighlights = (existingHighlights as any[]) || [];
      const manualRanks = manualHighlights.map(h => h.rank);
      const manualProductIds = manualHighlights.map(h => h.product_id);

      
      const ranksToFill = [1, 2, 3].filter(r => !manualRanks.includes(r));
      
      if (ranksToFill.length === 0) continue;
      
      const { data: topProducts } = await supabaseAdmin
        .from("products")
        .select("id, offer_score")
        .eq("category_id", cat.id)
        .or("status.eq.active,status.eq.published")
        .not("id", "in", `(${manualProductIds.length > 0 ? manualProductIds.join(',') : '00000000-0000-0000-0000-000000000000'})`)
        .order("offer_score", { ascending: false })
        .limit(ranksToFill.length);
        
      if (topProducts && topProducts.length > 0) {
        for (let i = 0; i < topProducts.length; i++) {
          const rank = ranksToFill[i];
          const product = topProducts[i];
          if (!product) continue;
          
          await supabaseAdmin
            .from("category_highlights" as any)
            .upsert({
              category_id: cat.id,
              product_id: product.id,
              rank: rank,
              offer_score: (product as any).offer_score || 0,
              is_manual_override: false,
              calculated_at: new Date().toISOString()
            }, { onConflict: 'category_id, rank' } as any);
        }
      }
      processed++;
    }
    
    // Log the automation activity
    const { data: rule } = await supabaseAdmin
      .from("automation_rules")
      .select("id")
      .eq("action_type", "RECALCULATE_CATEGORY_HIGHLIGHTS" as any)
      .single();
      
    if (rule) {
      await supabaseAdmin.rpc('log_automation_activity', {
        _rule_id: rule.id,
        _context: { processed_categories: processed },
        _result: `Recalculated highlights for ${processed} categories`,
        _status: 'success'
      });
    }
    
    return { success: true, processed };
  });

export const getCategoryHighlights = createServerFn({ method: "GET" })
  .validator((data: { categoryId?: string; limit?: number }) => 
    z.object({
      categoryId: z.string().uuid().optional(),
      limit: z.number().optional().default(3)
    }).parse(data)
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
    
    let query = supabaseAdmin
      .from("category_highlights" as any)
      .select(`
        rank,
        products (
          id,
          title,
          current_price,
          previous_price,
          discount,
          images,
          rating,
          review_count,
          affiliate_url,
          slug,
          category_id,
          is_best_offer,
          offer_score,
          marketplaces(name)
        )
      `)
      .order("rank", { ascending: true });
      
    if (data.categoryId) {
      query = query.eq("category_id", data.categoryId);
    }
    
    const { data: highlights, error } = await query.limit(data.limit);
    
    if (error) throw error;
    
    return (highlights as any[] || []).map(h => {
      const p: any = h.products;
      if (!p) return null;
      return {
        rank: h.rank,
        id: p.id,
        title: p.title,
        price: p.current_price,
        previousPrice: p.previous_price,
        discount: p.discount,
        image: Array.isArray(p.images) ? p.images[0] : (typeof p.images === 'string' ? JSON.parse(p.images)[0] : null),
        rating: p.rating,
        reviewCount: p.review_count,
        affiliateUrl: p.affiliate_url,
        slug: p.slug,
        categoryId: p.category_id,
        marketplace: (p.marketplaces as any)?.name || 'Marketplace',
        isBestOffer: p.is_best_offer,
        offerScore: p.offer_score
      };
    }).filter(Boolean);
  });
