import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=(p)=>readFileSync(new URL(p,import.meta.url),"utf8");
test("Consumer feed sends session token to authenticated server function via POST",()=>{
 const feed=read("../routes/feed.tsx");
 const fn=read("./personalization.functions.ts");
 const server=read("./personalization.server.ts");
 assert.match(feed,/session\?\.access_token \?\? null/);
 assert.match(feed,/userId: session\?\.user\.id \?\? null/);
 assert.match(fn,/getPersonalizedFeed = createServerFn\(\{ method: "POST" \}\)/);
 assert.match(fn,/await verifyOptionalUser\(userId, accessToken\)/);
 assert.match(server,/data\?\.claims\?\.sub !== userId/);
 assert.match(server,/client\.auth\.getClaims\(token\)/);
});
test("Merchant wholesale prices require verified token and approved merchant profile",()=>{
 const fn=read("./hub-catalog.functions.ts");
 assert.match(fn,/getMerchantHubCatalog[\s\S]*?supabaseAdmin\.auth\.getUser\(data\.accessToken\)/);
 assert.match(fn,/\.eq\("audience","merchant"\)\.eq\("status","approved"\)/);
});
test("Partner grants are filtered to verified and approved partner account",()=>{
 const fn=read("./partner-portal.functions.ts");
 assert.match(fn,/supabaseAdmin\.auth\.getUser\(input\.accessToken\)/);
 assert.match(fn,/\.eq\("user_id", userId\)\.eq\("audience", "partner"\)/);
 assert.match(fn,/profile\.status !== "approved"/);
 assert.match(fn,/\.eq\("commercial_profile_id", profile\.id\)/);
});
test("Master is authorized server-side by verified database role, not by email",()=>{
 const guard=read("./auth-guards.server.ts");
 const layout=read("../routes/admin.tsx");
 const sidebar=read("../components/admin/AdminSidebar.tsx");
 assert.doesNotMatch(guard,/OWNER_EMAIL|userEmail/);
 assert.match(guard,/_role: "owner"/);
 assert.match(guard,/requireSupabaseAuth/);
 assert.match(guard,/hasRole !== true/);
 assert.doesNotMatch(layout,/OWNER_EMAIL/);
 assert.doesNotMatch(sidebar,/OWNER_EMAIL/);
 assert.match(layout,/_role: "owner"/);
 assert.match(sidebar,/_role:"owner"/);
});
