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
 assert.doesNotMatch(landing,/createMyPartnerReferralLink|saveHubPartnerAgreement|hub_partner_product_grants/);
});
