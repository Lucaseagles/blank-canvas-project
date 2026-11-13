import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=(p)=>readFileSync(new URL(p,import.meta.url),"utf8");

test("All three critical commercial decisions commit together with Master audit",()=>{
 const sql=read("../../supabase/migrations/20261113140000_rubi_partner_commercial_decisions_atomic.sql");
 for(const name of ["rubi_decide_commercial_profile_audited","rubi_set_partner_agreement_audited","rubi_set_partner_product_grant_audited"]){
  assert.match(sql,new RegExp("create or replace function public\\."+name));
  assert.match(sql,new RegExp("revoke all on function public\\."+name));
  assert.match(sql,new RegExp("grant execute on function public\\."+name));
 }
 assert.equal((sql.match(/insert into public\.admin_audit_log/g)??[]).length,3);
 assert.equal((sql.match(/security invoker set search_path=''/g)??[]).length,3);
 assert.equal((sql.match(/for update;/g)??[]).length>=5,true);
 assert.match(sql,/p_expected_revision is distinct from existing\.revision/);
 assert.match(sql,/original\.status<>'pending'/);
 assert.match(sql,/profile_status<>'approved'/);
 assert.match(sql,/product_record\.checkout_verified/);
 assert.doesNotMatch(sql,/security definer/);
});
test("Server uses only audited RPC for grants, agreements and commercial approvals",()=>{
 const files=[
  ["./partner-product-grants.functions.ts","rubi_set_partner_product_grant_audited"],
  ["./partner-agreements-admin.functions.ts","rubi_set_partner_agreement_audited"],
  ["./commercial-approvals.functions.ts","rubi_decide_commercial_profile_audited"]
 ];
 for(const [path,rpc] of files){
  const s=read(path);
  assert.match(s,/requireOwnerRole/);
  assert.ok(s.includes('.rpc("'+rpc+'"'));
  assert.match(s,/p_actor: context\.userId/);
  const mutation=s.slice(s.indexOf('export const '+(rpc.includes('grant')?'setPartnerProductGrantAdmin':rpc.includes('agreement')?'setPartnerAgreementAdmin':'decideCommercialApprovalAdmin')));
  assert.doesNotMatch(mutation,/\.upsert\(|\.update\(\{/);
 }
 const grant=read("../routes/admin/partner-products.tsx");
 const agreement=read("../routes/admin/partner-agreements.tsx");
 assert.match(grant,/expectedRevision: selected\?\.revision \?\? null/);
 assert.match(agreement,/expectedRevision: agreement\?\.revision \?\? null/);
});
