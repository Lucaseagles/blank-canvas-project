import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=p=>readFileSync(new URL(p,import.meta.url),"utf8");

test("consumer invitation records deduplicated impression, open, CTA, pause and opt-out events",()=>{
 const popup=read("../components/profile/RubiAffiliateMiniInvite.tsx");
 for(const event of ["RUBI_AFFILIATE_INVITE_SHOWN","RUBI_AFFILIATE_INVITE_OPENED","RUBI_AFFILIATE_INVITE_CTA","RUBI_AFFILIATE_INVITE_PAUSED","RUBI_AFFILIATE_INVITE_OPTED_OUT"]) assert.ok(popup.includes(event),event);
 assert.match(popup,/sessionStorage/);
 assert.match(popup,/setCollapsed\(false\)/);
 assert.match(popup,/30\*86400000/);
 assert.match(popup,/rounded-full/);
 assert.match(popup,/Conheça o RUBI Indica/);
});

test("consumer affiliate onboarding records application completion only after persisted profile",()=>{
 const onboarding=read("./rubi-onboarding-quiz.functions.ts");
 const position=onboarding.indexOf('if(data.audience==="partner"&&data.partnerType==="affiliate")');
 assert.ok(position>onboarding.indexOf('if(!rows?.[0]?.saved_id)'));
 assert.match(onboarding,/RUBI_AFFILIATE_APPLICATION_SUBMITTED/);
 assert.match(onboarding,/consumer_affiliate_onboarding/);
});

test("Master funnel is Owner-only and counts real events with explicit conversion denominators",()=>{
 const server=read("./rubi-affiliate-recruitment-funnel.functions.ts");
 const ui=read("../admin/referral/RubiAffiliateRecruitmentFunnelAdmin.tsx");
 const route=read("../routes/admin/referrals.tsx");
 assert.match(server,/middleware\(\[requireOwnerRole\]\)/);
 assert.match(server,/count:"exact",head:true/);
 for(const event of ["RUBI_AFFILIATE_INVITE_SHOWN","RUBI_AFFILIATE_INVITE_OPENED","RUBI_AFFILIATE_INVITE_CTA","RUBI_AFFILIATE_APPLICATION_SUBMITTED","RUBI_AFFILIATE_INVITE_PAUSED","RUBI_AFFILIATE_INVITE_OPTED_OUT"]) assert.ok(server.includes(event),event);
 assert.match(server,/openFromShown/);
 assert.match(server,/ctaFromOpened/);
 assert.match(server,/applicationFromCta/);
 assert.match(server,/Contagens de eventos, não pessoas únicas/);
 assert.match(ui,/Funil de consumidores para afiliados/);
 assert.match(route,/<RubiAffiliateRecruitmentFunnelAdmin \/>/);
});

test("consumer affiliate recruitment reuses the existing onboarding and partner system",()=>{
 const popup=read("../components/profile/RubiAffiliateMiniInvite.tsx");
 const onboarding=read("../routes/onboarding.tsx");
 const membership=read("./rubi-creator-team-members.functions.ts");
 const membershipSql=read("../../supabase/migrations/20261113210000_rubi_team_decisions_atomic_audit.sql");
 assert.match(popup,/partnerType:"affiliate"/);
 assert.match(onboarding,/id:\s*"affiliate"/);
 assert.match(membership,/commercial_profiles/);
 assert.match(membershipSql,/profile_status<>'approved'/);
 assert.doesNotMatch(popup,/commercial_profiles.*insert/);
});
