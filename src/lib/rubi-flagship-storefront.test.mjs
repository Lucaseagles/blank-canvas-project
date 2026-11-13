import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const source=(name)=>readFileSync(new URL(name,import.meta.url),"utf8");
test("Flagship store keeps only official retail catalog and product route",()=>{
 const code=source("../routes/hub-shop.tsx");
 assert.match(code,/getRetailHubCatalog/);
 assert.ok(code.includes('const link="/hub-product/$productId"'));
 assert.ok(code.includes('to={link}'));
 assert.ok(code.includes('to="/wholesale"'));
 assert.ok(code.includes('to="/partner/portal"'));
 assert.ok(code.includes('to="/videos"'));
 assert.doesNotMatch(code,/supplier_cost|checkout_url\s*=/);
});
test("Product details keep existing official precheckout and approved campaign page",()=>{
 const code=source("../routes/hub-product.$productId.tsx");
 assert.ok(code.includes('<RubiMovementLanding productId={product.id} />'));
 assert.ok(code.includes('<RubiPreCheckout product={product}'));
 assert.ok(code.includes('id="rubi-purchase"'));
 assert.match(code,/retail_price/);
});
test("Retail entry exists in consumer, merchant, partner and video flows",()=>{
 for(const route of ["../routes/feed.tsx","../routes/wholesale.tsx","../routes/partner/portal.tsx"]){
  assert.match(source(route),/<RubiStorefrontEntry audience=/);
 }
 assert.ok(source("../routes/videos.tsx").includes('to="/hub-shop"'));
});
test("Audience entry never discloses wholesale or partner transactions in retail store",()=>{
 const entry=source("../components/store/RubiStorefrontEntry.tsx");
 assert.match(entry,/links autorizados no portal/);
 assert.match(entry,/preços de atacado continuam exclusivos/);
 assert.doesNotMatch(entry,/checkout_url|b2b_base_price/);
});

