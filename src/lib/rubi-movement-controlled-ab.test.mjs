import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {assignRubiABArm} from "./rubi-movement-ab-allocation.ts";
const read=p=>readFileSync(new URL(p,import.meta.url),"utf8");
const exp="00000000-0000-4000-8000-000000000001";
const visitor="00000000-0000-4000-8000-000000000099";
test("Assignment is stable for a visitor and independent of private profile fields",()=>{
 const arm=assignRubiABArm(exp,1,visitor);
 assert.equal(assignRubiABArm(exp,1,visitor),arm);
 assert.ok(["control","challenger"].includes(arm));
 assert.throws(()=>assignRubiABArm("bad",1,visitor));
 let a=0,b=0;
 for(let i=0;i<1000;i++){
  const id=`00000000-0000-4000-8000-${i.toString(16).padStart(12,"0")}`;
  if(assignRubiABArm(exp,1,id)==="control")a++;else b++;
 }
 assert.ok(a>400&&b>400,`Distribution is suspicious: ${a}/${b}`);
});
test("Experiments have owner-only write, concurrency check, rollback audit, source revision safeguards",()=>{
 const sql=read("../../supabase/migrations/20261114090000_rubi_movement_controlled_ab.sql");
 assert.match(sql,/create table if not exists public\.rubi_movement_ab_experiments/);
 assert.match(sql,/alter table public\.rubi_movement_ab_experiments enable row level security/);
 assert.match(sql,/revoke all on public\.rubi_movement_ab_experiments from public,anon,authenticated/);
 assert.match(sql,/revoke all on function public\.rubi_configure_movement_ab_audited/);
 assert.match(sql,/security invoker set search_path=''/);
 assert.match(sql,/p_expected_revision/);
 assert.match(sql,/pg_advisory_xact_lock/);
 assert.match(sql,/Another A\/B experiment is running for this SKU/);
 assert.match(sql,/insert into public\.admin_audit_log/);
 assert.match(sql,/product\.checkout_verified/);
 assert.match(sql,/v1\.media_rights_confirmed/);
 assert.match(sql,/control_revision/);
 assert.doesNotMatch(sql,/security definer/i);
});
test("Only verified published SKU/variant source revisions served; impressions do not mean paid sales",()=>{
 const fn=read("./rubi-movement-ab.functions.ts");
 const ui=read("../components/store/RubiMovementABOffer.tsx");
 const admin=read("../components/store/RubiMovementABAdmin.tsx");
 const landing=read("../components/store/RubiMovementLanding.tsx");
 const variant=read("../components/store/RubiMovementVariantsAdmin.tsx");
 assert.match(fn,/requireOwnerRole/g);
 assert.match(fn,/approvedRubiCheckout\(products\)/);
 assert.match(fn,/control\.revision!==x\.control_revision/);
 assert.match(fn,/products\.revision!==x\.product_revision/);
 assert.match(fn,/rpc\("rubi_configure_movement_ab_audited"/);
 assert.match(ui,/assignRubiABArm/);
 assert.match(ui,/RUBI_AB_EXPOSURE/);
 assert.match(ui,/RUBI_AB_CTA/);
 assert.match(ui,/outcome:"intent_only"/);
 assert.match(ui,/RubiPublishedOffer/);
 assert.match(landing,/RubiMovementABOffer/);
 assert.match(admin,/Iniciar teste 50\/50/);
 assert.match(variant,/<RubiMovementABAdmin/);
 assert.doesNotMatch(fn,/\.insert\(|\.update\(|\.upsert\(/);
});
