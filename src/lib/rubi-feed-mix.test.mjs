import test from "node:test";
import assert from "node:assert/strict";
import {planRubiFeedMix} from "./rubi-feed-mix.ts";

test("without verified interests, relevance slots become discovery capacity",()=>{
 const mix=planRubiFeedMix(12,{relevant:70,related:20,discovery:10},false);
 assert.deepEqual(mix,{relevantCount:0,relatedCount:2,discoveryCount:10});
});
test("weighted mix stays within requested capacity for authenticated audiences",()=>{
 const mix=planRubiFeedMix(12,{relevant:70,related:20,discovery:10},true);
 assert.deepEqual(mix,{relevantCount:8,relatedCount:2,discoveryCount:2});
});
test("invalid configuration and extreme allocations cannot overflow limits",()=>{
 for(const input of [
  {relevant:999999999,related:999999999,discovery:0},
  {relevant:-1,related:Number.NaN,discovery:Number.POSITIVE_INFINITY},
  {relevant:0,related:0,discovery:0}
 ]){
  const result=planRubiFeedMix(40,input,true);
  assert.equal(result.relevantCount+result.relatedCount+result.discoveryCount,40);
  assert.ok(Object.values(result).every(x=>Number.isInteger(x)&&x>=0&&x<=40));
 }
 assert.deepEqual(planRubiFeedMix(0,{relevant:70,related:20,discovery:10},true),
 {relevantCount:0,relatedCount:0,discoveryCount:0});
});
