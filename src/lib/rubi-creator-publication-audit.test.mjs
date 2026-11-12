import test from "node:test";
import assert from "node:assert/strict";
import {auditRubiCreatorPublications} from "./rubi-creator-publication-audit.ts";
const publications=[{id:"pub",assignment_id:"a",channel:"instagram",publication_url:"https://instagram.com/p/abc?utm=1",review_status:"reviewed",published_at:"2026-11-10T00:00:00Z"}];
const assignments=[{id:"a",variant_id:"v",status:"ready"}];
const distribution=[{id:"d",variant_id:"v",channel:"instagram",campaign:"camp_a",status:"manually_published",published_reference:"https://instagram.com/p/abc?utm=1"}];
const events=[{product_id:"product",channel:"instagram",campaign:"camp_a",view_events:12,checkout_intents:3}];
const products={v:"product"};
test("Unique reviewed publication is a campaign label match, not an individual sale",()=>{
 const [row]=auditRubiCreatorPublications(publications,assignments,distribution,events,products,false);
 assert.equal(row?.status,"matched_campaign");
 assert.equal(row?.viewEvents,12);
 assert.equal(row?.checkoutIntents,3);
 assert.match(row?.explanation??"",/NÃO de pessoa\/publicação/);
});
test("Unreviewed and different URL never receive campaign telemetry",()=>{
 assert.equal(auditRubiCreatorPublications([{...publications[0],review_status:"submitted"}],assignments,distribution,events,products,false)[0]?.status,"unreviewed");
 assert.equal(auditRubiCreatorPublications([{...publications[0],publication_url:"https://instagram.com/p/other"}],assignments,distribution,events,products,false)[0]?.status,"no_distribution");
});
test("Repeated campaign labels or incomplete queries hide metrics",()=>{
 const doubled=[...distribution,{...distribution[0],id:"d2",variant_id:"v2",published_reference:"https://instagram.com/p/other"}];
 const productMap={v:"product",v2:"product"};
 assert.equal(auditRubiCreatorPublications(publications,assignments,doubled,events,productMap,false)[0]?.status,"ambiguous_campaign");
 const limited=auditRubiCreatorPublications(publications,assignments,distribution,events,products,true)[0];
 assert.equal(limited?.status,"ambiguous_campaign");
 assert.equal(limited?.viewEvents,null);
});
test("Missing source aggregate is not equivalent to observed zero",()=>{
 const [row]=auditRubiCreatorPublications(publications,assignments,distribution,[],products,false);
 assert.equal(row?.status,"matched_campaign");
 assert.equal(row?.viewEvents,null);
 assert.equal(row?.checkoutIntents,null);
});
