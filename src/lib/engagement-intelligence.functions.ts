import { createServerFn } from "@tanstack/react-start";
import { requireOwnerRole } from "./auth-guards.server";

function groupCount(rows: Array<Record<string, unknown>>, keyCandidates: string[]) {
  const counts = new Map<string, number>();
  for (const row of rows) {
    const key = keyCandidates.map((candidate) => row[candidate]).find((value) => typeof value === "string" && value.trim());
    if (!key) continue;
    const normalized = String(key).trim();
    counts.set(normalized, (counts.get(normalized) ?? 0) + 1);
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([name, count]) => ({ name, count }));
}

export const getEngagementIntelligence = createServerFn({ method: "GET" })
  .middleware([requireOwnerRole])
  .handler(async () => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const db = supabaseAdmin as any;

    const [segments, points, badges, missions, weights] = await Promise.all([
      db.from("user_segments").select("*"),
      db.from("user_points").select("*"),
      db.from("badges").select("*"),
      db.from("missions").select("*"),
      db.from("personalization_weights").select("*")
    ]);

    const errors = [segments, points, badges, missions, weights]
      .filter((result) => result.error)
      .map((result) => String(result.error.message));

    return {
      segments: {
        totalAssignments: (segments.data ?? []).length,
        distribution: groupCount((segments.data ?? []) as Array<Record<string, unknown>>, ["segment", "segment_name", "name"]),
      },
      gamification: {
        pointRecords: (points.data ?? []).length,
        configuredBadges: (badges.data ?? []).length,
        configuredMissions: (missions.data ?? []).length,
        activeMissions: ((missions.data ?? []) as Array<Record<string, unknown>>).filter((row) => row.is_active === true).length,
      },
      personalization: {
        configuredWeights: (weights.data ?? []).length,
        weights: (weights.data ?? []).map((row: Record<string, unknown>) => ({
          key: row.signal_key ?? row.key ?? row.name ?? row.id,
          weight: row.weight,
        })),
      },
      errors,
    };
  });
