import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=p=>readFileSync(new URL(p,import.meta.url),"utf8");
test("each audience's quiz is stored with atomic preferences, pending approval and no browser DML",()=>{
 const sql=read("../../supabase/migrations/20261114080000_rubi_onboarding_quiz_atomic.sql");
 const api=read("./rubi-onboarding-quiz.functions.ts");
 const onboarding=read("../routes/onboarding.tsx");
 assert.match(sql,/qualification_answers jsonb/);
 assert.match(sql,/insert into public.commercial_profiles/);
 assert.match(sql,/insert into public.user_preferences/);
 assert.match(sql,/on conflict\(user_id\) do update/);
 assert.match(sql,/'pending',p_answers/);
 assert.match(sql,/revoke all on function public.rubi_complete_commercial_onboarding/);
 assert.match(sql,/to service_role/);
 assert.match(sql,/p_audience='merchant'/);
 assert.match(sql,/p_audience='partner'/);
 assert.match(sql,/p_audience='consumer'/);
 assert.match(sql,/Unknown or inactive category/);
 assert.doesNotMatch(sql,/status,'approved'|security definer/i);
 assert.match(api,/supabaseAdmin.auth.getUser\(data.accessToken\)/);
 assert.match(api,/p_actor:auth.user.id/);
 assert.match(api,/rpc\("rubi_complete_commercial_onboarding"/);
 assert.match(onboarding,/completeRubiOnboarding/);
 assert.match(onboarding,/Quais categorias mais interessam/);
 assert.match(onboarding,/Com que frequência você repõe/);
 assert.match(onboarding,/Selecione seu principal canal/);
 assert.doesNotMatch(onboarding,/\.from\("commercial_profiles"\)\.insert/);
 assert.doesNotMatch(api,/\.from\("commercial_profiles"\)\.insert/);
});

test("premium partner onboarding explains differentiated affiliate, nano/micro, influencer and expert journeys",()=>{
 const onboarding=read("../routes/onboarding.tsx");
 const validator=read("./rubi-onboarding-quiz.functions.ts");
 const invite=read("../components/profile/RubiAffiliateMiniInvite.tsx");
 for(const label of ["Afiliado","Nano ou microcriador","Influenciador","Expert / especialista"])
  assert.ok(onboarding.includes(label),"missing partner journey: "+label);
 assert.match(onboarding,/Sua experiência Hub Eagles/);
 assert.match(onboarding,/O que você encontrará na sua dashboard/);
 assert.match(onboarding,/creator_tier:creatorTier/);
 assert.match(onboarding,/creator_tier/);
 assert.match(validator,/creator_tier/);
 assert.match(onboarding,/não há mínimo de seguidores/);
 assert.match(invite,/to="\/onboarding"/);
 assert.match(invite,/partnerType:"affiliate"/);
 assert.doesNotMatch(invite,/followers|follower_count|minimumFollowers/i);
});
