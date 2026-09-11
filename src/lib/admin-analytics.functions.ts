import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireOwnerRole } from "./auth-guards.server";

const Input = z.object({ days: z.coerce.number().int().min(1).max(90).default(30) });

export const getAdminMarketingAnalytics = createServerFn({ method: "GET" })
  .middleware([requireOwnerRole])
  .validator((data: unknown) => Input.parse(data ?? {}))
  .handler(async ({ data: { days } }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const since = new Date(Date.now() - days * 86400000).toISOString();
    const [eventsRes, popupRes, rulesRes, experimentsRes, assignmentsRes, campaignsRes, referralsRes] = await Promise.all([
      supabaseAdmin.from("analytics_events").select("id,event_type,user_id,metadata,created_at,source,campaign_id,product_id,session_id,anonymous_id").gte("created_at", since).order("created_at", { ascending: false }).limit(5000),
      supabaseAdmin.from("popup_events").select("id,popup_rule_id,event_type,user_id,created_at").gte("created_at", since).order("created_at", { ascending: false }).limit(5000),
      supabaseAdmin.from("popup_rules").select("id,name,trigger_type,content,is_active"),
      supabaseAdmin.from("ab_experiments").select("id,name,variant_a,variant_b,target,is_active"),
      supabaseAdmin.from("ab_assignments").select("experiment_id,variant,assigned_at").gte("assigned_at", since).limit(5000),
      supabaseAdmin.from("campaigns").select("id,name,status,starts_at,ends_at").order("created_at", { ascending: false }).limit(100),
      supabaseAdmin.from("referral_events").select("id,campaign_id,status,created_at").gte("created_at", since).not("campaign_id", "is", null).limit(5000),
    ]);
    for (const result of [eventsRes, popupRes, rulesRes, experimentsRes, assignmentsRes, campaignsRes, referralsRes]) if (result.error) throw result.error;

    const events = eventsRes.data ?? [];
    const popupEvents = popupRes.data ?? [];
    const rules = rulesRes.data ?? [];
    const campaigns = campaignsRes.data ?? [];
    const referrals = referralsRes.data ?? [];
    const ruleById = new Map(rules.map((r: any) => [r.id, r]));
    const campaignById = new Map(campaigns.map((c: any) => [c.id, c]));

    const views = popupEvents.filter((e: any) => e.event_type === "view").length;
    const clicks = popupEvents.filter((e: any) => e.event_type === "click").length;
    const timing = new Map<string, { views: number; clicks: number }>();
    for (const event of popupEvents) {
      const trigger = String((ruleById.get(event.popup_rule_id) as any)?.trigger_type ?? "unknown");
      const row = timing.get(trigger) ?? { views: 0, clicks: 0 };
      if (event.event_type === "view") row.views++;
      if (event.event_type === "click") row.clicks++;
      timing.set(trigger, row);
    }

    const byStrategy = ["bundle", "flash_deal", "upsell", "reward", "gift"].map(strategy => {
      const ids = rules.filter((r: any) => r.content?.strategy === strategy || String(r.trigger_type ?? "").toLowerCase().includes(strategy)).map((r: any) => r.id);
      const selected = popupEvents.filter((e: any) => ids.includes(e.popup_rule_id));
      const v = selected.filter((e: any) => e.event_type === "view").length;
      const c = selected.filter((e: any) => e.event_type === "click").length;
      return { strategy, views: v, clicks: c, ctr: v ? c / v * 100 : 0 };
    });

    const hour = Array.from({ length: 24 }, (_, h) => ({ hour: h, views: 0, clicks: 0 }));
    popupEvents.forEach((e: any) => {
      const bucket = hour[new Date(e.created_at).getHours()];
      if (!bucket) return;
      if (e.event_type === "view") bucket.views++;
      if (e.event_type === "click") bucket.clicks++;
    });

    const generalViews = events.filter((e: any) => ["NOTIFICATION_VIEW", "PUSH_OPEN", "IN_APP_NOTIFICATION_VIEW"].includes(e.event_type)).length;
    const generalClicks = events.filter((e: any) => ["NOTIFICATION_CLICK", "PUSH_CLICK", "IN_APP_NOTIFICATION_CLICK"].includes(e.event_type)).length;
    const roiAvailable = events.some((e: any) => typeof e.metadata?.commission_amount === "number");

    const campaignAttribution = campaigns.map((campaign: any) => {
      const campaignEvents = events.filter((e: any) => e.campaign_id === campaign.id || e.metadata?.campaign_id === campaign.id);
      const awareness = campaignEvents.filter((e: any) => e.event_type === "CAMPAIGN_VIEW").length;
      const consideration = campaignEvents.filter((e: any) => e.event_type === "PRODUCT_VIEW").length;
      const videoViews = campaignEvents.filter((e: any) => e.event_type === "video_start").length;
      const outboundClicks = campaignEvents.filter((e: any) => e.event_type === "OUTBOUND_CLICK").length;
      const activatedReferrals = referrals.filter((r: any) => r.campaign_id === campaign.id && r.status === "activated").length;
      const registeredReferrals = referrals.filter((r: any) => r.campaign_id === campaign.id && r.status === "registered").length;
      const conversionRate = awareness > 0 ? outboundClicks / awareness * 100 : 0;
      return {
        id: campaign.id,
        name: campaign.name,
        status: campaign.status,
        starts_at: campaign.starts_at,
        ends_at: campaign.ends_at,
        awareness,
        consideration,
        videoViews,
        outboundClicks,
        registeredReferrals,
        activatedReferrals,
        conversionRate,
        attributedEvents: campaignEvents.length,
      };
    }).filter((campaign: any) => campaign.attributedEvents > 0 || campaign.status === "active" || campaign.status === "scheduled");

    const totalAttributedEvents = campaignAttribution.reduce((sum: number, c: any) => sum + c.attributedEvents, 0);
    const totalOutboundClicks = campaignAttribution.reduce((sum: number, c: any) => sum + c.outboundClicks, 0);
    const totalActivatedReferrals = campaignAttribution.reduce((sum: number, c: any) => sum + c.activatedReferrals, 0);

    return {
      events, popupEvents, rules, experiments: experimentsRes.data ?? [], assignments: assignmentsRes.data ?? [], views, clicks,
      byStrategy,
      timing: Array.from(timing, ([trigger, stats]) => ({ trigger, ...stats, ctr: stats.views ? stats.clicks / stats.views * 100 : 0 })),
      hour, generalViews, generalClicks, roiAvailable, days, since,
      campaigns,
      campaignAttribution,
      attributionSummary: { campaignsTracked: campaignAttribution.length, totalAttributedEvents, totalOutboundClicks, totalActivatedReferrals, revenueAvailable: false },
    };
  });
