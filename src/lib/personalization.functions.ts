import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireOwnerRole } from "./auth-guards.server";
import { loadWeights, verifyOptionalUser } from "./personalization.server";

export const getWeights = createServerFn({ method: "GET" })
  .middleware([requireOwnerRole])
  .handler(async () => loadWeights());

export const updateInterestScore = createServerFn({ method: "POST" })
  .validator((data: { userId: string, categoryId: string, action: string, metadata?: any }) => z.object({
    userId: z.string().uuid(), categoryId: z.string().min(1).max(100),
    action: z.enum(['view', 'click', 'favorite', 'video_start', 'video_complete']),
    metadata: z.record(z.any()).optional()
  }).parse(data))
  .handler(async ({ data: { userId, categoryId, action, metadata } }) => {
    await verifyOptionalUser(userId);
    try {
      const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
      await supabaseAdmin.from("analytics_events").insert({ user_id: userId, event_type: action, metadata: { category_id: categoryId, ...metadata } });
      const weights = await loadWeights();
      const weight = (weights as any)[action] || 0;
      const { data: existing, error: fetchError } = await supabaseAdmin.from("user_interests").select("score").eq("user_id", userId).eq("category_id", categoryId).maybeSingle();
      if (fetchError) throw fetchError;
      if (existing) await supabaseAdmin.from("user_interests").update({ score: Number(existing.score) + weight, updated_at: new Date().toISOString() }).eq("user_id", userId).eq("category_id", categoryId);
      else await supabaseAdmin.from("user_interests").insert({ user_id: userId, category_id: categoryId, score: weight });
      if (action === 'video_complete') await supabaseAdmin.rpc('grant_points', { _user_id: userId, _action_key: 'video_complete', _ref_id: metadata?.['video_id'] });
      return { success: true };
    } catch (error) {
      console.error("Error updating interest score:", error);
      return { success: false, error: String(error) };
    }
  });

