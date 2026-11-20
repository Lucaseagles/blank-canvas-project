import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8");

test("smart collection writes and candidate generation use one Owner-gated audited RPC", () => {
  const api = read("./smart-collections.functions.ts");
  for (const name of ["saveSmartCollection", "deleteSmartCollection", "generateSmartCandidates", "prioritizeSmartCandidate"]) {
    const start = api.indexOf(`export const ${name}`);
    const end = api.indexOf("\nexport const ", start + 1);
    const section = api.slice(start, end < 0 ? undefined : end);
    assert.ok(section.includes("middleware([requireOwnerRole])"), name);
    assert.ok(section.includes('rpc("rubi_manage_smart_collection_audited"'), name);
    assert.ok(section.includes("p_actor: context.userId"), name);
  }
  assert.doesNotMatch(api, /\.from\("curated_collections"\)\.(insert|update|delete)/);
  assert.doesNotMatch(api, /\.from\("collection_candidates"\)\.update/);
  assert.doesNotMatch(api, /rpc\("generate_collection_candidates"/);
});

test("smart collection RPC locks mutable rows, validates Owner and audits every write in-transaction", () => {
  const sql = read("../../supabase/migrations/20261120190000_rubi_smart_collection_atomic_audit.sql");
  for (const token of [
    "security invoker", "set search_path=''", "Owner authorization required",
    "for update", "insert into public.admin_audit_log",
    "RUBI_SMART_COLLECTION_CREATED", "RUBI_SMART_COLLECTION_UPDATED",
    "RUBI_SMART_COLLECTION_DELETED", "RUBI_COLLECTION_CANDIDATE_PRIORITIZED",
    "RUBI_SMART_COLLECTION_CANDIDATES_GENERATED",
    "items_deleted", "candidates_deleted", "to service_role",
  ]) assert.ok(sql.includes(token), token);
  assert.match(sql, /revoke all on function public\.rubi_manage_smart_collection_audited\(text,uuid,jsonb,uuid\)[\s\S]*from public,anon,authenticated/);
});
