import { createServerFn } from "@tanstack/react-start";
import { requireOwnerRole } from "./auth-guards.server";

export type ChannelStrategyMatrix = {
  objectives: string[];
  channels: Array<{
    platform: string;
    channel_id: string;
    channel_name: string;
    objectives: Record<string, { count: number; frequency: number; priority: number; collections: number; campaigns: number }>;
  }>;
  totals: { strategies: number; channels: number; collections: number; campaigns: number };
};

async function db() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin as any;
}

export const getChannelStrategyMatrix = createServerFn({ method: "GET" })
  .middleware([requireOwnerRole])
  .handler(async (): Promise<ChannelStrategyMatrix> => {
    const supabase = await db();
    const { data, error } = await supabase
      .from("social_channel_strategies")
      .select("id,objective,priority,posting_frequency_per_week,channel:social_channels(id,channel_name,platform),collection:curated_collections(id,title),campaign:campaigns(id,name)")
      .eq("is_active", true)
      .order("priority", { ascending: false });
    if (error) throw error;

    type Row = {
      id: string; objective: string; priority: number; posting_frequency_per_week: number;
      channel?: { id: string; channel_name: string; platform: string } | null;
      collection?: { id: string; title: string } | null;
      campaign?: { id: string; name: string } | null;
    };
    const rows = (data ?? []) as Row[];
    const objectives = ["traffic", "engagement", "followers", "conversion", "awareness"];
    const byChannel = new Map<string, ChannelStrategyMatrix["channels"][number]>();

    for (const row of rows) {
      if (!row.channel) continue;
      const channel = byChannel.get(row.channel.id) ?? {
        platform: row.channel.platform,
        channel_id: row.channel.id,
        channel_name: row.channel.channel_name,
        objectives: {},
      };
      const cell = channel.objectives[row.objective] ?? { count: 0, frequency: 0, priority: 0, collections: 0, campaigns: 0 };
      cell.count += 1;
      cell.frequency += row.posting_frequency_per_week || 0;
      cell.priority = Math.max(cell.priority, row.priority || 0);
      if (row.collection) cell.collections += 1;
      if (row.campaign) cell.campaigns += 1;
      channel.objectives[row.objective] = cell;
      byChannel.set(row.channel.id, channel);
    }

    return {
      objectives,
      channels: Array.from(byChannel.values()),
      totals: {
        strategies: rows.length,
        channels: byChannel.size,
        collections: rows.filter((row) => !!row.collection).length,
        campaigns: rows.filter((row) => !!row.campaign).length,
      },
    };
  });
