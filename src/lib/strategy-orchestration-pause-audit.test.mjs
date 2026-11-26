import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = readFileSync(new URL("./strategy-orchestrator.functions.ts", import.meta.url), "utf8");
const migration = readFileSync(
  new URL("../../supabase/migrations/20261125120000_rubi_strategy_orchestration_pause_audit.sql", import.meta.url),
  "utf8",
);
const handler = source.slice(source.indexOf("export const pauseStrategyOrchestration ="));

test("pause mutation remains Owner-gated and passes the verified server actor", () => {
  assert.ok(handler.includes(".middleware([requireOwnerRole])"));
  assert.ok(handler.includes("context.userId"));
  assert.ok(handler.includes("p_actor: context.userId"));
  assert.ok(handler.includes("rubi_pause_strategy_orchestration_audited"));
});

test("pause mutation no longer performs a direct table update", () => {
  assert.ok(!handler.includes('.from("strategy_orchestrations").update'));
  assert.ok(!handler.includes(".update({ status: \"paused\""));
  assert.ok(handler.includes("result?.success !== true"));
});

test("database function independently verifies the actor is an Owner", () => {
  assert.match(migration, /p_actor uuid/);
  assert.match(migration, /from public\.user_roles r[\s\S]*r\.user_id = p_actor and r\.role = 'owner'/);
  assert.ok(!migration.includes("auth.uid()"));
});

test("pause locks the row and rejects missing or invalid-state records", () => {
  assert.match(migration, /for update/i);
  assert.match(migration, /if not found then[\s\S]*Strategy orchestration not found/i);
  assert.match(migration, /v_before\.status not in \('ready', 'approved'\)/);
});

test("status mutation and sanitized audit insert share one database transaction", () => {
  const updateAt = migration.indexOf("update public.strategy_orchestrations");
  const auditAt = migration.indexOf("insert into public.admin_audit_log");
  assert.ok(updateAt > -1 && auditAt > updateAt);
  assert.match(migration, /jsonb_build_object\('status', v_before\.status\)/);
  assert.match(migration, /jsonb_build_object\('status', 'paused'\)/);
});

test("RPC execution is restricted to service_role", () => {
  assert.match(migration, /revoke all on function public\.rubi_pause_strategy_orchestration_audited\(uuid, uuid\)[\s\S]*from public, anon, authenticated/i);
  assert.match(migration, /grant execute on function public\.rubi_pause_strategy_orchestration_audited\(uuid, uuid\)[\s\S]*to service_role/i);
});

test("pause RPC uses invoker privileges and does not escalate through SECURITY DEFINER", () => {
  assert.match(migration, /security invoker/i);
  assert.doesNotMatch(migration, /security definer/i);
});


test("create mutation uses audited server-side RPC and authenticated Owner actor", () => {
  const createHandler = source.slice(source.indexOf("export const createStrategyOrchestration ="), source.indexOf("export const generateStrategyOrchestrationPlan ="));
  assert.ok(createHandler.includes(".middleware([requireOwnerRole])"));
  assert.ok(createHandler.includes("context.userId"));
  assert.ok(createHandler.includes("p_actor: context.userId"));
  assert.ok(createHandler.includes("rubi_create_strategy_orchestration_audited"));
  assert.ok(!createHandler.includes('rpc("create_strategy_orchestration"'));
});

test("audited create migration validates references and writes one atomic audit event", () => {
  const createMigration = readFileSync(
    new URL("../../supabase/migrations/20261125143000_rubi_strategy_orchestration_create_audit.sql", import.meta.url),
    "utf8",
  );
  assert.match(createMigration, /security invoker/i);
  assert.match(createMigration, /Owner authorization required/);
  assert.match(createMigration, /One or more selected strategies do not exist or are inactive/);
  assert.match(createMigration, /One or more selected videos do not exist/);
  assert.match(createMigration, /RUBI_STRATEGY_ORCHESTRATION_CREATED/);
  assert.match(createMigration, /insert into public\.admin_audit_log/i);
  assert.match(createMigration, /revoke all on function public\.rubi_create_strategy_orchestration_audited/i);
  assert.match(createMigration, /grant execute on function public\.rubi_create_strategy_orchestration_audited/i);
});


test("audited creation privileges target the exact seven-argument function signature", () => {
  const createMigration = readFileSync(
    new URL("../../supabase/migrations/20261125143000_rubi_strategy_orchestration_create_audit.sql", import.meta.url),
    "utf8",
  );
  const signature = /rubi_create_strategy_orchestration_audited\(text,text,integer,text,uuid\[\],uuid\[\],uuid\)/;
  assert.equal((createMigration.match(new RegExp(signature.source, "g")) || []).length, 3);
  assert.doesNotMatch(createMigration, /rubi_create_strategy_orchestration_audited\(text,text,integer,text,uuid\[\],uuid\[\],uuid\[\]\)/);
});


