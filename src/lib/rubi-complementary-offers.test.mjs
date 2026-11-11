import test from "node:test";
import assert from "node:assert/strict";
import {canSuggestComplementary,RUBI_COMPLEMENTARY_KINDS} from "./rubi-complementary-offers.ts";
test("RUBI complementary suggestions never recommend a product to itself",()=>{
 for(const kind of RUBI_COMPLEMENTARY_KINDS) assert.equal(canSuggestComplementary("a","a",kind,100,50),false);
});
test("Downsell always requires a lower real price",()=>{
 assert.equal(canSuggestComplementary("a","b","downsell",100,99),true);
 assert.equal(canSuggestComplementary("a","b","downsell",100,100),false);
 assert.equal(canSuggestComplementary("a","b","downsell",100,110),false);
});
test("Invalid or zero prices cannot be promoted as real product suggestions",()=>{
 assert.equal(canSuggestComplementary("a","b","cross_sell",0,100),false);
 assert.equal(canSuggestComplementary("a","b","upsell",100,NaN),false);
 assert.equal(canSuggestComplementary("a","b","order_bump",100,-1),false);
});
