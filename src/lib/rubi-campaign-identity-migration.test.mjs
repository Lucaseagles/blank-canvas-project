import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const migration=readFileSync(new URL("../../supabase/migrations/20261113011000_rubi_campaign_identity_guard.sql",import.meta.url),"utf8");
test("same SKU campaign labels use transaction scoped database guard",()=>{
 assert.match(migration,/pg_advisory_xact_lock\(hashtextextended\(/);
 assert.match(migration,/target_product::text/);
 assert.match(migration,/d\.channel=new\.channel and d\.campaign=new\.campaign/);
 assert.match(migration,/d\.id is distinct from new\.id/);
 assert.match(migration,/before insert or update of variant_id,channel,campaign/);
 assert.match(migration,/revoke all on function public\.rubi_guard_movement_campaign_identity\(\)/);
 assert.doesNotMatch(migration,/create policy|grant select|createCheckout|payCommission/);
});
