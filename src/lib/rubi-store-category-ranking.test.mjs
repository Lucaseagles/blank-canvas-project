import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {rankRubiStoreCatalog} from "./rubi-store-category-ranking.ts";
const read=p=>readFileSync(new URL(p,import.meta.url),"utf8");
const products=[
 {id:"1",category:"Casa"},{id:"2",category:"Beleza"},{id:"3",category:"Casa"},
 {id:"4",category:"Eletrônicos"},{id:"5",category:"Casa"},{id:"6",category:"Casa"},
 {id:"7",category:"Beleza"},{id:"8",category:"Casa"},{id:"9",category:"Casa"}
];
test("Store ranks opted-in categories while reserving discovery, never dropping products",()=>{
 const ranked=rankRubiStoreCatalog(products,[{name:"Casa",slug:"casa",score:1}]);
 assert.deepEqual(ranked.map(p=>p.id),["1","3","5","2","6","8","9","4","7"]);
 assert.deepEqual([...ranked.map(p=>p.id)].sort(),products.map(p=>p.id).sort());
 assert.equal(ranked.length,products.length);
});
test("Store ranking is stable for anonymous, unknown and invalid interests",()=>{
 for(const preferences of [[],[{name:"Esportes",slug:"esportes",score:1}],
  [{name:"Casa",slug:"casa",score:-10}],[{name:"Casa",slug:"casa",score:Number.NaN}]]){
  assert.deepEqual(rankRubiStoreCatalog(products,preferences).map(p=>p.id),products.map(p=>p.id));
 }
});
test("Store may recommend eligible products only; selection stays in validated public catalog",()=>{
 const source=read("./rubi-store-interest.functions.ts");
 const catalog=read("./hub-catalog.functions.ts");
 const shop=read("../routes/hub-shop.tsx");
 assert.match(source,/supabaseAdmin.auth.getUser\(data.accessToken\)/);
 assert.match(source,/eq\("user_id",user.user.id\)/);
 assert.match(source,/preferred_categories/);
 assert.doesNotMatch(source,/user_interests|content_affinity_log/);
 assert.match(catalog,/approvedRubiCheckout\(p\)/);
 assert.match(shop,/rankRubiStoreCatalog\(products,interests.data\?\?\[\]\)/);
 assert.match(shop,/<option value="recommended">Para você<\/option>/);
 assert.match(shop,/sort==="recommended"\?ranked:products/);
 assert.doesNotMatch(source,/\.insert\(|\.update\(|\.upsert\(/);
});
