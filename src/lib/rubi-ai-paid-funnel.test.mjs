import test from "node:test";
import assert from "node:assert/strict";
import {buildRubiPaidFunnelBrief,validateRubiPaidFunnel} from "./rubi-ai-paid-funnel.ts";

const base={mode:"ai_seller_video",audience:"consumer",productId:"00000000-0000-4000-8000-000000000001",productName:"Luz para leitura",campaign:"rubi_luz_01",dailyBudget:12.5,runDays:4,claimEvidence:"Ficha do produto e imagens autorizadas."};
test("AI video funnel generates an unspent bounded draft, not an ad",()=>{
 const brief=buildRubiPaidFunnelBrief(base);
 assert.match(brief,/Agente vendedor assistido por IA/);
 assert.match(brief,/R\$\s?50,00/);
 assert.match(brief,/RASCUNHO, NÃO PUBLICADO/);
 assert.match(brief,/IA: gerar sugestões/);
 assert.match(brief,/não há conexão automática com conta de anúncios/);
});
test("Direct-response funnel includes creative landing and verified provider checkout",()=>{
 const brief=buildRubiPaidFunnelBrief({...base,mode:"direct_response",audience:"merchant"});
 assert.match(brief,/Anúncio → criativo → página de vendas RUBI/);
 assert.match(brief,/\/wholesale/);
 assert.match(brief,/cotação|checkout/i);
});
test("Partner blueprint preserves grants and attribution, not generic UTMs",()=>{
 const brief=buildRubiPaidFunnelBrief({...base,audience:"partner"});
 assert.match(brief,/links atribuíveis/);
 assert.match(brief,/não usar UTM como substituto/);
 assert.match(brief,/\/partner\/portal/);
});
test("Reject invalid budget, invented claims without evidence and unsafe campaign IDs",()=>{
 const invalid={...base,dailyBudget:-5,runDays:0,campaign:"utm?foo",claimEvidence:""};
 assert.equal(validateRubiPaidFunnel(invalid).length,4);
 assert.throws(()=>buildRubiPaidFunnelBrief(invalid));
 assert.ok(validateRubiPaidFunnel({...base,dailyBudget:Number.POSITIVE_INFINITY}).length>0);
});
