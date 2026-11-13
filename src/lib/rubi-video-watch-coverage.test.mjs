import test from "node:test";
import assert from "node:assert/strict";
import {newRubiVideoWatchCoverage,markRubiVideoSeek,observeRubiVideoWatch} from "./rubi-video-watch-coverage.ts";
test("manual seek to 90 percent cannot count as video completion",()=>{
 const state=newRubiVideoWatchCoverage(100);
 observeRubiVideoWatch(state,0,100);
 markRubiVideoSeek(state);
 const jump=observeRubiVideoWatch(state,91,100);
 assert.equal(jump.completed,false);
 assert.equal(jump.coveragePercent,0);
 assert.equal(observeRubiVideoWatch(state,92,100).completed,false);
});
test("90 percent of unique timeline truly watched can qualify",()=>{
 const state=newRubiVideoWatchCoverage(10);
 let result=observeRubiVideoWatch(state,0,10);
 for(let t=0.25;t<=9.25;t+=0.25)result=observeRubiVideoWatch(state,t,10);
 assert.equal(result.completed,true);
 assert.ok(result.coveragePercent>=90);
});
test("rewinding and repeating short sections cannot increase unique coverage",()=>{
 const state=newRubiVideoWatchCoverage(100);
 observeRubiVideoWatch(state,0,100);
 for(let t=1;t<=10;t++)observeRubiVideoWatch(state,t,100);
 const first=state.watchedBuckets.size;
 for(let loop=0;loop<10;loop++){
  markRubiVideoSeek(state);observeRubiVideoWatch(state,0,100);
  for(let t=1;t<=10;t++)observeRubiVideoWatch(state,t,100);
 }
 assert.equal(state.watchedBuckets.size,first);
});
test("large seeks and changing video duration invalidate progress",()=>{
 const state=newRubiVideoWatchCoverage(100);
 observeRubiVideoWatch(state,0,100);
 observeRubiVideoWatch(state,90,100);
 assert.equal(state.watchedBuckets.size,0);
 observeRubiVideoWatch(state,91,100);
 observeRubiVideoWatch(state,0,50);
 assert.equal(state.watchedBuckets.size,0);
 assert.equal(observeRubiVideoWatch(state,Number.NaN,50).completed,false);
});
