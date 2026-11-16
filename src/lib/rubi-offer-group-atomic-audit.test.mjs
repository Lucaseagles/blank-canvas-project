import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=p=>readFileSync(new URL(p,import.meta.url),"utf8");
test("offer lifecycle, product links and featured controls require Owner and atomic audit",()=>{
 const api=read("./admin_intel.functions.ts");
 const ui=read("../components/admin/offers/OfferFeaturedControl.tsx");
 const sql=read("../../supabase/migrations/20261115163000_rubi_offer_group_atomic_audit.sql");
 const offer=api.slice(api.indexOf("export const saveOfferGroup"));
 assert.equal((offer.match(/rpc\("rubi_manage_offer_group_audited"/g)||[]).length,4);
 assert.equal((offer.match(/p_actor:context\.userId/g)||[]).length,4);
 assert.match(sql,/security invoker set search_path=''/);
 assert.match(sql,/r\.role='owner'/);
 assert.match(sql,/for update/);
 assert.match(sql,/for key share/);
 assert.match(sql,/insert into public\.admin_audit_log/);
 assert.match(sql,/delete from public\.offer_groups/);
 assert.match(sql,/Cannot delete group linked to products/);
 assert.match(sql,/revoke insert,update,delete on public\.offer_groups/);
 assert.match(sql,/to service_role/);
 assert.doesNotMatch(offer,/\.from\("offer_groups".*\.update\(/s);
 assert.doesNotMatch(ui,/\.from\('offer_groups'\)\.update/);
 assert.match(ui,/useServerFn\(setOfferGroupFeaturedAdmin\)/);
 assert.match(ui,/updateFeatured\(\{data:\{id,patch\}\}\)/);
 const lastHandler=api.slice(api.indexOf("export const setOfferGroupFeaturedAdmin"));
 assert.equal((lastHandler.match(/createServerFn\(/g)??[]).length,1,
  "No orphan server function may bypass the audited offer-group RPC");
 assert.doesNotMatch(lastHandler,/\.from\("products"\)\.update\(/);
 assert.doesNotMatch(lastHandler,/\.from\("admin_audit_log"\)\.insert\(/);

});
