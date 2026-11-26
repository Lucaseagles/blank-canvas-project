import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const migration=readFileSync(new URL("../../supabase/migrations/20261126010000_rubi_distribution_campaign_uniqueness.sql",import.meta.url),"utf8");
const server=readFileSync(new URL("./rubi-movement-distribution.functions.ts",import.meta.url),"utf8");

test("distribution campaign uniqueness is serialized inside the audited transaction",()=>{
 assert.match(migration,/pg_advisory_xact_lock/);
 assert.match(migration,/hashtextextended\(v_product_id::text\|\|\x27:\x27\|\|p_channel\|\|\x27:\x27\|\|p_campaign,0\)/);
 assert.match(migration,/join public\.rubi_movement_variants v on v\.id=d\.variant_id/);
 assert.match(migration,/join public\.rubi_movements m on m\.id=v\.movement_id/);
 assert.match(migration,/m\.product_id=v_product_id/);
 assert.match(migration,/d\.channel=p_channel/);
 assert.match(migration,/d\.campaign=p_campaign/);
 assert.match(migration,/using errcode=\x272355\x27/);
});

test("database boundary validates fields independently of browser input",()=>{
 assert.match(migration,/p_channel is null or p_channel not in/);
 assert.match(migration,/p_campaign is null or p_campaign !~/);
 assert.match(migration,/p_status is null or p_status not in/);
 assert.match(migration,/char_length\(coalesce\(p_notes/);
 assert.match(migration,/char_length\(coalesce\(p_published_reference/);
 assert.match(migration,/Owner authorization required/);
 assert.match(migration,/security invoker set search_path=/);
 assert.doesNotMatch(migration,/security definer/i);
});

test("audit payload excludes private notes and publication URL",()=>{
 const start=migration.indexOf("jsonb_build_object(\x27revision\x27,saved_revision");
 assert.notEqual(start,-1);
 const end=migration.indexOf(");",start);
 assert.notEqual(end,-1);
 const payload=migration.slice(start,end);
 assert.match(payload,/\x27channel\x27,p_channel/);
 assert.match(payload,/\x27campaign\x27,p_campaign/);
 assert.doesNotMatch(payload,/p_notes|p_published_reference/);
});

test("RPC remains server-only and actor comes from authenticated Owner context",()=>{
 assert.match(migration,/revoke all on function public\.rubi_save_distribution_audited/);
 assert.match(migration,/grant execute on function public\.rubi_save_distribution_audited[^;]+to service_role/s);
 assert.match(server,/requireOwnerRole/);
 assert.match(server,/p_actor:context\.userId/);
 assert.match(server,/rpc\("rubi_save_distribution_audited"/);
});
