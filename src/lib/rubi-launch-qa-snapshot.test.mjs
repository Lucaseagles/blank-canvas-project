import test from "node:test";
import assert from "node:assert/strict";
import {rubiQaCommercialSnapshot,rubiQaSnapshotCurrent} from "./rubi-launch-qa-snapshot.ts";
import {readFileSync} from "node:fs";
const sample={id:"p1",supplier_id:"s1",active:true,retail_price:49.9,checkout_url:"https://checkout.example.com/pay",checkout_verified:true,hub_suppliers:{active:true,checkout_host:"checkout.example.com"}};
test("Review becomes stale after checkout, price or supplier changes",()=>{
 const snapshot=rubiQaCommercialSnapshot(sample);
 assert.equal(rubiQaSnapshotCurrent(snapshot,sample),true);
 assert.equal(rubiQaSnapshotCurrent(snapshot,{...sample,retail_price:59.9}),false);
 assert.equal(rubiQaSnapshotCurrent(snapshot,{...sample,checkout_url:"https://checkout.example.com/new"}),false);
 assert.equal(rubiQaSnapshotCurrent(snapshot,{...sample,checkout_verified:false}),false);
 assert.equal(rubiQaSnapshotCurrent(snapshot,{...sample,supplier_id:"s2"}),false);
 assert.equal(rubiQaSnapshotCurrent(snapshot,{...sample,hub_suppliers:{...sample.hub_suppliers,active:false}}),false);
 assert.equal(rubiQaSnapshotCurrent(null,sample),false);
});
test("Readiness uses snapshot before counting manually verified gates",()=>{
 const text=readFileSync(new URL("./rubi-launch-readiness.functions.ts",import.meta.url),"utf8");
 assert.match(text,/rubiQaSnapshotCurrent\(qa\.snapshot,product\)/);
 assert.match(text,/current\?qa!\.checklist:null/);
 assert.match(text,/qaStale:!!qa&&!current/);
});
test("Owner-only QA save records the latest commercial snapshot",()=>{
 const text=readFileSync(new URL("./rubi-launch-qa.functions.ts",import.meta.url),"utf8");
 assert.match(text,/requireOwnerRole/);
 assert.match(text,/commercial_snapshot:rubiQaCommercialSnapshot\(product\)/);
});
