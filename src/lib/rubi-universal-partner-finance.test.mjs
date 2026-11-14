import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=p=>readFileSync(new URL(p,import.meta.url),"utf8");
test("Financial cockpit is rendered for all approved partner categories, not only affiliate",()=>{
 const portal=read("../routes/partner/portal.tsx");
 const dashboard=read("../components/partner/RubiPartnerFinanceDashboard.tsx");
 assert.match(portal,/profile\?\.status === "approved"/);
 assert.match(portal,/<RubiPartnerFinanceDashboard/);
 assert.match(portal,/partnerType=\{profile.partner_type\?\?"partner"\}/);
 const before=portal.indexOf("<RubiPartnerFinanceDashboard");
 const affiliateGate=portal.indexOf('profile.partner_type==="affiliate"');
 assert.ok(before>=0&&affiliateGate>before);
 for(const category of ["affiliate","micro_influencer","influencer","expert"]){
  assert.match(dashboard,new RegExp(category));
 }
 for(const text of ["Vendas confirmadas","Volume vendido","Comissão calculada","Comissão paga",
  "Comissão pendente","Acordo vigente","Histórico de pedidos"]){
  assert.ok(dashboard.includes(text),text);
 }
 assert.match(dashboard,/visitas podem ter período e elegibilidade diferentes/);
 assert.match(dashboard,/não calculamos uma taxa de conversão/);
 assert.match(dashboard,/\/partner\/statement/);
 assert.doesNotMatch(dashboard,/\.insert\(|\.update\(|\.upsert\(/);
});
test("Sales and finance are bound to verified logged-in commercial partner profile",()=>{
 const sales=read("./partner-sales-summary.functions.ts");
 const commissions=read("./partner-commission-status.functions.ts");
 const portal=read("./partner-portal.functions.ts");
 for(const src of [sales,portal]){
  assert.match(src,/supabaseAdmin\.auth\.getUser/);
  assert.match(src,/\.eq\("user_id", userId\)/);
  assert.match(src,/\.eq\("audience", "partner"\)/);
 }
 assert.match(sales,/\.eq\("status", "approved"\)/);
 assert.match(commissions,/\.eq\("user_id", claims\.claims\.sub\)/);
 assert.match(commissions,/\.eq\("audience", "partner"\)/);
 assert.match(commissions,/\.eq\("status", "approved"\)/);
 assert.match(sales,/fetchAllFinancialRows/);
 assert.match(sales,/fetchFinancialRowsByIds/);
});
