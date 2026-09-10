import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireOwnerRole } from "@/lib/auth-guards.server";

const periodSchema = z.object({ days: z.number().int().min(1).max(90).default(30) });
const VIEW_EVENTS = ["PRODUCT_VIEW", "product_view"] as const;
const CLICK_EVENTS = ["OUTBOUND_CLICK", "AFFILIATE_CLICK", "outbound_click"] as const;
const TRACKED_EVENTS = [...VIEW_EVENTS, ...CLICK_EVENTS] as const;
const PAGE_SIZE = 1000;

type ProductRow = {
  id: string;
  slug: string;
  title: string;
  current_price: number | null;
  status: string;
  category_id: string | null;
  categories: { name: string | null } | null;
  affiliate_url: string | null;
  images: unknown;
  offer_score: number | null;
};

type EventRow = { product_id: string | null; category_id: string | null; event_type: string; created_at: string };

type PerformanceProduct = {
  id: string;
  slug: string;
  title: string;
  current_price: number | null;
  status: string;
  category_id: string | null;
  affiliate_url: string | null;
  images: string[] | null;
  offer_score: number | null;
  category_name: string;
  views: number;
  clicks: number;
  ctr: number;
  has_affiliate_link: boolean;
};

type SellerPerformance = {
  periodDays: number;
  summary: { products: number; published: number; linkedProducts: number; totalViews: number; totalClicks: number; ctr: number };
  products: PerformanceProduct[];
  categories: { id: string; name: string; views: number; clicks: number; products: number }[];
  trending: PerformanceProduct[];
};

export const getSellerPerformance = createServerFn({ method: "GET" })
  .middleware([requireOwnerRole])
  .inputValidator((data) => periodSchema.parse(data ?? {}))
  .handler(async ({ data }): Promise<SellerPerformance> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const since = new Date(Date.now() - data.days * 86400000).toISOString();

    const products: ProductRow[] = [];
    for (let from = 0; ; from += PAGE_SIZE) {
      const { data: page, error } = await supabaseAdmin
        .from("products")
        .select("id,slug,title,current_price,status,category_id,affiliate_url,images,offer_score,categories:category_id(name)")
        .order("offer_score", { ascending: false, nullsFirst: false })
        .range(from, from + PAGE_SIZE - 1);
      if (error) throw error;
      const rows = (page ?? []) as unknown as ProductRow[];
      products.push(...rows);
      if (rows.length < PAGE_SIZE) break;
    }

    const events: EventRow[] = [];
    for (let from = 0; ; from += PAGE_SIZE) {
      const { data: page, error } = await supabaseAdmin
        .from("analytics_events")
        .select("product_id,category_id,event_type,created_at")
        .gte("created_at", since)
        .in("event_type", TRACKED_EVENTS)
        .order("created_at", { ascending: true })
        .range(from, from + PAGE_SIZE - 1);
      if (error) throw error;
      const rows = (page ?? []) as EventRow[];
      events.push(...rows);
      if (rows.length < PAGE_SIZE) break;
    }

    const views = new Map<string, number>();
    const clicks = new Map<string, number>();
    const categoryViews = new Map<string, number>();
    const categoryClicks = new Map<string, number>();

    for (const event of events) {
      const isView = VIEW_EVENTS.includes(event.event_type as (typeof VIEW_EVENTS)[number]);
      const isClick = CLICK_EVENTS.includes(event.event_type as (typeof CLICK_EVENTS)[number]);
      if (event.product_id) {
        if (isView) views.set(event.product_id, (views.get(event.product_id) ?? 0) + 1);
        if (isClick) clicks.set(event.product_id, (clicks.get(event.product_id) ?? 0) + 1);
      }
      if (event.category_id) {
        if (isView) categoryViews.set(event.category_id, (categoryViews.get(event.category_id) ?? 0) + 1);
        if (isClick) categoryClicks.set(event.category_id, (categoryClicks.get(event.category_id) ?? 0) + 1);
      }
    }

    const performance: PerformanceProduct[] = products.map((product) => {
      const productViews = views.get(product.id) ?? 0;
      const productClicks = clicks.get(product.id) ?? 0;
      const { categories, images, ...rest } = product;
      return {
        ...rest,
        images: Array.isArray(images) ? (images as string[]) : null,
        category_name: product.categories?.name ?? "Sem categoria",
        views: productViews,
        clicks: productClicks,
        ctr: productViews > 0 ? (productClicks / productViews) * 100 : 0,
        has_affiliate_link: Boolean(product.affiliate_url),
      };
    });

    const categoryMap = new Map<string, { id: string; name: string; views: number; clicks: number; products: number }>();
    for (const product of products) {
      if (!product.category_id) continue;
      const current = categoryMap.get(product.category_id) ?? {
        id: product.category_id,
        name: product.categories?.name ?? "Sem categoria",
        views: 0,
        clicks: 0,
        products: 0,
      };
      current.views = categoryViews.get(product.category_id) ?? 0;
      current.clicks = categoryClicks.get(product.category_id) ?? 0;
      current.products += 1;
      categoryMap.set(product.category_id, current);
    }

    const totalViews = events.reduce((total, event) => total + (VIEW_EVENTS.includes(event.event_type as (typeof VIEW_EVENTS)[number]) ? 1 : 0), 0);
    const totalClicks = events.reduce((total, event) => total + (CLICK_EVENTS.includes(event.event_type as (typeof CLICK_EVENTS)[number]) ? 1 : 0), 0);
    const linkedProducts = products.filter((p) => Boolean(p.affiliate_url)).length;

    return {
      periodDays: data.days,
      summary: {
        products: products.length,
        published: products.filter((p) => p.status === "published" || p.status === "active").length,
        linkedProducts,
        totalViews,
        totalClicks,
        ctr: totalViews > 0 ? (totalClicks / totalViews) * 100 : 0,
      },
      products: performance.sort((a, b) => b.clicks - a.clicks || b.views - a.views),
      categories: Array.from(categoryMap.values()).sort((a, b) => b.clicks - a.clicks || b.views - a.views),
      trending: performance
        .filter((p) => p.views > 0)
        .sort((a, b) => b.views - a.views || b.clicks - a.clicks)
        .slice(0, 10),
    };
  });

export const setSellerProductStatus = createServerFn({ method: "POST" })
  .middleware([requireOwnerRole])
  .inputValidator((data) => z.object({ id: z.string().uuid(), status: z.enum(["draft", "published", "archived", "active"]) }).parse(data))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: current, error: readError } = await supabaseAdmin.from("products").select("id,status").eq("id", data.id).single();
    if (readError) throw readError;
    if (current.status === data.status) return { success: true, id: data.id, status: data.status, changed: false };

    const { error } = await supabaseAdmin
      .from("products")
      .update({ status: data.status, updated_at: new Date().toISOString() })
      .eq("id", data.id);
    if (error) throw error;

    const { error: auditError } = await context.supabase.rpc("append_admin_audit", {
      p_action_type: "SELLER_PRODUCT_STATUS_CHANGED",
      p_entity_type: "product",
      p_entity_id: data.id,
      p_previous_value: { status: current.status },
      p_new_value: { status: data.status },
    });
    if (auditError) throw auditError;

    return { success: true, id: data.id, status: data.status, changed: true };
  });