export const getPersonalizedFeed = createServerFn({ method: "GET" })
  .validator((data: { userId: string | null, limit?: number }) => z.object({ userId: z.string().uuid().nullable(), limit: z.number().int().min(1).max(40).optional().default(12) }).parse(data))
  .handler(async ({ data: { userId, limit } }) => {
    await verifyOptionalUser(userId);
    try {
      const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
      const relevantCount = userId ? Math.max(1, Math.round(limit * 0.7)) : 0;
      const relatedCount = userId ? Math.max(0, Math.round(limit * 0.2)) : 0;
      const discoveryCount = limit - relevantCount - relatedCount;
      let categoryIds: string[] = [];
      let recentlyShownIds: string[] = [];
      if (userId) {
        const { data: interests } = await supabaseAdmin.from("user_interests").select("category_id").eq("user_id", userId).order("score", { ascending: false }).limit(3);
        categoryIds = interests?.map(i => i.category_id).filter(Boolean) || [];
        const { data: shown } = await supabaseAdmin.from("recently_shown").select("product_id").eq("user_id", userId).order("shown_at", { ascending: false }).limit(40);
        recentlyShownIds = shown?.map(s => s.product_id).filter(Boolean) || [];
      }
      const select = `id, title, current_price, previous_price, discount, images, rating, review_count, affiliate_url, slug, category_id, is_best_offer, offer_score, marketplaces(name), video_products(id)`;
      const active = (q: any) => q.or("status.eq.active,status.eq.published");
      const used = new Set(recentlyShownIds);
      const relevantProducts: any[] = [];
      const relatedProducts: any[] = [];
      const discoveryProducts: any[] = [];

      const collect = async (bucket: any[], count: number, query: any) => {
        if (count <= 0) return;
        const { data } = await query;
        for (const product of data || []) {
          if (!used.has(product.id) && bucket.length < count) {
            bucket.push(product);
            used.add(product.id);
          }
        }
      };

      if (userId && categoryIds.length) {
        await collect(relevantProducts, relevantCount, active(supabaseAdmin.from("products").select(select).in("category_id", categoryIds).order("offer_score", { ascending: false, nullsFirst: false }).limit(relevantCount + used.size)));
      }
      await collect(relatedProducts, relatedCount, active(supabaseAdmin.from("products").select(select).order("offer_score", { ascending: false, nullsFirst: false }).limit(relatedCount + used.size)));
      await collect(discoveryProducts, discoveryCount, active(supabaseAdmin.from("products").select(select).order("rating", { ascending: false, nullsFirst: false }).limit(discoveryCount + used.size)));

      const missing = limit - (relevantProducts.length + relatedProducts.length + discoveryProducts.length);
      if (missing > 0) {
        const fallbackUsed = new Set<string>([...relevantProducts, ...relatedProducts, ...discoveryProducts].map(p => p.id));
        const { data: fallback } = await active(supabaseAdmin.from("products").select(select).order("offer_score", { ascending: false, nullsFirst: false }).order("rating", { ascending: false, nullsFirst: false }).limit(limit));
        for (const product of fallback || []) {
          if (!fallbackUsed.has(product.id)) {
            discoveryProducts.push(product);
            fallbackUsed.add(product.id);
          }
          if (discoveryProducts.length >= discoveryCount + missing) break;
        }
        if (discoveryProducts.length < discoveryCount + missing && recentlyShownIds.length) {
          const { data: recycle } = await active(supabaseAdmin.from("products").select(select).order("offer_score", { ascending: false, nullsFirst: false }).order("rating", { ascending: false, nullsFirst: false }).limit(limit));
          const existingIds = new Set([...relevantProducts, ...relatedProducts, ...discoveryProducts].map(p => p.id));
          for (const product of recycle || []) {
            if (existingIds.size >= limit) break;
            if (!existingIds.has(product.id)) {
              discoveryProducts.push(product);
              existingIds.add(product.id);
            }
          }
        }
      }

      const finalProducts = [...relevantProducts, ...relatedProducts, ...discoveryProducts].slice(0, limit);
      if (userId && finalProducts.length) await supabaseAdmin.from("recently_shown").insert(finalProducts.map(p => ({ user_id: userId, product_id: p.id, shown_at: new Date().toISOString() })));

      // Affinity is already calculated by the content-affinity pipeline. Read the
      // latest stored score in one batched query; never calculate it in the client.
      const affinityByProduct = new Map<string, number>();
      let affinityThreshold = 70;
      if (userId && finalProducts.length) {
        const productIds = finalProducts.map(p => p.id);
        const [{ data: affinityRows }, { data: proofConfig }] = await Promise.all([
          supabaseAdmin.from("content_affinity_log").select("content_id, affinity_score, created_at").eq("user_id", userId).in("content_id", productIds).order("created_at", { ascending: false }),
          supabaseAdmin.from("social_proof_config").select("content_affinity_threshold").limit(1).maybeSingle(),
        ]);
        affinityThreshold = Number((proofConfig as any)?.content_affinity_threshold ?? 70);
        for (const row of affinityRows || []) {
          if (!affinityByProduct.has(row.content_id)) affinityByProduct.set(row.content_id, Number(row.affinity_score));
        }
      }

      return finalProducts.map(p => {
        const score = affinityByProduct.get(p.id);
        return {
          id: p.id, title: p.title, price: p.current_price, previousPrice: p.previous_price, discount: p.discount,
          image: Array.isArray(p.images) ? p.images[0] : (typeof p.images === 'string' ? (() => { try { return JSON.parse(p.images)[0]; } catch { return null; } })() : null),
          rating: p.rating, reviewCount: p.review_count, affiliateUrl: p.affiliate_url, slug: p.slug, categoryId: p.category_id,
          marketplace: (p.marketplaces as any)?.name || 'Marketplace',
          feedContext: relevantProducts.some(rp => rp.id === p.id) ? "Baseado nos seus interesses" : relatedProducts.some(rp => rp.id === p.id) ? "Relacionado ao que você busca" : "Descoberto para você",
          hasVideo: Array.isArray(p.video_products) && p.video_products.length > 0, isBestOffer: p.is_best_offer, offerScore: p.offer_score,
          affinityScore: score !== undefined && score >= affinityThreshold ? Math.max(0, Math.min(100, score)) : null,
        };
      });
    } catch (error) {
      console.error("Catastrophic error in getPersonalizedFeed:", error);
      return [];
    }
  });