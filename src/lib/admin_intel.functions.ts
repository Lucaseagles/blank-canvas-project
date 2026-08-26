import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireOwnerRole } from "./auth-guards.server";

const DashboardInputSchema = z.object({
  days: z.number().default(7)
});

export const getAdminIntelligenceData = createServerFn({ method: "GET" })
  .middleware([requireOwnerRole])
  .validator((data: unknown) => DashboardInputSchema.parse(data))
  .handler(async ({ data: { days } }) => {
    try {
      const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
      
      const now = new Date();
      const startDate = new Date();
      startDate.setDate(now.getDate() - days);
      const startDateISO = startDate.toISOString();
      
      const prevStartDate = new Date();
      prevStartDate.setDate(now.getDate() - (days * 2));
      const prevStartDateISO = prevStartDate.toISOString();

      const [
        { count: totalUsers },
        { count: newUsers },
        { count: prevNewUsers },
        { count: totalProducts },
        { count: publishedProducts },
        { count: publishedVideos },
        { count: totalFavorites },
        { count: activeAlerts },
        { count: periodClicks },
        { count: prevPeriodClicks },
        { count: productViews },
        { count: totalReferrals },
        { count: activatedReferrals }
      ] = await Promise.all([

        supabaseAdmin.from("profiles").select("*", { count: 'exact', head: true }),
        supabaseAdmin.from("profiles").select("*", { count: 'exact', head: true }).gte("created_at", startDateISO),
        supabaseAdmin.from("profiles").select("*", { count: 'exact', head: true }).gte("created_at", prevStartDateISO).lt("created_at", startDateISO),
        supabaseAdmin.from("products").select("*", { count: 'exact', head: true }),
        supabaseAdmin.from("products").select("*", { count: 'exact', head: true }).eq("status", "published"),
        supabaseAdmin.from("videos").select("*", { count: 'exact', head: true }).eq("status", "published"),
        supabaseAdmin.from("favorites").select("*", { count: 'exact', head: true }).gte("created_at", startDateISO),
        supabaseAdmin.from("price_alerts").select("*", { count: 'exact', head: true }).eq("is_active", true),
        supabaseAdmin.from("analytics_events").select("*", { count: 'exact', head: true }).eq("event_type", "OUTBOUND_CLICK").gte("created_at", startDateISO),
        supabaseAdmin.from("analytics_events").select("*", { count: 'exact', head: true }).eq("event_type", "OUTBOUND_CLICK").gte("created_at", prevStartDateISO).lt("created_at", startDateISO),
        supabaseAdmin.from("analytics_events").select("*", { count: 'exact', head: true }).eq("event_type", "PRODUCT_VIEW").gte("created_at", startDateISO),
        supabaseAdmin.from("referrals" as any).select("*", { count: 'exact', head: true }).gte("created_at", startDateISO),
        supabaseAdmin.from("referral_events" as any).select("*", { count: 'exact', head: true }).eq("status", "activated").gte("created_at", startDateISO)
      ]);


      const { data: clickHistory } = await supabaseAdmin
        .rpc('get_daily_clicks' as any, { start_date: startDateISO });

      const { data: userGrowth } = await supabaseAdmin
        .rpc('get_daily_user_growth' as any, { start_date: startDateISO });

      const { data: topEvents } = await supabaseAdmin
        .from('analytics_events')
        .select('metadata, event_type')
        .eq('event_type', 'OUTBOUND_CLICK')
        .gte('created_at', startDateISO)
        .limit(100);
      
      const { data: marketplaceEvents } = await supabaseAdmin
        .from('analytics_events')
        .select('metadata, event_type')
        .eq('event_type', 'OUTBOUND_CLICK')
        .gte('created_at', startDateISO);

      return {
        kpis: {
          users: { total: totalUsers || 0, new: newUsers || 0, prevNew: prevNewUsers || 0 },
          products: { total: totalProducts || 0, published: publishedProducts || 0 },
          videos: { published: publishedVideos || 0 },
          clicks: { period: periodClicks || 0, prevPeriod: prevPeriodClicks || 0 },
          favorites: { total: totalFavorites || 0 },
          alerts: { active: activeAlerts || 0 },
          ctr: productViews ? ((periodClicks || 0) / productViews) * 100 : 0,
          referrals: { total: totalReferrals || 0, activated: activatedReferrals || 0 }
        },

        charts: {
          clickHistory: clickHistory || [],
          userGrowth: userGrowth || [],
          topProducts: topEvents || [],
          marketplaceDist: marketplaceEvents || []
        },
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error("Error fetching admin dashboard data:", error);
      throw new Error("Failed to load dashboard data");
    }
  });

export const getAdminMetrics = createServerFn({ method: "GET" })
  .middleware([requireOwnerRole])
  .handler(async () => {
    try {
      const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
      
      const [
        { count: users },
        { count: products },
        { count: videos },
        { count: favorites },
        { count: alerts },
        { count: clicks }
      ] = await Promise.all([
        supabaseAdmin.from("profiles").select("*", { count: 'exact', head: true }),
        supabaseAdmin.from("products").select("*", { count: 'exact', head: true }),
        supabaseAdmin.from("videos").select("*", { count: 'exact', head: true }),
        supabaseAdmin.from("favorites").select("*", { count: 'exact', head: true }),
        supabaseAdmin.from("price_alerts").select("*", { count: 'exact', head: true }),
        supabaseAdmin.from("analytics_events").select("*", { count: 'exact', head: true }).eq("event_type", "OUTBOUND_CLICK")
      ]);

      return {
        users: users || 0,
        products: products || 0,
        videos: videos || 0,
        favorites: favorites || 0,
        alerts: alerts || 0,
        clicks: clicks || 0,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error("Error fetching admin metrics:", error);
      throw new Error("Failed to load metrics");
    }
  });

export const getCategoriesAdmin = createServerFn({ method: "GET" })
  .middleware([requireOwnerRole])
  .handler(async () => {
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
    const { data, error } = await supabaseAdmin
      .from("categories")
      .select("*")
      .order("name");
    if (error) throw error;
    return data || [];
  });

export const saveCategory = createServerFn({ method: "POST" })
  .middleware([requireOwnerRole])
  .validator((data: { id?: string; name: string; slug: string; icon?: string; parent_id?: string | null }) => 
    z.object({
      id: z.string().optional(),
      name: z.string(),
      slug: z.string(),
      icon: z.string().optional(),
      parent_id: z.string().nullable().optional()
    }).parse(data)
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
    const { id, ...categoryData } = data;

    const payload: any = {
      name: categoryData.name,
      slug: categoryData.slug,
      icon: categoryData.icon ?? null,
      parent_id: categoryData.parent_id ?? null
    };

    if (id) {
      const { error } = await supabaseAdmin
        .from("categories")
        .update(payload)
        .eq("id", id);
      if (error) throw error;
    } else {
      const { error } = await supabaseAdmin
        .from("categories")
        .insert(payload);
      if (error) throw error;
    }
    return { success: true };
  });


export const deleteCategory = createServerFn({ method: "POST" })
  .middleware([requireOwnerRole])
  .validator((data: { id: string }) => z.object({ id: z.string() }).parse(data))
  .handler(async ({ data: { id } }) => {
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
    const { error } = await supabaseAdmin
      .from("categories")
      .delete()
      .eq("id", id);
    if (error) throw error;
    return { success: true };
  });

export const getOfferGroups = createServerFn({ method: "GET" })
  .middleware([requireOwnerRole])
  .handler(async () => {
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
    const { data, error } = await supabaseAdmin
      .from("offer_groups" as any)
      .select("*")
      .order("canonical_title");
    if (error) throw error;
    return data || [];
  });

export const saveOfferGroup = createServerFn({ method: "POST" })
  .middleware([requireOwnerRole])
  .validator((data: { id?: string; canonical_title: string }) => 
    z.object({
      id: z.string().optional(),
      canonical_title: z.string()
    }).parse(data)
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
    const { id, canonical_title } = data;

    if (id) {
      const { error } = await supabaseAdmin
        .from("offer_groups" as any)
        .update({ canonical_title } as any)
        .eq("id", id);
      if (error) throw error;
    } else {
      const { error } = await supabaseAdmin
        .from("offer_groups" as any)
        .insert({ canonical_title } as any);
      if (error) throw error;
    }
    return { success: true };
  });

export const updateProductOfferGroup = createServerFn({ method: "POST" })
  .middleware([requireOwnerRole])
  .validator((data: { productId: string; offerGroupId: string | null }) => 
    z.object({
      productId: z.string(),
      offerGroupId: z.string().nullable()
    }).parse(data)
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
    const { error } = await supabaseAdmin
      .from("products")
      .update({ offer_group_id: data.offerGroupId } as any)
      .eq("id", data.productId);
    if (error) throw error;
    return { success: true };
  });
