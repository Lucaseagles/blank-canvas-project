import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=p=>readFileSync(new URL(p,import.meta.url),"utf8");
test("Offers and complementary editor writes are Owner-audited and revision-locked",()=>{
 const sql=read("../../supabase/migrations/20261114030000_rubi_offer_complementary_atomic_audit.sql");
 for(const name of ["rubi_save_offer_playbook_audited","rubi_set_offer_playbook_publication_audited","rubi_save_complementary_offer_audited"]){
  assert.ok(sql.includes("create or replace function public."+name));
  assert.ok(sql.includes("revoke all on function public."+name));
  assert.ok(sql.includes("grant execute on function public."+name));
 }
 assert.equal((sql.match(/insert into public\.admin_audit_log/g)??[]).length,3);
 assert.equal((sql.match(/security invoker set search_path=''/g)??[]).length,3);
 assert.match(sql,/prior.revision is distinct from p_expected_revision/);
 assert.match(sql,/current_offer.revision<>p_expected_revision/);
 assert.match(sql,/old_row.revision is distinct from p_expected_revision/);
 assert.match(sql,/product.checkout_verified/);
 assert.match(sql,/main_product.checkout_verified/);
 assert.doesNotMatch(sql,/security definer/);
});
test("No direct commercial offer writes can bypass audited functions",()=>{
 const offer=read("./rubi-offer-playbook.functions.ts");
 const complement=read("./rubi-complementary-offers.functions.ts");
 assert.match(offer,/rpc\("rubi_save_offer_playbook_audited"/);
 assert.match(offer,/rpc\("rubi_set_offer_playbook_publication_audited"/);
 assert.match(complement,/rpc\("rubi_save_complementary_offer_audited"/);
 assert.doesNotMatch(offer,/\.upsert\(|\.update\(|\.insert\(/);
 assert.doesNotMatch(complement,/\.upsert\(|\.update\(|\.insert\(/);
 assert.match(read("../components/store/RubiOfferEngineAdmin.tsx"),/expectedRevision:draft.revision/);
 assert.match(read("../components/store/RubiComplementaryOffersAdmin.tsx"),/revision:editingRevision/);
});
