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

/** Owner-only writes use a single database transaction with mandatory audit. */
export const saveManualHighlight = createServerFn({ method: "POST" })
  .middleware([requireOwnerRole])
  .validator((data: unknown) => z.object({ categoryId: id, productId: id, rank: adminRank }).parse(data))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: outcome, error } = await (supabaseAdmin as any).rpc("rubi_manage_category_highlights_audited", {
      p_action: "manual", p_category_id: data.categoryId,
      p_product_id: data.productId, p_rank: data.rank,
      p_highlight_id: null, p_actor: context.userId,
    });
    if (error) throw new Error(error.message);
    if (Number(outcome?.changed) !== 1) throw new Error("O destaque e sua auditoria não foram concluídos.");
    return { success: true };
  });

export const deleteHighlight = createServerFn({ method: "POST" })
  .middleware([requireOwnerRole])
  .validator((data: unknown) => z.object({ id }).parse(data))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: outcome, error } = await (supabaseAdmin as any).rpc("rubi_manage_category_highlights_audited", {
      p_action: "delete", p_category_id: null,
      p_product_id: null, p_rank: null,
      p_highlight_id: data.id, p_actor: context.userId,
    });
    if (error) throw new Error(error.message);
    if (Number(outcome?.changed) !== 1) throw new Error("A remoção e sua auditoria não foram concluídas.");
    return { success: true };
  });

export const recalculateCategoryHighlights = createServerFn({ method: "POST" })
  .middleware([requireOwnerRole])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: outcome, error } = await (supabaseAdmin as any).rpc("rubi_manage_category_highlights_audited", {
      p_action: "recalculate", p_category_id: null,
      p_product_id: null, p_rank: null,
      p_highlight_id: null, p_actor: context.userId,
    });
    if (error) throw new Error(error.message);
    if (typeof outcome?.processed !== "number") throw new Error("O recálculo e sua auditoria não foram concluídos.");
    return { success: true, processed: Number(outcome.processed) };
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
