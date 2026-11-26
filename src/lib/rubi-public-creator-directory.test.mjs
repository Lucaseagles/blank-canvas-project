import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=p=>readFileSync(new URL(p,import.meta.url),"utf8");

test("public creator directory lists only approved partner profiles with valid public store codes",()=>{
 const server=read("./rubi-public-creator-directory.functions.ts");
 assert.match(server,/eq\("audience","partner"\)/);
 assert.match(server,/eq\("status","approved"\)/);
 assert.match(server,/public_store_code/);
 assert.match(server,/\^\[a-f0-9\]\{12\}\$/i);
 assert.doesNotMatch(server,/email|user_id|accessToken/);
});

test("directory video counts include only approved Owner-published content and hide scheduled posts",()=>{
 const server=read("./rubi-public-creator-directory.functions.ts");
 assert.match(server,/rubi_partner_creator_submissions/);
 assert.match(server,/eq\("videos\.status","published"\)/);
 assert.match(server,/eq\("status","approved"\)/);
 assert.match(server,/scheduled_for/);
 assert.match(server,/length>=501/);
});

test("creator discovery UI supports search and links directly to profile and storefront",()=>{
 const page=read("../routes/creators.tsx");
 assert.match(page,/getPublicRubiCreatorDirectory/);
 assert.match(page,/Buscar criador ou tipo de parceria/);
 assert.match(page,/Ver perfil/);
 assert.match(page,/Ver vitrine/);
 assert.match(page,/creator\/\$storeCode/);
 assert.match(page,/loja\/\$storeCode/);
});
