import test from "node:test";
import assert from "node:assert/strict";
import {recordRubiABExposureOnce} from "./rubi-ab-exposure.ts";

function storage(){
 const values=new Map();
 return {
  getItem:key=>values.get(key)??null,
  setItem:(key,value)=>values.set(key,value),
  values
 };
}

test("exposure marker is written only after the analytics insert succeeds",async()=>{
 const session=storage();
 let calls=0;
 const failed=await recordRubiABExposureOnce(session,"exp-1","variant-a",async()=>{calls++;return false;});
 assert.equal(failed,false);
 assert.equal(session.getItem("exp-1"),null);
 const retried=await recordRubiABExposureOnce(session,"exp-1","variant-a",async()=>{calls++;return true;});
 assert.equal(retried,true);
 assert.equal(session.getItem("exp-1"),"variant-a");
 assert.equal(calls,2);
});

test("successful exposure is deduplicated for the same session and experiment revision",async()=>{
 const session=storage();
 let calls=0;
 const write=async()=>{calls++;return true;};
 assert.equal(await recordRubiABExposureOnce(session,"exp-2-rev-1","variant-b",write),true);
 assert.equal(await recordRubiABExposureOnce(session,"exp-2-rev-1","variant-b",write),false);
 assert.equal(calls,1);
});

test("concurrent effects cannot duplicate or release another call's in-flight claim",async()=>{
 const session=storage();
 let calls=0,release;
 const first=recordRubiABExposureOnce(session,"exp-3","variant-c",()=>{
  calls++;
  return new Promise(resolve=>{release=resolve;});
 });
 await Promise.resolve();
 const second=await recordRubiABExposureOnce(session,"exp-3","variant-c",async()=>{calls++;return true;});
 const third=await recordRubiABExposureOnce(session,"exp-3","variant-c",async()=>{calls++;return true;});
 assert.equal(second,false);
 assert.equal(third,false);
 assert.equal(calls,1);
 release(true);
 assert.equal(await first,true);
 assert.equal(session.getItem("exp-3"),"variant-c");
});

test("a rejected analytics write leaves the exposure eligible for a later retry",async()=>{
 const session=storage();
 await assert.doesNotReject(()=>recordRubiABExposureOnce(session,"exp-4","variant-d",async()=>{throw new Error("offline");}));
 assert.equal(session.getItem("exp-4"),null);
 assert.equal(await recordRubiABExposureOnce(session,"exp-4","variant-d",async()=>true),true);
});
