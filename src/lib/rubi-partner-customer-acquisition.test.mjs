import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=p=>readFileSync(new URL(p,import.meta.url),"utf8");

test("partner acquisition binds only an authenticated customer to a validated partner link",()=>{
 const server=read("./rubi-partner-customer-acquisition.functions.ts");
 assert.match(server,/supabaseAdmin\.auth\.getUser/);
 assert.match(server,/hub_partner_referral_links/);
 assert.match(server,/eq\("active",true\)/);
 assert.match(server,/commercial_profiles/);
 assert.match(server,/hub_partner_agreements/);
 assert.match(server,/hub_partner_product_grants/);
 assert.match(server,/approvedRubiCheckout/);
 assert.match(server,/rubi_bind_partner_customer_acquisition/);
 assert.doesNotMatch(server,/invitedUserId|p_customer_user_id/);
});

test("database acquisition is immutable first-touch, self-referral resistant and time bounded",()=>{
 const migration=read("../../supabase/migrations/20261126140000_rubi_partner_customer_acquisition.sql");
 assert.match(migration,/customer_user_id uuid primary key/);
 assert.match(migration,/on conflict\(customer_user_id\) do nothing/);
 assert.match(migration,/partner_user_id=p_actor/);
 assert.match(migration,/interval '90 days'/);
 assert.match(migration,/agreement.*active/s);
 assert.match(migration,/hub_partner_product_grants/);
 assert.match(migration,/checkout_verified=true/);
 assert.match(migration,/enable row level security/);
 assert.match(migration,/revoke all on public\.hub_partner_customer_acquisitions from public, anon, authenticated/);
 assert.match(migration,/grant execute on function public\.rubi_bind_partner_customer_acquisition\(uuid,uuid\) to service_role/);
 assert.match(migration,/not a sale, payment, order or commission/i);
});

test("partner referral survives precheckout, signup and login with clear customer disclosure",()=>{
 const precheckout=read("../components/store/RubiPreCheckout.tsx");
 const auth=read("../routes/auth.tsx");
 const register=read("../routes/register.tsx");
 assert.match(precheckout,/partner_ref: origin === "partner" \? partnerCode : undefined/);
 assert.match(auth,/partner_ref: z\.string\(\)\.uuid\(\)\.optional\(\)/);
 assert.match(auth,/bindMyPartnerCustomerAcquisition/);
 assert.match(auth,/bindPartnerAcquisition/);
 assert.match(register,/partner_ref: z\.string\(\)\.uuid\(\)\.optional\(\)/);
 assert.match(register,/origem do convite poderá ficar vinculada por até 90 dias/);
 assert.match(register,/partner_ref: search\.partner_ref/);
});

test("partner acquisition dashboard reveals aggregate counts only, never customer identities",()=>{
 const server=read("./rubi-partner-customer-acquisition.functions.ts");
 const card=read("../components/partner/RubiPartnerCustomerAcquisitionCard.tsx");
 const portal=read("../routes/partner/portal.tsx");
 assert.match(server,/getMyPartnerCustomerAcquisitionStats/);
 assert.match(server,/select\("customer_user_id",\{count:"exact",head:true\}\)/);
 assert.match(server,/eq\("commercial_profile_id",profile\.id\)/);
 assert.match(card,/Cadastros atribuídos/);
 assert.match(card,/Janela ativa/);
 assert.match(card,/Cadastro atribuído não é venda/);
 assert.match(portal,/<RubiPartnerCustomerAcquisitionCard \/>/);
});
