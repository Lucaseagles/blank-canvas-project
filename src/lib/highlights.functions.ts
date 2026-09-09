import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireOwnerRole } from "./auth-guards.server";

const id = z.string().uuid();
const adminRank = z.number().int().min(1).max(3);

export const getCategoryHighlightsAdmin = createServerFn({ method: "GET" })
  .middleware([requireOwnerRole])
  .handler(async () => {
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
    const [{ data: categories, error: ce }, { data: highlights, error: he }, { data: products, error: pe }] = await Promise.all([
      supabaseAdmin.from("categories").select("id,name").order("name"),
      supabaseAdmin.from("category_highlights" as any).select("id,category_id,product_id,rank,offer_score,is_manual_override,calculated_at,products(id,title,current_price,images)").order("category_id").order("rank"),
      supabaseAdmin.from("products").select("id,title,status,category_id,offer_score").in("status", ["active", "published"]).order("title").limit(500)
    ]);
    if (ce) throw ce; if (he) throw he; if (pe) throw pe;
    return { categories: categories ?? [], highlights: highlights ?? [], products: products ?? [] };
  });

export const saveManualHighlight = createServerFn({ method: "POST" })
  .middleware([requireOwnerRole])
  .validator((data: unknown) => z.object({ categoryId: id, productId: id, rank: adminRank }).parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
    const [{ data: category, error: ce }, { data: product, error: pe }] = await Promise.all([
      supabaseAdmin.from("categories").select("id").eq("id", data.categoryId).maybeSingle(),
      supabaseAdmin.from("products").select("id,category_id,offer_score,status").eq("id", data.productId).maybeSingle()
    ]);
    if (ce) throw ce; if (pe) throw pe;
    if (!category) throw new Error("Categoria não encontrada");
    if (!product) throw new Error("Produto não encontrado");
    if (product.category_id !== data.categoryId) throw new Error("O produto não pertence à categoria selecionada");
    if (!['active','published'].includes(product.status)) throw new Error("Somente produtos ativos podem ser recomendados");
    const { error } = await supabaseAdmin.from("category_highlights" as any).upsert({ category_id: data.categoryId, product_id: data.productId, rank: data.rank, offer_score: Number(product.offer_score ?? 0), is_manual_override: true, calculated_at: new Date().toISOString() }, { onConflict: 'category_id,rank' } as any);
    if (error) throw error;
    return { success: true };
  });

export const deleteHighlight = createServerFn({ method: "POST" })
  .middleware([requireOwnerRole])
  .validator((data: unknown) => z.object({ id }).parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
    const { error } = await supabaseAdmin.from("category_highlights" as any).delete().eq("id", data.id);
    if (error) throw error;
    return { success: true };
  });

export const recalculateCategoryHighlights = createServerFn({ method: "POST" })
  .middleware([requireOwnerRole])
  .handler(async () => {
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
    const { data: categories, error: ce } = await supabaseAdmin.from("categories").select("id");
    if (ce) throw ce;
    let processed = 0;
    for (const cat of categories ?? []) {
      const { data: manual, error: me } = await supabaseAdmin.from("category_highlights" as any).select("rank,product_id").eq("category_id", cat.id).eq("is_manual_override", true);
      if (me) throw me;
      const manualRanks = new Set((manual ?? []).map((h: any) => h.rank));
      const manualProducts = new Set((manual ?? []).map((h: any) => h.product_id));
      const ranks = [1,2,3].filter(r => !manualRanks.has(r));
      if (ranks.length) {
        const { data: candidates, error: pe } = await supabaseAdmin.from("products").select("id,offer_score").eq("category_id", cat.id).in("status", ["active", "published"]).order("offer_score", { ascending: false, nullsFirst: false }).limit(20);
        if (pe) throw pe;
        const selected = (candidates ?? []).filter((p: any) => !manualProducts.has(p.id)).slice(0, ranks.length);
        for (let i=0;i<selected.length;i++) {
          const { error } = await supabaseAdmin.from("category_highlights" as any).upsert({ category_id: cat.id, product_id: selected[i].id, rank: ranks[i], offer_score: Number(selected[i].offer_score ?? 0), is_manual_override: false, calculated_at: new Date().toISOString() }, { onConflict: 'category_id,rank' } as any);
          if (error) throw error;
        }
      }
      processed++;
    }
    return { success: true, processed };
  });

export const getCategoryHighlights = createServerFn({ method: "GET" })
  .validator((data: unknown) => z.object({ categoryId: id.optional(), limit: z.number().int().min(1).max(20).default(3) }).parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
    let query = supabaseAdmin.from("category_highlights" as any).select("rank,products(id,title,current_price,previous_price,discount,images,rating,review_count,affiliate_url,slug,category_id,is_best_offer,offer_score,marketplaces(name))").order("rank");
    if (data.categoryId) query = query.eq("category_id", data.categoryId);
    const { data: highlights, error } = await query.limit(data.limit);
    if (error) throw error;
    return (highlights ?? []).map((h:any) => { const p=h.products; return p ? { rank:h.rank,id:p.id,title:p.title,price:p.current_price,previousPrice:p.previous_price,discount:p.discount,image:Array.isArray(p.images)?p.images[0]:null,rating:p.rating,reviewCount:p.review_count,affiliateUrl:p.affiliate_url,slug:p.slug,categoryId:p.category_id,marketplace:p.marketplaces?.name||'Marketplace',isBestOffer:p.is_best_offer,offerScore:p.offer_score } : null; }).filter(Boolean);
  });
