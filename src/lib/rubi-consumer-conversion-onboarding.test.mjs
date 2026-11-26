import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=p=>readFileSync(new URL(p,import.meta.url),"utf8");

test("consumer precheckout invitation is persuasive, optional and preserves the purchase path",()=>{
 const pre=read("../components/store/RubiPreCheckout.tsx");
 assert.match(pre,/Sua experiência RUBI começa aqui/);
 assert.match(pre,/Salve produtos favoritos/);
 assert.match(pre,/Escolha categorias de interesse/);
 assert.match(pre,/A conta é opcional/);
 assert.match(pre,/Continuar sem cadastro/);
 assert.match(pre,/returnTo, audience: undefined/);
 assert.match(pre,/origin === "partner" \? partnerCode : undefined/);
 assert.match(pre,/seguir para a compra sem se cadastrar/);
 assert.match(pre,/window\.location\.assign\(url\.toString\(\)\)/);
});

test("consumer education explains concrete value without guaranteed benefits or forced signup",()=>{
 const guide=read("../components/growth/RubiConversionGuide.tsx");
 assert.match(guide,/Mais descoberta, menos procura/);
 assert.match(guide,/salvar favoritos/);
 assert.match(guide,/O cadastro é opcional/);
 assert.match(guide,/não garante desconto ou benefício/);
 const onboarding=read("../routes/onboarding.tsx");
 assert.match(onboarding,/Quais categorias mais interessam a você/);
 assert.match(onboarding,/Você pode alterar depois no perfil/);
 assert.match(onboarding,/Perfil registrado!/);
});

test("signup and login retain the product return journey and partner acquisition disclosure",()=>{
 const register=read("../routes/register.tsx");
 const auth=read("../routes/auth.tsx");
 assert.match(register,/safeOfferReturn/);
 assert.match(register,/rubi_new_account_activation/);
 assert.match(register,/returnTo: search\.returnTo/);
 assert.match(auth,/bindMyPartnerCustomerAcquisition/);
 assert.match(auth,/search\.audience/);
 assert.match(auth,/safeReturn/);
});
