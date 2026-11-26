import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8");

test("smart collection tables preserve public reads but deny direct client writes", () => {
  const sql = read("../../supabase/migrations/20261125195000_rubi_smart_collection_server_only_grants.sql");
  assert.match(sql, /revoke all privileges on table[\s\S]*curated_collections[\s\S]*collection_items[\s\S]*collection_candidates[\s\S]*from public, anon, authenticated/i);
  assert.match(sql, /grant select on table[\s\S]*curated_collections[\s\S]*collection_items[\s\S]*to anon, authenticated/i);
  assert.match(sql, /grant all privileges on table[\s\S]*curated_collections[\s\S]*collection_items[\s\S]*collection_candidates[\s\S]*to service_role/i);
  assert.match(sql, /all mutations must use the Owner-gated audited server RPC/i);
});

test("storefront remains on public SELECT while admin reads and writes use server-only functions", () => {
  const storefront = read("../routes/collections/$slug.tsx");
  const api = read("./smart-collections.functions.ts");
  assert.match(storefront, /supabase\.from\("curated_collections"\)\.select/);
  assert.match(storefront, /supabase\.from\("collection_items"\)\.select/);
  assert.match(api, /async function client\(\)[\s\S]*supabaseAdmin/);
  for (const name of ["saveSmartCollection", "deleteSmartCollection", "generateSmartCandidates", "reviewSmartCandidate", "prioritizeSmartCandidate"]) {
    const start = api.indexOf(`export const ${name}`);
    const end = api.indexOf("\nexport const ", start + 1);
    const section = api.slice(start, end < 0 ? undefined : end);
    assert.ok(section.includes("middleware([requireOwnerRole])"), name);
    assert.ok(section.includes('rpc("rubi_manage_smart_collection_audited"'), name);
    assert.ok(section.includes("p_actor: context.userId"), name);
  }
});
