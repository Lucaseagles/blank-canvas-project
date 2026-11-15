import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {selectFreshRubiLicensedAsset} from "./rubi-creative-license-access.ts";
const read=p=>readFileSync(new URL(p,import.meta.url),"utf8");
const now=Date.parse("2026-11-15T12:00:00Z");
const ref={id:"v1",productId:"p1",channel:"instagram",validUntil:"2026-11-16T12:00:00Z",hook:"Approved creative"};
test("fresh server licensed response must match variant, product, channel and expiry",()=>{
 assert.deepEqual(selectFreshRubiLicensedAsset([ref],"v1","p1","instagram",now),ref);
 assert.equal(selectFreshRubiLicensedAsset([ref],"v2","p1","instagram",now),null);
 assert.equal(selectFreshRubiLicensedAsset([ref],"v1","p2","instagram",now),null);
 assert.equal(selectFreshRubiLicensedAsset([ref],"v1","p1","tiktok",now),null);
 assert.equal(selectFreshRubiLicensedAsset([{...ref,validUntil:"2026-11-15T12:00:00Z"}],"v1","p1","instagram",now),null);
 assert.equal(selectFreshRubiLicensedAsset([{...ref,validUntil:"bad"}],"v1","p1","instagram",now),null);
 assert.equal(selectFreshRubiLicensedAsset([],"v1","p1","instagram",now),null);
});
test("partner library auth is user-bound, no previously cached copy after revocation",()=>{
 const ui=read("../components/partner/RubiLicensedPartnerCreatives.tsx");
 assert.match(ui,/supabase\.auth\.onAuthStateChange/);
 assert.match(ui,/queryKey:\["rubi-partner-licensed-creatives",userId,channel\]/);
 assert.match(ui,/enabled:!!userId/);
 assert.match(ui,/session\.user\.id!==userId/);
 assert.match(ui,/const latest=await load\(/);
 assert.match(ui,/if\(latest\.partial\)throw/);
 assert.match(ui,/selectFreshRubiLicensedAsset/);
 assert.match(ui,/const fresh=selectFreshRubiLicensedAsset[\s\S]*if\(!fresh\)throw/);
 assert.doesNotMatch(ui,/queryKey:\["rubi-partner-licensed-creatives",channel\]/);
});
test("licensed partner server denies unapproved agreement and grant, expired and stale revisions",()=>{
 const api=read("./rubi-licensed-partner-assets.functions.ts");
 for(const pattern of [/auth\.getUser\(data\.accessToken\)/, /\.eq\("audience","partner"\)/,
  /profile\.status!=="approved"/,/\.eq\("active",true\)/,/approvedRubiCheckout\(p\)/,
  /\.eq\("status","review"\)/,/\.eq\("media_rights_confirmed",true\)/,
  /\.eq\("status","approved"\)/,/\.contains\("permitted_channels",\[data\.channel\]\)/,
  /\.contains\("permitted_audiences",\["partner"\]\)/,/\.gt\("valid_until",now\)/,
  /variant\.revision!==license\.approved_variant_revision/]) assert.match(api,pattern);
 assert.doesNotMatch(api,/evidence_path|signedUrl|createSignedUrl/);
});
test("private licensing requires real uploaded evidence, human review and transactional revocation",()=>{
 const sql=read("../../supabase/migrations/20261113130000_rubi_creative_licensing.sql");
 const api=read("./rubi-creative-licenses.functions.ts");
 assert.match(sql,/false,10485760/);
 assert.match(sql,/rubi_creative_licenses enable row level security/);
 assert.match(sql,/revoke all on public\.rubi_creative_licenses from public,anon,authenticated/);
 assert.match(sql,/from storage\.objects/);
 assert.match(sql,/metadata->>'mimetype'/);
 assert.match(sql,/approved_variant_revision=variant_record\.revision/);
 assert.match(sql,/insert into public\.admin_audit_log/);
 assert.match(sql,/if p_action='approve'/);
 assert.match(sql,/where id=old_record\.id and status='approved'/);
 assert.match(sql,/grant execute on function public\.rubi_mutate_creative_license_audited[\s\S]*to service_role/);
 assert.match(api,/requireOwnerRole/g);
 assert.match(api,/createSignedUrl\(license\.evidence_path,60\)/);
});
