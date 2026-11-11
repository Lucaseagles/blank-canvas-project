import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {RUBI_TEST_MATRIX,summarizeRubiBrowserEvidence,rubiBrowserEvidenceMarkdown} from "../../scripts/rubi-browser-evidence.mjs";
const paths=(p)=>readFileSync(new URL(p,import.meta.url),"utf8");
test("Empty report must not claim a passed browser test",()=>{
 const result=summarizeRubiBrowserEvidence({suites:[]});
 assert.equal(result.length,7);
 assert.equal(result.every(item=>item.state==="not_run"),true);
 assert.match(rubiBrowserEvidenceMarkdown(result,""),/não configurada/);
 assert.match(rubiBrowserEvidenceMarkdown(result,""),/NÃO podem ser consideradas aprovadas/);
});
test("Mobile and desktop results are classified independently",()=>{
 const report={suites:[{title:"RUBI loja pública — mobile",specs:[
  {title:"vitrine HTTPS renderiza e permite descobrir produtos sem pagamento",tests:[{results:[{status:"passed"}]}]},
  {title:"feed de vídeos pode ser aberto sem confirmar pedidos",tests:[{results:[{status:"failed"}]}]}
 ]},{title:"RUBI loja pública — desktop",specs:[
  {title:"vitrine HTTPS renderiza e permite descobrir produtos sem pagamento",tests:[{results:[{status:"passed"}]}]},
  {title:"feed de vídeos pode ser aberto sem confirmar pedidos",tests:[{results:[{status:"passed"}]}]}
 ]},{title:"RUBI — isolamento sem credenciais",specs:[
  {title:"área Master não libera painel para sessão anônima",tests:[{results:[{status:"passed"}]}]}
 ]}]};
 const x=summarizeRubiBrowserEvidence(report);
 assert.equal(x.find(i=>i.id==="store_mobile")?.state,"passed");
 assert.equal(x.find(i=>i.id==="store_desktop")?.state,"passed");
 assert.equal(x.find(i=>i.id==="video_mobile")?.state,"failed");
 assert.equal(x.find(i=>i.id==="video_desktop")?.state,"passed");
 assert.equal(x.find(i=>i.id==="guest_master")?.state,"passed");
 assert.equal(x.find(i=>i.id==="guest_partner")?.state,"not_run");
});
test("Workflow always uploads evidence even on browser failures",()=>{
 const wf=paths("../../.github/workflows/rubi-browser-qa.yml");
 const config=paths("../../rubi-playwright.config.mjs");
 assert.match(wf,/Generate per-profile evidence matrix/);
 assert.match(wf,/if: always\(\)/);
 assert.match(config,/rubi-browser-results\.json/);
 assert.equal(RUBI_TEST_MATRIX.filter(r=>r.kind==="guest_guard").length,3);
});

test("Nested Playwright JSON suites retain actual browser results",()=>{
 const report={suites:[{title:"scripts/rubi-browser.e2e.spec.mjs",suites:[
  {title:"RUBI loja pública — mobile",specs:[{title:"vitrine HTTPS renderiza e permite descobrir produtos sem pagamento",tests:[{results:[{status:"passed"}]}]}]}
 ]}]};
 assert.equal(summarizeRubiBrowserEvidence(report).find(x=>x.id==="store_mobile")?.state,"passed");
});
