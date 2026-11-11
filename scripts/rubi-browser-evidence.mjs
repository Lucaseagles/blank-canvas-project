import {readFile,writeFile,mkdir} from "node:fs/promises";
import {resolve} from "node:path";

export const RUBI_TEST_MATRIX=[
 {id:"store_mobile",title:"vitrine HTTPS renderiza e permite descobrir produtos sem pagamento",project:"mobile",area:"RUBI Store",kind:"browser_public"},
 {id:"store_desktop",title:"vitrine HTTPS renderiza e permite descobrir produtos sem pagamento",project:"desktop",area:"RUBI Store",kind:"browser_public"},
 {id:"video_mobile",title:"feed de vídeos pode ser aberto sem confirmar pedidos",project:"mobile",area:"RUBI Story",kind:"browser_public"},
 {id:"video_desktop",title:"feed de vídeos pode ser aberto sem confirmar pedidos",project:"desktop",area:"RUBI Story",kind:"browser_public"},
 {id:"guest_master",title:"área Master não libera painel para sessão anônima",project:null,area:"Shadow Master",kind:"guest_guard"},
 {id:"guest_merchant",title:"atacado não mostra valores B2B sem login aprovado",project:null,area:"Business",kind:"guest_guard"},
 {id:"guest_partner",title:"portal de parceiros não mostra comissões sem autenticação",project:null,area:"Partners",kind:"guest_guard"}
];
const outcomes=new Set(["passed","failed","skipped","timedOut","interrupted"]);
function collect(specs,results=[],prefix=""){
 for(const spec of specs??[]){
  if(spec.specs)collect(spec.specs,results,prefix+" "+(spec.title??""));
  else if(spec.tests)results.push({title:spec.title??"",fullTitle:(prefix+" "+spec.title).trim(),
    outcomes:spec.tests.flatMap(t=>t.results?.map(r=>r.status)??[])});
 }
 return results;
}
export function summarizeRubiBrowserEvidence(report){
 const entries=collect(report?.suites);
 return RUBI_TEST_MATRIX.map(check=>{
  const found=entries.find(e=>e.title===check.title&&(!check.project||e.fullTitle.includes(check.project)));
  const statuses=found?.outcomes??[];
  let state="not_run";
  if(statuses.length){
   const last=statuses[statuses.length-1];
   state=outcomes.has(last)?last:"unknown";
  }
  return {...check,state};
 });
}
export function rubiBrowserEvidenceMarkdown(matrix,origin){
 const header=["# RUBI Eagles — Evidências de homologação em navegador",
  `**Origem informada:** ${origin||"não configurada"}`,
  "**Escopo:** navegação pública em mobile e desktop; restrições para visitantes anônimos. Sem compras, sem autenticação com usuários reais.",
  "| Área | Verificação | Resultado |","|---|---|---|"];
 const body=matrix.map(x=>`| ${x.area} | ${x.id} | ${x.state} |`);
 const footer=["","## Pendências que NÃO podem ser consideradas aprovadas",
 "- Consumidor autenticado: personalização e navegação com sessão real",
 "- Lojista aprovado: acesso a tabela de preços B2B por sessão real",
 "- Parceiro aprovado: limites de grants e links próprios por sessão real",
 "- Shadow Master: sessão real exclusiva com papel owner",
 "- Checkout Kairos: destino oficial e teste autorizado de compra/repasse",
 "- Domínio próprio e experiência visual: somente ficam homologados após execução do workflow no domínio real e revisão das evidências",
 "","**Critério:** resultado de teste somente após browser real. Um workflow criado ou build verde não constitui homologação do site."];
 return [...header,...body,...footer].join("\n")+"\n";
}
async function main(){
 const folder=resolve("artifacts");
 await mkdir(folder,{recursive:true});
 let raw;
 try{raw=JSON.parse(await readFile(resolve(folder,"rubi-browser-results.json"),"utf8"));}
 catch{raw={suites:[]};}
 const matrix=summarizeRubiBrowserEvidence(raw);
 const origin=process.env.RUBI_STOREFRONT_URL??"";
 const report={checked_at:new Date().toISOString(),origin,results:matrix,
  fully_run:matrix.every(x=>x.state!=="not_run"),
  passed:matrix.every(x=>x.state==="passed"),
  authenticated_profiles_tested:false,checkout_kairos_tested:false};
 const md=rubiBrowserEvidenceMarkdown(matrix,origin);
 await writeFile(resolve(folder,"rubi-browser-evidence.json"),JSON.stringify(report,null,2)+"\n");
 await writeFile(resolve(folder,"rubi-browser-evidence.md"),md);
 if(process.env.GITHUB_STEP_SUMMARY)await writeFile(process.env.GITHUB_STEP_SUMMARY,md,{flag:"a"});
 process.stdout.write(md);
}
if(process.argv[1]&&import.meta.url===new URL(`file://${resolve(process.argv[1])}`).href){
 main().catch(e=>{console.error(e);process.exitCode=1;});
}
