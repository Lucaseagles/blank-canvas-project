import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=p=>readFileSync(new URL(p,import.meta.url),"utf8");

test("public creator profile is limited to approved partners and Owner-published content",()=>{
 const server=read("./rubi-public-creator-profile.functions.ts");
 assert.match(server,/eq\("audience","partner"\)/);
 assert.match(server,/eq\("status","approved"\)/);
 assert.match(server,/videos\.status","published"/);
 assert.match(server,/commercial_profiles/);
 assert.match(server,/rubi_partner_creator_submissions/);
 assert.match(server,/scheduled_for/);
});

test("public creator feed signs private native videos and filters unsafe external links",()=>{
 const server=read("./rubi-public-creator-profile.functions.ts");
 assert.match(server,/createSignedUrl/);
 assert.match(server,/url\.protocol==="https:"/);
 assert.match(server,/url\.username/);
 assert.match(server,/allowedHost/);
 assert.match(server,/if\(!safeExternalUrl\)continue/);
 assert.doesNotMatch(server,/user_id|email|accessToken/);
});

test("public creator page connects published content to the partner's existing tracked storefront",()=>{
 const page=read("../routes/creator.$storeCode.tsx");
 const manager=read("../components/partner/RubiPartnerStorefrontManager.tsx");
 assert.match(page,/getPublicRubiCreatorProfile/);
 assert.match(page,/getPublicRubiPartnerStorefront/);
 assert.match(page,/Creator Feed/);
 assert.match(page,/store\.data\.products/);
 assert.match(page,/product\.referralCode/);
 assert.match(manager,/Perfil de criador/);
 assert.match(manager,/creator\/\$storeCode/);
});

test("external social posts remain links to their source, not copied or scraped media",()=>{
 const page=read("../routes/creator.$storeCode.tsx");
 assert.match(page,/Abrir publicação original/);
 assert.match(page,/target="_blank"/);
 assert.match(page,/rel="noopener noreferrer"/);
 assert.match(page,/sem cópia automática de mídia/);
});