test("plan generation uses audited server RPC and authenticated Owner actor", () => {
  const handler = source.slice(source.indexOf("export const generateStrategyOrchestrationPlan ="), source.indexOf("export const approveStrategyOrchestration ="));
  assert.ok(handler.includes(".middleware([requireOwnerRole])"));
  assert.ok(handler.includes("context.userId"));
  assert.ok(handler.includes("p_actor: context.userId"));
  assert.ok(handler.includes("rubi_generate_strategy_orchestration_plan_audited"));
  assert.ok(!handler.includes('rpc("generate_strategy_orchestration_plan"'));
});

test("approval uses audited server RPC and requires a confirmed result", () => {
  const handler = source.slice(source.indexOf("export const approveStrategyOrchestration ="), source.indexOf("export const pauseStrategyOrchestration ="));
  assert.ok(handler.includes(".middleware([requireOwnerRole])"));
  assert.ok(handler.includes("context.userId"));
  assert.ok(handler.includes("p_actor: context.userId"));
  assert.ok(handler.includes("rubi_approve_strategy_orchestration_audited"));
  assert.ok(handler.includes("result?.approved !== true"));
  assert.ok(!handler.includes('rpc("approve_strategy_orchestration"'));
});

test("plan and approval migrations use invoker privileges, lock state and write atomic audit", () => {
  const planMigration = readFileSync(
    new URL("../../supabase/migrations/20261125160000_rubi_strategy_orchestration_plan_approval_audit.sql", import.meta.url),
    "utf8",
  );
  assert.match(planMigration, /rubi_generate_strategy_orchestration_plan_audited/i);
  assert.match(planMigration, /rubi_approve_strategy_orchestration_audited/i);
  assert.equal((planMigration.match(/security invoker/gi) || []).length, 2);
  assert.equal((planMigration.match(/for update/gi) || []).length, 2);
  assert.match(planMigration, /RUBI_STRATEGY_ORCHESTRATION_PLAN_GENERATED/);
  assert.match(planMigration, /RUBI_STRATEGY_ORCHESTRATION_APPROVED/);
  assert.match(planMigration, /insert into public\.admin_audit_log/);
  assert.match(planMigration, /revoke all on function public\.rubi_generate_strategy_orchestration_plan_audited/i);
  assert.match(planMigration, /revoke all on function public\.rubi_approve_strategy_orchestration_audited/i);
  assert.match(planMigration, /grant execute on function public\.rubi_generate_strategy_orchestration_plan_audited/i);
  assert.match(planMigration, /grant execute on function public\.rubi_approve_strategy_orchestration_audited/i);
  assert.doesNotMatch(planMigration, /security definer/i);
});


test("video picker and audited plan use only columns present in the videos schema", () => {
  const source = readFileSync(new URL("./strategy-orchestrator.functions.ts", import.meta.url), "utf8");
  const route = readFileSync(new URL("../routes/admin/strategy-orchestrator.tsx", import.meta.url), "utf8");
  const migration = readFileSync(
    new URL("../../supabase/migrations/20261125160000_rubi_strategy_orchestration_plan_approval_audit.sql", import.meta.url),
    "utf8",
  );
  const videoQuery = source.slice(source.indexOf("export const getStrategyOrchestrationVideos"), source.indexOf("export const createStrategyOrchestration"));
  assert.match(videoQuery, /select\("id,title,video_url,external_url,thumbnail_url"\)/);
  assert.doesNotMatch(videoQuery, /select\([^)]*platform/);
  assert.doesNotMatch(route.slice(route.indexOf("videos.map"), route.indexOf("videos.map") + 1800), /video\.platform/);
  const selectedVideos = migration.slice(migration.indexOf("selected_videos as"), migration.indexOf("  select jsonb_build_object"));
  assert.doesNotMatch(selectedVideos, /v\.platform/);
  assert.doesNotMatch(migration.slice(migration.indexOf("'videos', coalesce"), migration.indexOf("'execution', jsonb_build_object")), /'platform',platform/);
});


test("legacy orchestration mutation RPCs and direct client DML are revoked", () => {
  const hardening = readFileSync(
    new URL("../../supabase/migrations/20261125170000_rubi_strategy_orchestration_close_legacy_writes.sql", import.meta.url),
    "utf8",
  );
  assert.ok(hardening.includes("revoke all on function public.create_strategy_orchestration"));
  assert.ok(hardening.includes("create_strategy_orchestration(text, text, integer, text, uuid[])"));
  assert.ok(hardening.includes("create_strategy_orchestration(text, text, integer, text, uuid[], uuid[])"));
  assert.ok(hardening.includes("revoke all on function public.generate_strategy_orchestration_plan"));
  assert.ok(hardening.includes("revoke all on function public.approve_strategy_orchestration"));
  assert.ok(hardening.includes("revoke all on table public.strategy_orchestrations"));
  assert.ok(hardening.includes("grant select on table public.strategy_orchestrations"));
  const smoke = readFileSync(
    new URL("../../scripts/rubi-local-strategy-orchestration-pause-audit-smoke.sql", import.meta.url),
    "utf8",
  );
  assert.ok(smoke.includes("Legacy Strategy Orchestration mutation RPC remains executable"));
  assert.ok(smoke.includes("retain direct Strategy Orchestration write privileges"));
});
