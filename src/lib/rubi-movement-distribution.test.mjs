import test from "node:test";
import {readFileSync} from "node:fs";
import assert from "node:assert/strict";
import {movementCampaign,movementCampaignPath,canRecordPublication,isValidRubiPublicationReference} from "./rubi-movement-distribution.ts";
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
 assert.equal(canRecordPublication({...plan,status:"manually_published",published_reference:"https://www.instagram.com/p/ABC123xyz/"}),true);
});


test("manual publication references must be HTTPS permalinks on the selected platform",()=>{
 const valid=[
  ["instagram","https://www.instagram.com/p/ABC123xyz/"],
  ["tiktok","https://www.tiktok.com/@rubi/video/1234567890123456789"],
  ["youtube","https://www.youtube.com/watch?v=AbCdEf12345"],
  ["youtube","https://youtu.be/AbCdEf12345"],
  ["facebook","https://www.facebook.com/rubi/posts/123456789"],
  ["pinterest","https://www.pinterest.com/pin/123456789012345678/"],
  ["telegram","https://t.me/rubichannel/123"],
  ["telegram","https://t.me/c/123456789/123"],
 ];
 for(const [channel,reference] of valid){
  assert.equal(isValidRubiPublicationReference(channel,reference),true,channel+" "+reference);
  assert.equal(canRecordPublication({variant_id:variant,channel,campaign:"qa",status:"manually_published",notes:"",published_reference:reference}),true);
 }
});

test("manual publication rejects spoofed domains, insecure URLs and non-permalink references",()=>{
 const invalid=[
  ["instagram","https://instagram.com.evil.example/p/ABC123xyz/"],
  ["instagram","http://instagram.com/p/ABC123xyz/"],
  ["tiktok","https://www.tiktok.com/@rubi/video/not-a-number"],
  ["youtube","https://youtube.com.evil.example/watch?v=AbCdEf12345"],
  ["facebook","https://www.facebook.com/profile.php?id=123"],
  ["pinterest","https://www.pinterest.com.evil.example/pin/123456789012345678/"],
  ["telegram","https://t.me/rubichannel"],
  ["whatsapp","https://chat.whatsapp.com/InviteCode123"],
 ];
 for(const [channel,reference] of invalid){
  assert.equal(isValidRubiPublicationReference(channel,reference),false,channel+" "+reference);
  assert.equal(canRecordPublication({variant_id:variant,channel,campaign:"qa",status:"manually_published",notes:"",published_reference:reference}),false);
 }
});

test("draft distribution plans remain saveable without a publication reference",()=>{
 for(const channel of ["instagram","tiktok","youtube","facebook","pinterest","whatsapp","telegram"]){
  assert.equal(canRecordPublication({variant_id:variant,channel,campaign:"qa",status:"planned",notes:"",published_reference:""}),true);
 }
});


test("database trigger enforces the same platform permalink contract as the server",()=>{
 const migration=readFileSync(new URL("../../supabase/migrations/20261128090000_rubi_distribution_publication_reference_guard.sql",import.meta.url),"utf8");
 assert.match(migration,/rubi_valid_distribution_publication_reference/);
 assert.match(migration,/rubi_distribution_publication_reference_guard_trg/);
 assert.match(migration,/before insert or update of channel,status,published_reference/i);
 assert.match(migration,/WhatsApp requires provider confirmation/i);
 assert.match(migration,/revoke all on function public\.rubi_valid_distribution_publication_reference[\s\S]*from public, anon, authenticated/i);
 assert.match(migration,/grant execute on function public\.rubi_valid_distribution_publication_reference[\s\S]*to service_role/i);
});
