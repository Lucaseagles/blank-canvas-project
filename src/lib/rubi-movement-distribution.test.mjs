import test from "node:test";
import assert from "node:assert/strict";
import {movementCampaign,movementCampaignPath,canRecordPublication} from "./rubi-movement-distribution.ts";
import {readRubiOrganicAttribution} from "./rubi-organic-campaigns.ts";

const product="00000000-0000-4000-8000-000000000001";
const variant="00000000-0000-4000-8000-000000000002";
test("Each creative uses normalized organic campaign labels, not financial attribution",()=>{
 const campaign=movementCampaign("Sua Casa, Seu Olhar",variant);
 const path=movementCampaignPath(product,"instagram",campaign);
 assert.match(path,/utm_source=instagram/);
 assert.match(path,/utm_medium=organic_social/);
 assert.match(path,/utm_campaign=sua-casa-seu-olhar/);
 assert.equal(readRubiOrganicAttribution(path.split("?")[1]).campaign,campaign);
 assert.equal(path.includes("partner"),false);
});
test("Manual publication requires a reference, draft plan remains harmless",()=>{
 const plan={variant_id:variant,channel:"instagram",campaign:"teste",status:"planned",notes:"",published_reference:""};
 assert.equal(canRecordPublication(plan),true);
 assert.equal(canRecordPublication({...plan,status:"manually_published"}),false);
 assert.equal(canRecordPublication({...plan,status:"manually_published",published_reference:"https://example.org/post"}),true);
});