test("Authorized checkout remains reachable when analytics fails, with a visible retry error",()=>{
 const code=source("../components/store/RubiPreCheckout.tsx");
 assert.match(code,/const latest = await getReadiness/);
 assert.match(code,/if \(!latest\.ready\)/);
 assert.match(code,/try \{\s*await trackEvent\("RUBI_PRECHECKOUT_CONTINUE"/);
 assert.match(code,/A telemetry outage must never prevent a freshly authorized purchase/);
 assert.match(code,/window\.location\.assign\(url\.toString\(\)\)/);
 assert.match(code,/checkoutError && <p role="alert"/);
});

test("Unavailable partner referrals show a safe fallback without checkout",()=>{
 const route=source("../routes/r/$code.tsx");
 assert.match(route,/!query\.isLoading && !query\.isError && !product/);
 assert.match(route,/Indicação indisponível/);
 assert.match(route,/href="\/hub-shop"/);
 assert.match(route,/\{product && \(/);
 assert.match(route,/partnerCode=\{code\}/);
});

test("Consumer feed discovers only published movement pages with current approvals",()=>{
 const feed=source("../routes/feed.tsx");
 const shelf=source("../components/store/RubiApprovedMovementShelf.tsx");
 const server=source("./rubi-movement-feed.functions.ts");
 assert.match(feed,/<RubiApprovedMovementShelf \/>/);
 assert.match(shelf,/getRubiApprovedMovementFeed/);
 assert.match(shelf,/categorias do seu interesse/);
 assert.match(server,/\.not\("page_published_at", "is", null\)/);
 assert.match(server,/canServeApprovedMovementPage\(/);
 assert.match(server,/approvedRubiCheckout\(product\)/);
 assert.match(server,/movement\.product_id===product\.id/);
 assert.match(server,/rubiOrganicProductPath\(/);
 assert.match(server,/preferred_categories/);
 assert.match(server,/verifyOptionalUser\(data\.userId,data\.accessToken\)/);
 assert.doesNotMatch(server,/user_interests|user_metadata|supplier_cost/);
 assert.doesNotMatch(shelf,/checkout_url|supplier_cost|comissão confirmada/);
});

test("Marketplace feed and official RUBI movement use declared category preferences",()=>{
 const marketplace=source("./personalization.functions.ts");
 const movement=source("./rubi-movement-feed.functions.ts");
 const shelf=source("../components/store/RubiApprovedMovementShelf.tsx");
 assert.match(marketplace,/explicitCategories = \(preferences\?\.preferred_categories/);
 assert.match(marketplace,/categoryIds = explicitCategories\.slice/);
 assert.match(movement,/user_preferences/);
 assert.match(movement,/rankRubiOffersByInterests/);
 assert.match(shelf,/supabase\.auth\.getSession/);
 assert.match(shelf,/accessToken:identity!\.accessToken/);
});

test("Social activity supports persistent opt-out and cannot invent purchases",()=>{
 const popup=source("../components/SocialProofPopup.tsx");
 const prefs=source("./rubi-social-proof-visibility.ts");
 const profile=source("../routes/profile.tsx");
 const stats=source("./rubi-store-activity-proof.functions.ts");
 const store=source("../routes/hub-product.$productId.tsx");
 const precheckout=source("../components/store/RubiPreCheckout.tsx");
 const counts=source("../components/AggregatedSocialProof.tsx");
 assert.match(popup,/hideNotices/);
 assert.match(popup,/setSocialProofNoticesEnabled\(false\)/);
 assert.match(prefs,/SOCIAL_PROOF_VISIBILITY_KEY/);
 assert.match(profile,/setSocialProofNoticesEnabled\(value\)/);
 assert.match(stats,/RUBI_STORE_PRODUCT_VIEW/);
 assert.match(stats,/RUBI_PRECHECKOUT_CONTINUE/);
 assert.match(stats,/min_events_for_counter/);
 assert.match(store,/<RubiStoreActivityProof productId=\{product\.id\}/);
 assert.match(precheckout,/<RubiStoreActivityProof productId=\{product\.id\} compact/);
 assert.match(counts,/visualizações/);
 assert.doesNotMatch(stats,/PURCHASE_CONFIRMED|PAID_ORDER/);
});

test("Countdown appears only for real active published editorial section deadlines",()=>{
 const server=source("./rubi-editorial-deadline.functions.ts");
 const timer=source("../components/store/RubiEditorialDeadline.tsx");
 const store=source("../routes/hub-product.$productId.tsx");
 const checkout=source("../components/store/RubiPreCheckout.tsx");
 assert.match(server,/activeRubiStorefrontSection\(section,now\)/);
 assert.match(server,/\.eq\("status","published"\)/);
 assert.match(server,/\.contains\("product_ids",\[data\.productId\]\)/);
 assert.match(timer,/if\(!Number\.isFinite\(left\)\|\|left<=0\)return null/);
 assert.match(timer,/Não significa que o preço, o estoque ou o checkout vencerão/);
 assert.match(store,/<RubiEditorialDeadline productId=\{product\.id\}/);
 assert.match(checkout,/<RubiEditorialDeadline productId=\{product\.id\}/);
});

test("Three login experiences include conversion guidance without fabricated urgency",()=>{
 const guide=source("../components/growth/RubiConversionGuide.tsx");
 const feed=source("../routes/feed.tsx");
 const wholesale=source("../routes/wholesale.tsx");
 const partner=source("../routes/partner/portal.tsx");
 assert.match(feed,/<RubiConversionGuide audience="consumer"/);
 assert.match(wholesale,/<RubiConversionGuide audience="merchant"/);
 assert.match(partner,/<RubiConversionGuide audience="partner"/);
 assert.match(guide,/aria-expanded=\{open\}/);
 assert.match(guide,/identifique a publicidade/);
 assert.match(guide,/não confirma pedido/);
 assert.match(guide,/quando confirmadas/);
 assert.doesNotMatch(guide,/Fulana comprou|restam só 2|compradores agora/);
});

test("Partner kit offers five transparent sales approaches without invented claims",()=>{
 const kit=source("../components/partner/PartnerCreativeKit.tsx");
 assert.match(kit,/Demonstração/);
 assert.match(kit,/Story \/ Comunidade/);
 assert.match(kit,/Expert \/ Nicho/);
 assert.match(kit,/Dúvidas frequentes/);
 assert.match(kit,/Comparação honesta/);
 assert.match(kit,/Publicidade · link de parceiro RUBI/);
 assert.match(kit,/referralCode/);
 assert.doesNotMatch(kit,/compra confirmada por|garantia de vendas|pessoas compraram agora/);
});

test("Conversion interest reporting is master-only and distinguishes actions from sales",()=>{
 const guide=source("../components/growth/RubiConversionGuide.tsx");
 const kit=source("../components/partner/PartnerCreativeKit.tsx");
 const api=source("./rubi-audience-conversion-pulse.functions.ts");
 const panel=source("../components/admin/RubiAudienceConversionPulse.tsx");
 const dashboard=source("../routes/admin/dashboard.tsx");
 assert.match(guide,/RUBI_CONVERSION_GUIDE_OPEN/);
 assert.match(kit,/RUBI_PARTNER_KIT_COPIED/);
 assert.match(api,/requireOwnerRole/);
 assert.match(api,/limit\(1000\)/);
 assert.match(api,/partial:rows\.length===1000/);
 assert.match(panel,/não são pessoas únicas nem vendas/);
 assert.match(dashboard,/<RubiAudienceConversionPulse \/>/);
 assert.doesNotMatch(api,/orders.*confirmed|fake_purchase/);
});

test("Three funnels dashboard uses exact protected counts and distinct stages",()=>{
 const api=source("./rubi-three-funnel-pulse.functions.ts");
 const panel=source("../components/admin/RubiThreeFunnelPulseAdmin.tsx");
 const dashboard=source("../routes/admin/dashboard.tsx");
 assert.match(api,/requireOwnerRole/);
 assert.match(api,/count:"exact"/);
 assert.match(api,/RUBI_STORE_PRODUCT_VIEW/);
 assert.match(api,/RUBI_PRECHECKOUT_CONTINUE/);
 assert.match(api,/hub_b2b_quote_requests/);
 assert.match(api,/replenishment_of_quote_id/);
 assert.match(api,/hub_partner_referral_visits/);
 assert.match(api,/hub_partner_confirmed_sales/);
 assert.match(api,/\.gte\(dateColumn,since\)/);
 assert.match(panel,/etapas independentes/i);
 assert.match(panel,/não uma coorte de pessoas/i);
 assert.match(dashboard,/<RubiThreeFunnelPulseAdmin \/>/);
});

test("AI paid traffic funnels are only planned inside owner-gated movement distribution",()=>{
 const admin=source("../components/store/RubiMovementDistributionAdmin.tsx");
 const planner=source("../components/store/RubiAiPaidFunnelPlanner.tsx");
 const plan=source("./rubi-ai-paid-funnel.ts");
 assert.match(admin,/<RubiAiPaidFunnelPlanner productId=\{productId\}/);
 assert.match(planner,/buildRubiPaidFunnelBrief/);
 assert.match(planner,/!approved/);
 assert.match(planner,/Nenhum anúncio foi publicado/);
 assert.match(plan,/ai_seller_video/);
 assert.match(plan,/direct_response/);
 assert.match(plan,/MICROINFLUENCIADORES/);
 assert.doesNotMatch(plan,/fetch\(|supabase\.from\(|publishAd\(/);
});

test("Creator recruitment teams are owner-only and cannot grant commissions or partner access",()=>{
 const admin=source("../components/partner/RubiCreatorTeamsAdmin.tsx");
 const api=source("./rubi-creator-teams.functions.ts");
 const page=source("../routes/admin/hub-catalog.tsx");
 const migration=source("../../supabase/migrations/20261112003000_rubi_creator_teams_crm.sql");
 assert.match(page,/<RubiCreatorTeamsAdmin \/>/);
 assert.match(api,/requireOwnerRole/g);
 assert.match(api,/saveRubiCreatorProspectAdmin/);
 assert.match(api,/rubi_creator_prospects/);
 assert.match(api,/profile_url:z\.string\(\)\.trim\(\)\.url/);
 assert.match(admin,/Nano|nano/);
 assert.match(admin,/Patrocínio fixo/);
 assert.match(admin,/Não foi possível carregar times/);
 assert.match(admin,/Nenhum pagamento, grant ou link é criado aqui/);
 assert.match(source("../routes/partner/portal.tsx"),/Rede de times RUBI Partners/);
 assert.match(migration,/enable row level security/g);
 assert.match(migration,/revoke all on public\.rubi_creator_prospects from public,anon,authenticated/);
 assert.doesNotMatch(api,/hub_partner_agreements|hub_partner_product_grants|hub_partner_confirmed_sales/);
});

test("Creator inbound page recruits transparently without bypassing approval",()=>{
 const landing=source("../routes/creators.tsx");
 const feed=source("../routes/feed.tsx");
 const partner=source("../routes/partner/portal.tsx");
 const onboarding=source("../routes/onboarding.tsx");
 assert.match(landing,/createFileRoute\("\/creators"\)/);
 assert.match(landing,/Quero solicitar parceria/);
 assert.match(landing,/audience:"partner",returnTo:"\/partner\/portal"/);
 assert.match(landing,/nano ou microinfluenciador/);
 assert.match(landing,/Cadastro sujeito a análise e aprovação/);
 assert.match(landing,/Nenhum percentual é garantido/);
 assert.match(feed,/to="\/creators"/);
 assert.match(partner,/to="\/creators"/);
 assert.match(onboarding,/audience === "partner"/);
 assert.match(onboarding,/Solicitação recebida! Aguardando aprovação/);
 assert.match(onboarding,/Nicho informado/);
 assert.match(onboarding,/Audiência aproximada/);
 assert.match(onboarding,/Profissional do meu nicho/);
 assert.match(onboarding,/Nano ou microinfluenciador/);
 assert.match(onboarding,/\.slice\(0,500\)/);
 assert.doesNotMatch(landing,/createMyPartnerReferralLink|saveHubPartnerAgreement|hub_partner_product_grants/);
});

test("Shadow Master growth action center is read-only and grounded in existing metrics",()=>{
 const admin=source("../routes/admin/dashboard.tsx");
 const panel=source("../components/admin/RubiMasterGrowthPlaybooksAdmin.tsx");
 const logic=source("./rubi-master-growth-playbooks.ts");
 assert.match(admin,/<RubiMasterGrowthPlaybooksAdmin \/>/);
 assert.match(panel,/getRubiLaunchReadinessAdmin/);
 assert.match(panel,/getRubiCommercialPulseAdmin/);
 assert.match(panel,/Não foi possível confirmar os dados comerciais/);
 assert.match(logic,/ai_seller/);
 assert.match(logic,/direct/);
 assert.match(logic,/creators/);
 assert.match(logic,/merchant/);
 assert.doesNotMatch(panel,/saveHub|createAd|publishCampaign|payCommission/);
});

test("Master campaign plans have a private persistent approval ledger and no ad-spend side effect",()=>{
 const migration=source("../../supabase/migrations/20261112013000_rubi_master_campaign_plans.sql");
 const server=source("./rubi-master-campaign-plans.functions.ts");
 const panel=source("../components/store/RubiMasterCampaignApprovalAdmin.tsx");
 const distribution=source("../components/store/RubiMovementDistributionAdmin.tsx");
 assert.match(migration,/rubi_master_campaign_plans/);
 assert.match(migration,/rubi_master_campaign_plan_audit_trigger/);
 assert.match(migration,/enable row level security/g);
 assert.match(migration,/revoke all on public\.rubi_master_campaign_plans from public,anon,authenticated/);
 assert.match(server,/requireOwnerRole/g);
 assert.match(server,/approvedRubiCheckout\(product\)/);
 assert.match(server,/\.eq\("status",expected\)/);
 assert.match(server,/note\.length<10/);
 assert.match(server,/Aprovação interna apenas/);
 assert.match(panel,/creator_team/);
 assert.match(panel,/ai_seller_video/);
 assert.match(panel,/direct_response/);
 assert.match(panel,/Salvar novo rascunho/);
 assert.match(distribution,/<RubiMasterCampaignApprovalAdmin productId=\{productId\}/);
 assert.doesNotMatch(server,/publishAd|spendBudget|createCheckout|payCommission/);
});

test("Influencer teams plan nano-to-mega growth without treating prospects as paid creators",()=>{
 const schema=source("../../supabase/migrations/20261112023000_rubi_creator_team_growth_targets.sql");
 const api=source("./rubi-creator-teams.functions.ts");
 const ui=source("../components/partner/RubiCreatorTeamGrowthAdmin.tsx");
 const owner=source("../components/partner/RubiCreatorTeamsAdmin.tsx");
 assert.match(schema,/rubi_creator_team_growth_targets/);
 assert.match(schema,/enable row level security/);
 assert.match(schema,/revoke all on public\.rubi_creator_team_growth_targets/);
 assert.match(api,/saveRubiCreatorTeamGrowthTargetsAdmin/);
 assert.match(api,/requireOwnerRole/g);
 assert.match(api,/teamId:uuid/);
 assert.match(api,/onConflict:"team_id"/);
 assert.match(ui,/Grande \/ mega/);
 assert.match(ui,/nano → grandes influenciadores/);
 assert.match(ui,/não criadores ativos/);
 assert.match(ui,/não autorizam despesas/);
 assert.match(owner,/<RubiCreatorTeamGrowthAdmin teamId=\{team\.id\}/);
 assert.doesNotMatch(api,/hub_partner_confirmed_sales|payCommission|grantProducts/);
});

test("Only approved partners can be assigned to RUBI creator teams",()=>{
 const migration=source("../../supabase/migrations/20261112033000_rubi_creator_team_members.sql");
 const api=source("./rubi-creator-team-members.functions.ts");
 const panel=source("../components/partner/RubiCreatorTeamMembersAdmin.tsx");
 const admin=source("../routes/admin/hub-catalog.tsx");
 assert.match(migration,/rubi_creator_team_members/);
 assert.match(migration,/enable row level security/);
 assert.match(migration,/revoke all on public\.rubi_creator_team_members from public,anon,authenticated/);
 assert.match(api,/requireOwnerRole/g);
 assert.match(api,/\.eq\("audience","partner"\)\.eq\("status","approved"\)/);
 assert.match(api,/profile\.status!=="approved"/);
 assert.match(api,/onConflict:"team_id,commercial_profile_id"/);
 assert.match(panel,/Parceiro aprovado/);
 assert.match(panel,/Vínculo pausado/);
 assert.match(panel,/não cria link de venda, grant de produto, comissão/);
 assert.match(admin,/<RubiCreatorTeamMembersAdmin \/>/);
 assert.doesNotMatch(api,/hub_partner_agreements|hub_partner_product_grants|payCommission/);
});

test("Creator team analytics are owner-only and never infer paid outcomes from visits",()=>{
 const api=source("./rubi-creator-team-performance.functions.ts");
 const panel=source("../components/partner/RubiCreatorTeamPerformanceAdmin.tsx");
 const owner=source("../routes/admin/hub-catalog.tsx");
 assert.match(api,/requireOwnerRole/);
 assert.match(api,/rubi_creator_team_members/);
 assert.match(api,/hub_partner_referral_visits/);
 assert.match(api,/hub_partner_confirmed_sales/);
 assert.match(api,/\.eq\("status","approved"\)/);
 assert.match(api,/partial/);
 assert.match(panel,/Vendas confirmadas não significam pagamentos liquidados/);
 assert.match(panel,/Não foi possível confirmar os indicadores/);
 assert.match(owner,/<RubiCreatorTeamPerformanceAdmin \/>/);
 assert.doesNotMatch(api,/payCommission|grantProduct|update\("hub_partner/);
});

test("Team historical ledger is protected and drives conservative time-accurate attribution",()=>{
 const migration=source("../../supabase/migrations/20261112043000_rubi_creator_team_membership_history.sql");
 const history=source("./rubi-creator-team-membership-history.functions.ts");
 const attribution=source("./rubi-creator-team-performance.functions.ts");
 const panel=source("../components/partner/RubiCreatorTeamMembersAdmin.tsx");
 const performance=source("../components/partner/RubiCreatorTeamPerformanceAdmin.tsx");
 assert.match(migration,/rubi_creator_team_membership_events/);
 assert.match(migration,/enable row level security/);
 assert.match(migration,/revoke all on public\.rubi_creator_team_membership_events from public,anon,authenticated/);
 assert.match(migration,/migrated_baseline/);
 assert.match(migration,/append-only/);
 assert.match(history,/requireOwnerRole/);
 assert.match(history,/\.limit\(200\)/);
 assert.match(attribution,/summarizeRubiCreatorTeamsPerformanceWithHistory/);
 assert.match(attribution,/rubi_creator_team_membership_events/);
 assert.match(attribution,/\.length===5000/);
 assert.match(panel,/<RubiCreatorTeamMembershipHistoryAdmin teams=\{teams\} \/>/);
 assert.match(performance,/query\.data&&!query\.data\.partial/);
});

test("Creator team creative campaign assignments remain private and approval gated",()=>{
 const schema=source("../../supabase/migrations/20261112053000_rubi_creator_team_campaign_assignments.sql");
 const api=source("./rubi-team-campaign-assignments.functions.ts");
 const panel=source("../components/partner/RubiTeamCampaignAssignmentsAdmin.tsx");
 const owner=source("../routes/admin/hub-catalog.tsx");
 assert.match(schema,/rubi_creator_team_campaign_assignments/);
 assert.match(schema,/enable row level security/g);
 assert.match(schema,/revoke all on public\.rubi_creator_team_campaign_assignments from public,anon,authenticated/);
 assert.match(schema,/rubi_creator_team_campaign_assignment_events/);
 assert.match(schema,/append-only/);
 assert.match(api,/requireOwnerRole/g);
 assert.match(api,/plan\.product_id!==movement\.product_id/);
 assert.match(api,/variant\.movement_id!==movement\.id/);
 assert.match(api,/checked\.plan\.status!=="approved"/);
 assert.match(api,/checked\.variant\.media_rights_confirmed!==true/);
 assert.match(api,/\.eq\("status",existing\.status\)/);
 assert.match(panel,/Registrar associação planejada/);
 assert.match(panel,/não publica anúncios/);
 assert.match(owner,/<RubiTeamCampaignAssignmentsAdmin \/>/);
 assert.doesNotMatch(api,/payCommission|publishAd|grantProducts|spendBudget/);
});

test("Creator publication evidence requires an active approved partner and manual Master review",()=>{
 const migration=source("../../supabase/migrations/20261112063000_rubi_creator_team_publication_evidence.sql");
 const api=source("./rubi-team-publications.functions.ts");
 const ui=source("../components/partner/RubiTeamPublicationsAdmin.tsx");
 const admin=source("../routes/admin/hub-catalog.tsx");
 assert.match(migration,/enable row level security/);
 assert.match(migration,/revoke all on public\.rubi_creator_team_publication_evidence from public,anon,authenticated/);
 assert.match(migration,/review_status in \('submitted','reviewed','rejected'\)/);
 assert.match(api,/requireOwnerRole/g);
 assert.match(api,/assignment\.status!=="ready"/);
 assert.match(api,/member\.team_id!==assignment\.team_id/);
 assert.match(api,/member\.status!=="active"/);
 assert.match(api,/\.eq\("status","approved"\)/);
 assert.match(api,/\.eq\("review_status","submitted"\)/);
 assert.match(api,/at<Date\.parse\(member\.joined_at\)/);
 assert.match(ui,/Registrar referência para revisão/);
 assert.match(ui,/não certifica visualizações, pagamentos ou vendas atribuídas/);
 assert.match(admin,/<RubiTeamPublicationsAdmin \/>/);
 assert.doesNotMatch(api,/payCommission|publishAd|spendBudget|grantProducts/);
});

test("Creator publication campaign audit distinguishes traffic from individual commission",()=>{
 const api=source("./rubi-creator-publication-audit.functions.ts");
 const core=source("./rubi-creator-publication-audit.ts");
 const ui=source("../components/partner/RubiCreatorPublicationAuditAdmin.tsx");
 const owner=source("../routes/admin/hub-catalog.tsx");
 assert.match(api,/requireOwnerRole/);
 assert.match(api,/rubi_creator_team_publication_evidence/);
 assert.match(api,/rubi_organic_campaign_performance/);
 assert.match(api,/limited/);
 assert.match(core,/review_status!=="reviewed"/);
 assert.match(core,/ambiguous_campaign/);
 assert.match(core,/matched_campaign/);
 assert.match(ui,/não mede alcance|não mede alcance/i);
 assert.match(ui,/nenhuma comissão pode ser calculada/);
 assert.match(owner,/<RubiCreatorPublicationAuditAdmin \/>/);
 assert.doesNotMatch(api,/payCommission|grantProducts|publishAd/);
});

test("Master connected commercial flow reuses existing secure stages with navigable anchors",()=>{
 const api=source("./rubi-connected-commercial-flow.functions.ts");
 const panel=source("../components/admin/RubiConnectedCommercialFlowAdmin.tsx");
 const owner=source("../routes/admin/hub-catalog.tsx");
 assert.match(api,/requireOwnerRole/);
 assert.match(api,/count:"exact",head:true/g);
 assert.match(api,/rubi_master_campaign_plans/);
 assert.match(api,/rubi_creator_team_members/);
 assert.match(api,/rubi_creator_team_publication_evidence/);
 assert.match(panel,/nextRubiConnectedFlowAction/);
 assert.match(panel,/rubi-master-connected-flow/);
 assert.match(owner,/<RubiConnectedCommercialFlowAdmin \/>/);
 for(const anchor of ["rubi-catalog-entry","rubi-movement-entry","rubi-team-entry","rubi-team-members-entry","rubi-team-campaign-entry","rubi-team-publications-entry","rubi-team-publication-audit-entry"]){
  assert.ok(owner.includes('id="'+anchor+'"'));
 }
 assert.doesNotMatch(api,/payCommission|createCheckout|publishAd|grantProducts/);
});

test("Reviewed creator publications reuse only approved existing partner SKU links",()=>{
 const bridge=source("./rubi-publication-referrals.functions.ts");
 const panel=source("../components/partner/RubiTeamPublicationsAdmin.tsx");
 assert.match(bridge,/requireOwnerRole/);
 assert.match(bridge,/rubi_creator_team_publication_evidence/);
 assert.match(bridge,/hub_partner_referral_links/);
 assert.match(bridge,/hub_partner_product_grants/);
 assert.match(bridge,/approvedRubiCheckout\(product\)/);
 assert.match(bridge,/member\.team_id!==assignment\.team_id/);
 assert.match(bridge,/plan\.status!=="approved"/);
 assert.match(bridge,/plan\.mode!=="creator_team"/);
 assert.match(bridge,/if\(limited\)return \{links:\[\]/);
 assert.match(panel,/getRubiPublicationAuthorizedReferralsAdmin/);
 assert.match(panel,/Checkout com comissão continua bloqueado/);
 assert.doesNotMatch(bridge,/insert\(|upsert\(|payCommission|spendBudget|publishAd/);
});

test("Publication-tagged partner visits retain exact commercial checks and original checkout safeguards",()=>{
 const sql=source("../../supabase/migrations/20261112073000_rubi_referral_publication_tag.sql");
 const resolve=source("./partner-referral-visit.functions.ts");
 const route=source("../routes/r/$code.tsx");
 const panel=source("../components/partner/RubiTeamPublicationsAdmin.tsx");
 assert.match(sql,/alter table public\.hub_partner_referral_visits/);
 assert.match(sql,/references public\.rubi_creator_team_publication_evidence\(id\)/);
 assert.match(resolve,/publicationId: z\.string\(\)\.uuid\(\)\.optional\(\)/);
 assert.match(resolve,/\.eq\("review_status", "reviewed"\)/);
 assert.match(resolve,/member\.commercial_profile_id !== link\.commercial_profile_id/);
 assert.match(resolve,/plan\.product_id !== link\.product_id/);
 assert.match(resolve,/\.from\("hub_partner_referral_visits"\)/);
 assert.match(resolve,/publication_id: input\.publicationId/);
 assert.match(route,/validateSearch/);
 assert.match(route,/\["partner-referral", code, pub, visitToken\]/);
 assert.match(panel,/\?pub=/);
 assert.doesNotMatch(resolve,/payCommission|createCheckout|publishAd/);
});

test("Master tagged-visit panel uses exact DB aggregate and never equates events to buyers",()=>{
 const sql=source("../../supabase/migrations/20261112083000_rubi_creator_publication_visit_counts.sql");
 const api=source("./rubi-creator-tagged-visits.functions.ts");
 const panel=source("../components/partner/RubiCreatorTaggedVisitsAdmin.tsx");
 const owner=source("../routes/admin/hub-catalog.tsx");
 assert.match(sql,/security invoker/);
 assert.match(sql,/revoke all on function public\.rubi_creator_publication_visit_counts/);
 assert.match(sql,/grant execute on function public\.rubi_creator_publication_visit_counts/);
 assert.match(sql,/service_role/);
 assert.match(api,/requireOwnerRole/);
 assert.match(api,/rubi_creator_publication_visit_counts/);
 assert.match(api,/if\(limited\)return \{rows:\[\]/);
 assert.match(api,/p_publication_ids:ids/);
 assert.match(panel,/não representa pessoas únicas/);
 assert.match(owner,/<RubiCreatorTaggedVisitsAdmin \/>/);
 assert.doesNotMatch(api,/payCommission|createCheckout|publishAd/);
});

test("Referral visit idempotency does not track people or unlock partner checkout",()=>{
 const migration=source("../../supabase/migrations/20261112093000_rubi_referral_visit_idempotency.sql");
 const resolve=source("./partner-referral-visit.functions.ts");
 const route=source("../routes/r/$code.tsx");
 assert.match(migration,/add column if not exists visit_token uuid/);
 assert.match(migration,/unique index if not exists hub_partner_referral_visits_token_uniq/);
 assert.match(migration,/referral_link_id,visit_token/);
 assert.match(resolve,/visitToken: z\.string\(\)\.uuid\(\)\.optional\(\)/);
 assert.match(resolve,/ignoreDuplicates: true/);
 assert.match(resolve,/onConflict: "referral_link_id,visit_token"/);
 assert.match(resolve,/visitWrite\.insert\(visitRecord\)/);
 assert.match(route,/sessionStorage\.getItem/);
 assert.match(route,/crypto\.randomUUID/);
 assert.match(route,/30 \* 60_000/);
 assert.match(route,/enabled: visitToken !== null/);
 assert.doesNotMatch(route,/localStorage\.|navigator\.userAgent|document\.cookie|geolocation\.getCurrentPosition/);
 assert.doesNotMatch(resolve,/payCommission|createCheckout|publishAd|grantProduct/);
});

test("RUBI referral quality diagnostic is owner-only, aggregated and separated from sales",()=>{
 const sql=source("../../supabase/migrations/20261112103000_rubi_referral_visit_quality_daily.sql");
 const api=source("./rubi-referral-traffic-quality.functions.ts");
 const panel=source("../components/partner/RubiReferralTrafficQualityAdmin.tsx");
 const route=source("../routes/admin/hub-catalog.tsx");
 assert.match(sql,/security invoker/);
 assert.match(sql,/revoke all on function public\.rubi_referral_visit_quality_daily/);
 assert.match(sql,/grant execute on function public\.rubi_referral_visit_quality_daily/);
 assert.match(sql,/service_role/);
 assert.match(sql,/count\(\*\) filter \(where v\.visit_token is null\)/);
 assert.match(api,/requireOwnerRole/);
 assert.match(api,/rubi_referral_visit_quality_daily/);
 assert.match(api,/tokenized_events\+r\.legacy_events!==r\.total_events/);
 assert.match(panel,/não comprova visitantes únicos/);
 assert.match(route,/<RubiReferralTrafficQualityAdmin \/>/);
 assert.doesNotMatch(api,/visitor_id|ip_address|user_agent|payCommission|createCheckout/);
});

test("Partner precheckout view is an idempotent stage of an existing validated visit, not a sale",()=>{
 const migration=source("../../supabase/migrations/20261112113000_rubi_partner_precheckout_stage.sql");
 const api=source("./rubi-partner-precheckout-stage.functions.ts");
 const route=source("../routes/r/$code.tsx");
 const precheckout=source("../components/store/RubiPreCheckout.tsx");
 const metric=source("./rubi-creator-tagged-visits.functions.ts");
 const master=source("../components/partner/RubiCreatorTaggedVisitsAdmin.tsx");
 assert.match(migration,/add column if not exists precheckout_viewed_at/);
 assert.match(migration,/security invoker/);
 assert.match(migration,/revoke all on function public\.rubi_creator_publication_precheckout_counts/);
 assert.match(migration,/grant execute on function public\.rubi_creator_publication_precheckout_counts/);
 assert.match(api,/visitToken:z\.string\(\)\.uuid\(\)/);
 assert.match(api,/approvedRubiCheckout\(product\.data\)/);
 assert.match(api,/\.eq\("active",true\)/);
 assert.match(api,/\.eq\("visit_token",data\.visitToken\)/);
 assert.match(api,/\.is\("precheckout_viewed_at",null\)/);
 assert.match(api,/\.eq\("publication_id",data\.publicationId\)/);
 assert.match(api,/\.is\("publication_id",null\)/);
 assert.match(api,/\.gte\("visited_at",cutoff\)/);
 assert.doesNotMatch(api,/insert\(|payCommission|publishAd|createCheckout/);
 assert.match(route,/visitToken \? \{visitToken\}/);
 assert.match(precheckout,/markRubiPartnerPrecheckoutViewed/);
 assert.match(metric,/rubi_creator_publication_precheckout_counts/);
 assert.match(metric,/count>\(byId\.get\(id\)\?\?0\)/);
 assert.match(master,/Pré-checkouts exibidos/);
});

test("Store offer and creator team movement kit reuses the same product and preserves private approvals",()=>{
 const api=source("./rubi-team-offer-kit.functions.ts");
 const panel=source("../components/partner/RubiTeamOfferKitAdmin.tsx");
 const owner=source("../routes/admin/hub-catalog.tsx");
 assert.match(api,/requireOwnerRole/);
 assert.match(api,/rubi_creator_team_campaign_assignments/);
 assert.match(api,/rubi_offer_playbooks/);
 assert.match(api,/\.eq\("audience","consumer"\)/);
 assert.match(api,/rubi_movement_variants/);
 assert.match(api,/rubi_creator_teams/);
 assert.match(api,/rubi_master_campaign_plans/);
 assert.match(api,/plan\.product_id!==movement\.product_id/);
 assert.match(api,/variant\.movement_id!==movement\.id/);
 assert.match(api,/approvedRubiCheckout\(product\)/);
 assert.match(api,/media_rights_confirmed===true/);
 assert.match(api,/hub_partner_product_grants/);
 assert.match(api,/hub_partner_referral_links/);
 assert.match(api,/offerReadiness\?\.score===100/);
 assert.match(api,/Compatibilidade entre nicho e categoria exige revisão humana/);
 assert.match(panel,/Kit conectado: oferta, funil, movimento e time/);
 assert.match(owner,/<RubiTeamOfferKitAdmin \/>/);
 assert.doesNotMatch(api,/\.insert\(|\.update\(|\.upsert\(|payCommission|publishAd|createCheckout|grantProducts/);
});

test("Master reviewed creative library reuses variants by product and forbids automatic licensing claims",()=>{
 const api=source("./rubi-creative-library.functions.ts");
 const panel=source("../components/store/RubiCreativeLibraryAdmin.tsx");
 const owner=source("../routes/admin/hub-catalog.tsx");
 assert.match(api,/requireOwnerRole/);
 assert.match(api,/rubi_movement_variants/);
 assert.match(api,/rubi_movements/);
 assert.match(api,/hub_products/);
 assert.match(api,/\.eq\("status","review"\)/);
 assert.match(api,/\.eq\("media_rights_confirmed",true\)/);
 assert.match(api,/movement\.status!=="review"/);
 assert.match(api,/if\(variants\.length>=201\)return \{items:\[\],partial:true\}/);
 assert.match(panel,/Biblioteca central de criativos e páginas/);
 assert.match(panel,/declaração de direitos não é licença verificada/);
 assert.match(owner,/<RubiCreativeLibraryAdmin \/>/);
 assert.doesNotMatch(api,/\.insert\(|\.update\(|\.upsert\(|payCommission|publishAd|grantProducts/);
});


test("Creative library copied text explicitly remains an internal unlicensed draft",()=>{
 const library=source("../components/store/RubiCreativeLibraryAdmin.tsx");
 assert.match(library,/RASCUNHO INTERNO — NÃO PUBLICAR OU DISTRIBUIR/);
 assert.match(library,/A declaração de direitos não comprova licença de mídia/);
 assert.match(library,/Copiar rascunho interno/);
 assert.match(library,/O texto copiado leva aviso obrigatório/);
 const api=source("./rubi-creative-library.functions.ts");
 assert.match(api,/requireOwnerRole/);
 assert.match(api,/\.eq\("status","review"\)/);
 assert.doesNotMatch(api,/publishAd|payCommission|createCheckout/);
});

test("Movement reporting discloses incomplete bounded data rather than declaring A/B winners",()=>{
 const server=source("./rubi-movement-performance.functions.ts");
 const panel=source("../components/store/RubiMovementPerformanceAdmin.tsx");
 assert.match(server,/variantsTruncated=variantRows\.length===100/);
 assert.match(server,/plansTruncated=\(planRows\?\?\[\]\)\.length===800/);
 assert.match(server,/aggregateTruncated=\(agg\?\?\[\]\)\.length>=200/);
 assert.match(server,/coverage:partial\?"partial":"bounded"/);
 assert.match(panel,/query\.data\.partial/);
 assert.match(panel,/não classifique vencedores nem conclua testes A\/B/);
});

test("RUBI discovery gives transparent empty, error and preference navigation states",()=>{
 const shelf=source("../components/store/RubiApprovedMovementShelf.tsx");
 assert.match(shelf,/query\.isLoading/);
 assert.match(shelf,/query\.isError/);
 assert.match(shelf,/query\.refetch\(\)/);
 assert.match(shelf,/Explorar a RUBI Store/);
 assert.match(shelf,/href="\/hub-shop"/);
 assert.match(shelf,/href="\/profile"/);
 assert.match(shelf,/não usa características pessoais sensíveis/);
});

test("Consent-first category personalization reaches marketplace and approved Store shelf",()=>{
 const marketplace=source("./personalization.functions.ts");
 const store=source("./rubi-movement-feed.functions.ts");
 const shelf=source("../components/store/RubiApprovedMovementShelf.tsx");
 const profile=source("../routes/profile.tsx");
 const ranking=source("./rubi-unified-interest-ranking.ts");
 const mix=source("./rubi-feed-mix.ts");
 assert.match(marketplace,/const explicitCategories = \(preferences\?\.preferred_categories/);
 assert.match(marketplace,/categoryIds = explicitCategories\.slice\(0, 10\)/);
 assert.match(marketplace,/Consent-first: category targeting never derives preferences from behavioral scores/);
 assert.doesNotMatch(marketplace,/from\("user_interests"\)\.select\("category_id"\)/);
 assert.match(marketplace,/planRubiFeedMix\(limit/);
 assert.match(mix,/hasVerifiedInterests/);
 assert.match(store,/preferred_categories/);
 assert.match(store,/rankRubiOffersByInterests\(result,interests,6\)/);
 assert.match(store,/approvedRubiCheckout\(product\)/);
 assert.match(shelf,/refetchOnWindowFocus:"always"/);
 assert.match(profile,/preferred_categories: selectedCategories/);
 assert.match(ranking,/seen\.has\(item\.offer\.productId\)/);
});

test("Movement Master editor exposes evidence validation and respects server editorial blockers",()=>{
 const ui=source("../components/store/RubiMovementEngineAdmin.tsx");
 const server=source("./rubi-movements.functions.ts");
 assert.match(ui,/rubiMovementEditorialQuality\(draft\)/);
 assert.match(ui,/disabled=\{!canSendToReview\}/);
 assert.match(ui,/Corrija antes da revisão:/);
 assert.match(ui,/fonte e data da pesquisa/);
 assert.match(ui,/o que contradiz a hipótese/);
 assert.match(ui,/Não registre entrevistas, métricas ou provas que não aconteceram/);
 assert.match(server,/rubiMovementEditorialQuality\(data\)/);
 assert.match(server,/if\(data.status==="review"&&!canReviewRubiMovement\(data\)\)/);
});

test("Master evidence review ledger is private, immutable, version-pinned and not publication",()=>{
 const schema=source("../../supabase/migrations/20261112210000_rubi_audience_evidence_reviews.sql");
 const server=source("./rubi-audience-review.functions.ts");
 const panel=source("../components/store/RubiAudienceEvidenceReviewAdmin.tsx");
 const editor=source("../components/store/RubiMovementEngineAdmin.tsx");
 assert.match(schema,/rubi_audience_evidence_reviews/);
 assert.match(schema,/enable row level security/);
 assert.match(schema,/revoke all on public\.rubi_audience_evidence_reviews from public,anon,authenticated/);
 assert.match(schema,/before update or delete/);
 assert.match(schema,/before insert/);
 assert.match(schema,/Movement evidence changed/);
 assert.match(server,/requireOwnerRole/g);
 assert.match(server,/movement\.revision!==data\.movementRevision/);
 assert.match(server,/assessRubiAudienceEvidenceStatus\(evidence\)/);
 assert.match(server,/movement_revision:data\.movementRevision/);
 assert.match(server,/evidence_snapshot:evidence/);
 assert.match(panel,/Registro documental não|Revisão documental não significa/);
 assert.match(panel,/Histórico parcial/);
 assert.match(editor,/draft\?\.id&&draft\.revision&&!dirty&&<RubiAudienceEvidenceReviewAdmin/);
 assert.doesNotMatch(server,/publishAd|payCommission|createCheckout|confirmedSale/);
});

test("Movement campaign labels cannot silently overlap different variants of the same SKU",()=>{
 const server=source("./rubi-movement-distribution.functions.ts");
 const generator=source("./rubi-movement-distribution.ts");
 assert.match(generator,/variantId\.replaceAll\("-",\s*""\)\.slice\(0,12\)/);
 assert.match(server,/\.eq\("channel",data\.channel\)\.eq\("campaign",data\.campaign\)/);
 assert.match(server,/othersOnLabel/);
 assert.match(server,/x\.id!==data\.id/);
 assert.match(server,/\.from\("rubi_movement_variants"\)/);
 assert.match(server,/\.from\("rubi_movements"\)/);
 assert.match(server,/x\.product_id===movement\.product_id/);
 assert.match(server,/código exclusivo para atribuição confiável/);
 assert.match(server,/Consulta de campanhas incompleta/);
 assert.doesNotMatch(server,/publishAd|confirmPaidOrder|payCommission/);
});
