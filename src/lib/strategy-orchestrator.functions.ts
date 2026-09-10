import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireOwnerRole } from "./auth-guards.server";

const Objective = z.enum(["traffic", "engagement", "followers", "conversion", "awareness"]);

export type StrategyOrchestration = {
  id: string;
  name: string;
  objective: z.infer<typeof Objective>;
  status: "draft" | "ready" | "approved" | "paused" | "completed";
  priority: number;
  plan: Record<string, unknown>;
  notes: string | null;
  scheduled_start: string | null;
  scheduled_end: string | null;
  created_at: string;
  updated_at: string;
};

async function db() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin as any;
}

export const listStrategyOrchestrations = createServerFn({ method: "GET" }).middleware([requireOwnerRole]).handler(async (): Promise<StrategyOrchestration[]> => {
  const supabase = await db();
  const { data, error } = await supabase.from("strategy_orchestrations").select("*").order("priority", { ascending: false }).order("updated_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as StrategyOrchestration[];
});

export const getStrategyOrchestrationOptions = createServerFn({ method: "GET" }).middleware([requireOwnerRole]).handler(async () => {
  const supabase = await db();
  const { data, error } = await supabase.from("social_channel_strategies").select("id,name,objective,priority,channel:social_channels(channel_name,platform)").eq("is_active", true).order("priority", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Array<{ id: string; name: string; objective: string; priority: number; channel?: { channel_name: string; platform: string } | null }>;
});

export const createStrategyOrchestration = createServerFn({ method: "POST" }).middleware([requireOwnerRole]).validator((data: unknown) => z.object({ name: z.string().trim().min(2).max(160), objective: Objective, priority: z.number().int().min(0).max(100), notes: z.string().trim().max(1000).optional().nullable(), strategy_ids: z.array(z.string().uuid()).max(50) }).parse(data)).handler(async ({ data }) => {
  const supabase = await db();
  const { data: id, error } = await supabase.rpc("create_strategy_orchestration", { p_name: data.name, p_objective: data.objective, p_priority: data.priority, p_notes: data.notes ?? null, p_strategy_ids: data.strategy_ids });
  if (error) throw error;
  return { id: id as string };
});

export const generateStrategyOrchestrationPlan = createServerFn({ method: "POST" }).middleware([requireOwnerRole]).validator((data: unknown) => z.object({ id: z.string().uuid() }).parse(data)).handler(async ({ data }) => {
  const supabase = await db();
  const { data: plan, error } = await supabase.rpc("generate_strategy_orchestration_plan", { p_orchestration_id: data.id });
  if (error) throw error;
  return plan as Record<string, unknown>;
});

export const approveStrategyOrchestration = createServerFn({ method: "POST" }).middleware([requireOwnerRole]).validator((data: unknown) => z.object({ id: z.string().uuid() }).parse(data)).handler(async ({ data }) => {
  const supabase = await db();
  const { data: approved, error } = await supabase.rpc("approve_strategy_orchestration", { p_orchestration_id: data.id });
  if (error) throw error;
  return { approved: Boolean(approved) };
});

export const pauseStrategyOrchestration = createServerFn({ method: "POST" }).middleware([requireOwnerRole]).validator((data: unknown) => z.object({ id: z.string().uuid() }).parse(data)).handler(async ({ data }) => {
  const supabase = await db();
  const { error } = await supabase.from("strategy_orchestrations").update({ status: "paused", updated_at: new Date().toISOString() }).eq("id", data.id).in("status", ["ready", "approved"]);
  if (error) throw error;
  return { success: true };
});
