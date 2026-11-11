import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=p=>readFileSync(new URL(p,import.meta.url),"utf8");
test("Owner-only readiness uses an exact total count separate from 200-row preview",()=>{
 const server=read("./rubi-launch-readiness.functions.ts");
 assert.match(server,/requireOwnerRole/);
 assert.match(server,/from\("hub_products"\)\.select\("id",\{count:"exact",head:true\}\)/);
 assert.match(server,/\.limit\(200\)/);
 assert.match(server,/totalProducts>products\.length/);
 assert.match(server,/productsNotAnalyzed:Math\.max\(0,totalProducts-products\.length\)/);
});
test("A missing database count must fail rather than claim zero products",()=>{
 const server=read("./rubi-launch-readiness.functions.ts");
 assert.match(server,/typeof productsCountResult\.count!=="number"/);
 assert.match(server,/Não foi possível consultar a contagem total de produtos/);
});
test("Master explicitly identifies partial results and sampled status counts",()=>{
 const ui=read("../components/store/RubiLaunchReadinessAdmin.tsx");
 assert.match(ui,/query\.data\.totalProducts/);
 assert.match(ui,/query\.data\.isPartial/);
 assert.match(ui,/query\.data\.productsNotAnalyzed/);
 assert.match(ui,/Os números de prontos, bloqueados e QA não são totais gerais/);
});
