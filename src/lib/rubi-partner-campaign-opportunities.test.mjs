import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=p=>readFileSync(new URL(p,import.meta.url),"utf8");

test("partner campaign opportunities require authenticated approved partner and active commercial agreement",()=>{
 const server=read("./rubi-partner-campaign-opportunities.functions.ts");
 assert.match(server,/supabaseAdmin\.auth\.getUser/);
 assert.match(server,/audience","partner"/);
 assert.match(server,/profile\.status!=="approved"/);
 assert.match(server,/hub_partner_agreements/);
 assert.match(server,/\.eq\("active",true\)/);
});

test("opportunities require active team membership, ready assignment, approved consumer campaign and granted product",()=>{
 const server=read("./rubi-partner-campaign-opportunities.functions.ts");
 assert.match(server,/rubi_creator_team_members/);
 assert.match(server,/\.eq\("status","active"\)/);
 assert.match(server,/rubi_creator_team_campaign_assignments/);
 assert.match(server,/\.eq\("status","ready"\)/);
 assert.match(server,/rubi_master_campaign_plans/);
 assert.match(server,/\.eq\("status","approved"\)/);
 assert.match(server,/\.eq\("mode","creator_team"\)/);
 assert.match(server,/\.eq\("audience","consumer"\)/);
 assert.match(server,/hub_partner_product_grants/);
 assert.match(server,/approvedRubiCheckout/);
});

test("campaign assets require reviewed movement and variant, confirmed rights and matching live license revision",()=>{
 const server=read("./rubi-partner-campaign-opportunities.functions.ts");
 assert.match(server,/rubi_movements/);
 assert.match(server,/rubi_movement_variants/);
 assert.match(server,/media_rights_confirmed",true/);
 assert.match(server,/rubi_creative_licenses/);
 assert.match(server,/\.eq\("status","approved"\)/);
 assert.match(server,/contains\("permitted_audiences",\["partner"\]\)/);
 assert.match(server,/approved_variant_revision!==variant\.revision/);
 assert.match(server,/valid_until/);
});

test("partner portal revalidates campaign permission before copying and never publishes automatically",()=>{
 const component=read("../components/partner/RubiPartnerCampaignOpportunities.tsx");
 const portal=read("../routes/partner/portal.tsx");
 assert.match(component,/const fresh=await load/);
 assert.match(component,/navigator\.clipboard\.writeText/);
 assert.match(component,/Não publica conteúdo/);
 assert.match(component,/Link individual do produto no portal/);
 assert.match(portal,/<RubiPartnerCampaignOpportunities \/>/);
});

test("opportunity response is read-only and suppresses incomplete bounded queries",()=>{
 const server=read("./rubi-partner-campaign-opportunities.functions.ts");
 assert.match(server,/partial:true/);
 assert.match(server,/partial:false/);
 assert.doesNotMatch(server,/\.insert\(/);
 assert.doesNotMatch(server,/\.upsert\(/);
 assert.doesNotMatch(server,/\.update\(/);
 assert.doesNotMatch(server,/rubi_create_team_campaign_assignment_audited/);
});
