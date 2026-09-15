import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireOwnerRole } from "./auth-guards.server";

const PopupRuleSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  trigger_type: z.string(),
  audience_segment: z.string().nullable(),
  priority: z.number().int(),
  cooldown_minutes: z.number().int(),
  frequency_cap_per_day: z.number().int(),
  starts_at: z.string().nullable(),
  ends_at: z.string().nullable(),
  cta_label: z.string().nullable(),
  cta_target: z.string().nullable(),
  is_active: z.boolean(),
});

export const getExperiencePopupAdmin = createServerFn({ method: "GET" })
  .middleware([requireOwnerRole])
  .handler(async () => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const db = supabaseAdmin as any;
    const [{ data: rules, error: rulesError }, { data: events, error: eventsError }] = await Promise.all([
      db.from("popup_rules").select("id,name,trigger_type,audience_segment,priority,cooldown_minutes,frequency_cap_per_day,starts_at,ends_at,cta_label,cta_target,is_active").order("priority", { ascending: false }),
      db.from("popup_events").select("popup_rule_id,event_type,created_at").gte("created_at", new Date(Date.now() - 30 * 86400000).toISOString()).limit(5000),
    ]);
    if (rulesError) throw rulesError;
    if (eventsError) throw eventsError;
    const stats = new Map<string, { views: number; clicks: number; dismisses: number }>();
    for (const event of events ?? []) {
      const current = stats.get(event.popup_rule_id) ?? { views: 0, clicks: 0, dismisses: 0 };
      if (event.event_type === "view") current.views++;
      if (event.event_type === "click") current.clicks++;
      if (event.event_type === "dismiss") current.dismisses++;
      stats.set(event.popup_rule_id, current);
    }
    return (rules ?? []).map((raw: unknown) => {
      const rule = PopupRuleSchema.parse(raw);
      const metric = stats.get(rule.id) ?? { views: 0, clicks: 0, dismisses: 0 };
      return { ...rule, ...metric, ctr: metric.views > 0 ? Number(((metric.clicks / metric.views) * 100).toFixed(1)) : 0 };
    });
  });

export const updateExperiencePopup = createServerFn({ method: "POST" })
  .middleware([requireOwnerRole])
  .inputValidator((data: unknown) => z.object({
    id: z.string().uuid(),
    patch: z.object({
      priority: z.number().int().min(0).max(100),
      cooldown_minutes: z.number().int().min(0).max(10080),
      frequency_cap_per_day: z.number().int().min(0).max(100),
      starts_at: z.string().datetime({ offset: true }).nullable(),
      ends_at: z.string().datetime({ offset: true }).nullable(),
      cta_label: z.string().trim().max(200).nullable(),
      cta_target: z.string().trim().max(2000).nullable(),
      is_active: z.boolean(),
    }),
  }).parse(data))
  .handler(async ({ data }) => {
    if (data.patch.starts_at && data.patch.ends_at && new Date(data.patch.ends_at) <= new Date(data.patch.starts_at)) {
      throw new Error("A data final do pop-up deve ser posterior à inicial.");
    }
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row, error } = await (supabaseAdmin as any).from("popup_rules").update(data.patch).eq("id", data.id).select("*").single();
    if (error) throw error;
    return row;
  });
