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
