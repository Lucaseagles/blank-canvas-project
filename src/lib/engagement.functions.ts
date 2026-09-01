import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const toggleFavorite = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: { productId: string }) => z.object({ productId: z.string().uuid() }).parse(data))
  .handler(async ({ data: { productId }, context }) => {
    const { supabase, userId } = context;
    const { data: existing } = await supabase.from("favorites").select("id").eq("user_id", userId).eq("product_id", productId).maybeSingle();

    if (existing) {
      const { error } = await supabase.from("favorites").delete().eq("id", existing.id).eq("user_id", userId);
      if (error) throw error;
      return { favorited: false };
    }

    const { error } = await supabase.from("favorites").insert({ user_id: userId, product_id: productId });
    if (error) throw error;

    const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
    await supabaseAdmin.rpc('grant_points', { _user_id: userId, _action_key: 'favorite', _ref_id: productId });
    return { favorited: true };
  });

export const getFavorites = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .validator((data: { limit?: number, offset?: number }) => z.object({
    limit: z.number().int().min(1).max(100).optional().default(20),
    offset: z.number().int().min(0).optional().default(0)
  }).parse(data))
  .handler(async ({ data: { limit, offset }, context }) => {
    const { supabase, userId } = context;
    const { data, error } = await supabase.from("favorites").select("product_id, products(*, marketplaces(name))").eq("user_id", userId).range(offset, offset + limit - 1);
    if (error) throw error;

    return (data || []).flatMap(f => {
      const p = f.products as any;
      if (!p) return [];
      return [{ id: p.id, slug: p.slug, title: p.title, price: p.current_price, previousPrice: p.previous_price, discount: p.discount, image: p.images?.[0] || "", marketplace: p.marketplaces?.name || "External", rating: p.rating, reviewCount: p.review_count, affiliateUrl: p.affiliate_url }];
    });
  });

export const createPriceAlert = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: { productId: string, targetPrice: number }) => z.object({
    productId: z.string().uuid(),
    targetPrice: z.number().finite().positive().max(100000000)
  }).parse(data))
  .handler(async ({ data: { productId, targetPrice }, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase.from("price_alerts").insert({ user_id: userId, product_id: productId, target_price: targetPrice, is_active: true });
    if (error) throw error;
    return { success: true };
  });

export const getNotifications = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data, error } = await supabase.from("notifications").select("*").eq("user_id", userId).order("created_at", { ascending: false });
    if (error) throw error;
    return data || [];
  });

export const markNotificationRead = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: { notificationId: string }) => z.object({ notificationId: z.string().uuid() }).parse(data))
  .handler(async ({ data: { notificationId }, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase.from("notifications").update({ read: true }).eq("id", notificationId).eq("user_id", userId);
    if (error) throw error;
    return { success: true };
  });

export const getPriceAlerts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data, error } = await supabase.from("price_alerts").select("id,user_id,product_id,target_price,is_active,triggered_at,created_at,products(id,slug,title,current_price,previous_price,discount,images,rating,review_count,affiliate_url,marketplaces(name))").eq("user_id", userId).order("created_at", { ascending: false });
    if (error) throw error;
    return data || [];
  });

export const deletePriceAlert = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: { alertId: string }) => z.object({ alertId: z.string().uuid() }).parse(data))
  .handler(async ({ data: { alertId }, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase.from("price_alerts").delete().eq("id", alertId).eq("user_id", userId);
    if (error) throw error;
    return { success: true };
  });