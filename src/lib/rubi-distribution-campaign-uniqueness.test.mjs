import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const migration=readFileSync(new URL("../../supabase/migrations/20261126010000_rubi_distribution_campaign_uniqueness.sql",import.meta.url),"utf8");
const server=readFileSync(new URL("./rubi-movement-distribution.functions.ts",import.meta.url),"utf8");

test("distribution campaign uniqueness is serialized inside the audited transaction",()=>{
 assert.match(migration,/pg_advisory_xact_lock/);
 assert.match(migration,/hashtextextended\(v_product_id::text\|\|':'\|\|p_channel\|\|':'\|\|p_campaign,0\)/);
 assert.match(migration,/join public\.rubi_movement_variants v on v\.id=d\.variant_id/);
 assert.match(migration,/join public\.rubi_movements m on m\.id=v\.movement_id/);
 assert.match(migration,/m\.product_id=v_product_id/);
 assert.match(migration,/d\.channel=p_channel/);
 assert.match(migration,/d\.campaign=p_campaign/);
 assert.match(migration,/using errcode='23505'/);
});

test("database boundary validates channel, campaign and metadata independent of browser",()=>{
 assert.match(migration,/p_channel not in \('instagram','tiktok','youtube','facebook','pinterest','whatsapp','telegram'\)/);
 assert.match(migration,/p_campaign !~ '\^\[a-z0-9\]/);
 assert.match(migration,/char_length\(coalesce\(p_notes,''\)\)>1500/);
 assert.match(migration,/char_length\(coalesce\(p_published_reference,''\)\)>500/);
 assert.match(migration,/Owner authorization required/);
 assert.match(migration,/security invoker set search_path=''/);
 assert.doesNotMatch(migration,/security definer/i);
});

test("audit remains atomic and does not record private notes or publication URL",()=>{
 const audit=migration.slice(migration.indexOf("insert into public.admin_audit_log"));
 assert.match(audit,/RUBI_DISTRIBUTION_CREATED/);
 assert.match(audit,/RUBI_DISTRIBUTION_UPDATED/);
 assert.match(audit,/return query select saved_id,saved_revision/);
 const payloadStart=audit.indexOf("jsonb_build_object('revision',saved_revision");
 const payloadEnd=audit.indexOf(");",payloadStart);
 assert.notEqual(payloadStart,-1);
 assert.notEqual(payloadEnd,-1);
 assert.doesNotMatch(audit.slice(payloadStart,payloadEnd),/p_notes|p_published_reference/);
});

test("RPC stays server-only and application still binds actor to authenticated Owner",()=>{
 assert.match(migration,/revoke all on function public\.rubi_save_distribution_audited/);
 assert.match(migration,/to service_role/);
 assert.match(server,/requireOwnerRole/g);
 assert.match(server,/p_actor:context\.userId/);
 assert.match(server,/rpc\("rubi_save_distribution_audited"/);
});
