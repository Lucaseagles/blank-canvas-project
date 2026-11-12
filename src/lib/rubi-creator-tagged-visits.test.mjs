import test from "node:test";
import assert from "node:assert/strict";
import {summarizeTaggedPublicationVisits} from "./rubi-creator-tagged-visits.ts";
const posts=[
 {id:"p1",assignment_id:"a1",membership_id:"m1",channel:"instagram",review_status:"reviewed"},
 {id:"p2",assignment_id:"a2",membership_id:"m2",channel:"tiktok",review_status:"reviewed"},
 {id:"p3",assignment_id:"a3",membership_id:"m3",channel:"youtube",review_status:"submitted"}
];
test("Counts URL-tagged landing events, not unique visitors",()=>{
 const result=summarizeTaggedPublicationVisits(posts,[
  {publication_id:"p1",visited_at:"2026-11-12T01:00:00Z"},
  {publication_id:"p1",visited_at:"2026-11-12T01:00:00Z"},
  {publication_id:"p2",visited_at:"2026-11-12T02:00:00Z"},
  {publication_id:null,visited_at:"2026-11-12T03:00:00Z"}
 ],false);
 assert.deepEqual(result.rows.map(row=>row.taggedVisitEvents),[2,1]);
 assert.equal(result.totalTaggedEvents,3);
 assert.equal(result.rows.some(row=>row.id==="p3"),false);
});
test("A complete empty observation means zero while a capped source hides all counts",()=>{
 const empty=summarizeTaggedPublicationVisits(posts,[],false);
 assert.deepEqual(empty.rows.map(row=>row.taggedVisitEvents),[0,0]);
 const limited=summarizeTaggedPublicationVisits(posts,[],true);
 assert.equal(limited.rows.length,0);
 assert.equal(limited.totalTaggedEvents,null);
});
