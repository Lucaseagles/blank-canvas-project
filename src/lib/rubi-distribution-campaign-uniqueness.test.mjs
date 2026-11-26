import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const guard=readFileSync(new URL("../../supabase/migrations/20261113011000_rubi_campaign_identity_guard.sql",import.meta.url),"utf8");
const audit=readFileSync(new URL("../../supabase/migrations/20261113080000_rubi_distribution_atomic_audit.sql",import.meta.url),"utf8");
const server=readFileSync(new URL("./rubi-movement-distribution.functions.ts",import.meta.url),"utf8");

test("existing database trigger serializes product/channel/campaign writes",()=>{
 assert.match(guard,/pg_advisory_xact_lock/);
 assert.match(guard,/hashtextextended\(/);
 assert.match(guard,/target_product::text\s*\|\|\s*\x27:\x27\s*\|\|\s*new\.channel\s*\|\|\s*\x27:\x27\s*\|\|\s*new\.campaign/);
 assert.match(guard,/m\.product_id=target_product/);
 assert.match(guard,/d\.channel=new\.channel/);
 assert.match(guard,/d\.campaign=new\.campaign/);
 assert.match(guard,/before insert or update of variant_id,channel,campaign/);
 assert.match(guard,/execute function public\.rubi_guard_movement_campaign_identity\(\)/);
});

test("guard rejects an ambiguous attribution key before the write commits",()=>{
 assert.match(guard,/if exists\s*\(/);
 assert.match(guard,/d\.id is distinct from new\.id/);
 assert.match(guard,/raise exception 'Campaign label already in use by this product and channel'/);
 assert.match(guard,/revoke all on function public\.rubi_guard_movement_campaign_identity\(\) from public,anon,authenticated/);
});

test("distribution RPC preserves atomic audit and the application binds the Owner actor",()=>{
 assert.match(audit,/insert into public\.admin_audit_log/);
 assert.match(audit,/RUBI_DISTRIBUTION_CREATED/);
 assert.match(audit,/RUBI_DISTRIBUTION_UPDATED/);
 assert.match(server,/requireOwnerRole/);
 assert.match(server,/p_actor:context\.userId/);
 assert.match(server,/rpc\("rubi_save_distribution_audited"/);
});

test("server preflight remains defense in depth and never substitutes for database locking",()=>{
 assert.match(server,/Attribution must be unambiguous/);
 assert.match(server,/Identificador de campanha já utilizado/);
 assert.match(guard,/pg_advisory_xact_lock/);
});
