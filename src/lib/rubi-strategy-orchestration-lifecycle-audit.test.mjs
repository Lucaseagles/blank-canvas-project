import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8");

test("all orchestration lifecycle RPCs verify the server-derived Owner and atomically audit mutations", () => {
  const sql = read("../../supabase/migrations/20261121100000_rubi_strategy_orchestration_lifecycle_audit.sql");
  const api = read("./strategy-orchestrator.functions.ts");
  const actions = [
    ["create_strategy_orchestration", "RUBI_STRATEGY_ORCHESTRATION_CREATED"],
    ["generate_strategy_orchestration_plan", "RUBI_STRATEGY_ORCHESTRATION_PLAN_GENERATED"],
    ["approve_strategy_orchestration", "RUBI_STRATEGY_ORCHESTRATION_APPROVED"],
    ["rubi_pause_strategy_orchestration_audited", "RUBI_STRATEGY_ORCHESTRATION_PAUSED"],
  ];
  for (const [rpc, event] of actions) {
    assert.match(sql, new RegExp("create function public\\." + rpc + "\\("));
    assert.match(sql, new RegExp(event));
  }
  assert.equal((sql.match(/p_actor is null or not exists/g) ?? []).length, 4);
  assert.equal((sql.match(/from public\.user_roles r where r\.user_id=p_actor and r\.role='owner'/g) ?? []).length, 4);
  assert.equal((sql.match(/insert into public\.admin_audit_log/g) ?? []).length, 4);
  assert.equal((sql.match(/for update/g) ?? []).length, 3);
  assert.match(sql, /grant execute on function public\.create_strategy_orchestration\(text,text,integer,text,uuid\[\],uuid\[\],uuid\) to service_role/);
  assert.match(sql, /grant execute on function public\.generate_strategy_orchestration_plan\(uuid,uuid\) to service_role/);
  assert.match(sql, /grant execute on function public\.approve_strategy_orchestration\(uuid,uuid\) to service_role/);
  assert.match(sql, /grant execute on function public\.rubi_pause_strategy_orchestration_audited\(uuid,uuid\) to service_role/);
  assert.equal((api.match(/p_actor: context\.userId/g) ?? []).length, 4);
  assert.match(api, /rpc\("rubi_pause_strategy_orchestration_audited"/);
  assert.doesNotMatch(api, /from\("strategy_orchestrations"\)\.update\(/);
});

test("strategy orchestration keeps its existing status transitions and execution plan contract", () => {
  const sql = read("../../supabase/migrations/20261121100000_rubi_strategy_orchestration_lifecycle_audit.sql");
  assert.match(sql, /before_status not in \('ready','paused'\)/);
  assert.match(sql, /before_status not in \('ready','approved'\)/);
  assert.match(sql, /'approval_required',true/);
  assert.match(sql, /'Use existing scheduled_posts \/ publishing engine'/);
  assert.match(sql, /'strategy_count'/);
  assert.match(sql, /'video_count'/);
});
test("create RPC revoke and grant signatures match the declared SQL function", () => {
  const sql = read("../../supabase/migrations/20261121100000_rubi_strategy_orchestration_lifecycle_audit.sql");
  const signature = "create_strategy_orchestration(text,text,integer,text,uuid[],uuid[],uuid)";
  assert.match(sql, new RegExp("revoke all on function public\\\\." + signature.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\\\$&") + " from public,anon,authenticated"));
  assert.match(sql, new RegExp("grant execute on function public\\\\." + signature.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\\\$&") + " to service_role"));
});
