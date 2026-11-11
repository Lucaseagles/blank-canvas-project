import {lookup} from "node:dns/promises";
import {isIP} from "node:net";
import {writeFile,mkdir} from "node:fs/promises";
import {resolve} from "node:path";

export const PUBLIC_ROUTES=["/","/hub-shop","/videos"];
export const PROFILE_ROUTES=["/feed","/wholesale","/partner/portal","/admin"];
export function publicIp(address){
 const v=address.toLowerCase();
 if(v==="::1"||v==="::"||v.startsWith("fe80:")||v.startsWith("fc")||v.startsWith("fd")||v.startsWith("ff"))return false;
 if(v.includes(":")&&v.includes(".")){
  const last=v.slice(v.lastIndexOf(":")+1);
  return publicIp(last);
 }
 if(isIP(v)===6)return !v.startsWith("2001:db8:")&&!v.startsWith("2001:0db8:");
 if(isIP(v)!==4)return false;
 const n=v.split(".").map(Number);
 return !(n[0]===0||n[0]===10||n[0]===127||n[0]>=224||
  (n[0]===169&&n[1]===254)||
  (n[0]===172&&n[1]>=16&&n[1]<=31)||
  (n[0]===192&&n[1]===168)||
  (n[0]===100&&n[1]>=64&&n[1]<=127)||
  (n[0]===192&&n[1]===0&&n[2]===0)||
  (n[0]===198&&[18,19].includes(n[1]))||
  (n[0]===192&&n[1]===0&&n[2]===2)||
  (n[0]===198&&n[1]===51&&n[2]===100)||
  (n[0]===203&&n[1]===0&&n[2]===113));
}
export function parseDeploymentOrigin(input){
 if(!input)throw Error("Informe RUBI_STOREFRONT_URL (domínio HTTPS da loja publicada).");
 const url=new URL(input);
 if(url.protocol!=="https:"||url.username||url.password||url.port||url.search||url.hash||url.pathname!=="/"||
  url.hostname==="localhost"||!url.hostname.includes(".")||isIP(url.hostname))
  throw Error("Informe apenas uma origem pública HTTPS, sem caminho, porta ou credenciais.");
 return url.origin;
}
export async function assertPublicDns(origin,dns=lookup){
 const {hostname}=new URL(origin);
 const addresses=await dns(hostname,{all:true,verbatim:true});
 if(!addresses.length||addresses.some(({address})=>!publicIp(address)))throw Error("O domínio não aponta exclusivamente para IPs públicos.");
 return addresses.length;
}
export async function probeRoute(origin,path,fetchImpl=fetch){
 const url=new URL(path,origin);
 let response;
 try{
  response=await fetchImpl(url,{redirect:"manual",signal:AbortSignal.timeout(15000),headers:{Accept:"text/html", "User-Agent":"RUBI-Deployment-Smoke/1.0"}});
 }catch(error){
  return {route:path,ok:false,status:null,kind:"network_error",detail:error instanceof Error?error.message:"Falha na conexão"};
 }
 const status=response.status;
 if(status>=300&&status<400){
  const target=response.headers.get("location");
  if(!target)return {route:path,ok:false,status,kind:"invalid_redirect",detail:"Redirecionamento sem Location"};
  const redirect=new URL(target,url);
  if(redirect.origin!==origin)return {route:path,ok:false,status,kind:"external_redirect",detail:"Redirecionamento externo; confira domínio e destino"};
  if(PUBLIC_ROUTES.includes(path)&&(redirect.pathname==="/auth"||redirect.pathname==="/login"))
   return {route:path,ok:false,status,kind:"public_login_redirect",detail:"Rota pública exigiu login"};
  return {route:path,ok:true,status,kind:"same_origin_redirect",detail:"Rota redireciona internamente; verificar no navegador"};
 }
 const type=response.headers.get("content-type")??"";
 const body=status>=200&&status<300?await response.text():"";
 const valid=status>=200&&status<300&&type.toLowerCase().includes("text/html")&&body.trim().length>=100;
 return {route:path,ok:valid,status,kind:valid?"html_response":"invalid_response",detail:valid?"HTML público devolvido pelo servidor":"Erro HTTP ou resposta não HTML/curta"};
}
export async function runSmoke(origin,{dns=lookup,fetchImpl=fetch}={}){
 await assertPublicDns(origin,dns);
 const probes=[];
 for(const route of [...PUBLIC_ROUTES,...PROFILE_ROUTES])probes.push(await probeRoute(origin,route,fetchImpl));
 return {
  checked_at:new Date().toISOString(),origin,
  public_success:probes.filter(p=>PUBLIC_ROUTES.includes(p.route)).every(p=>p.ok),
  public_checks:probes.filter(p=>PUBLIC_ROUTES.includes(p.route)),
  profile_route_responses:probes.filter(p=>PROFILE_ROUTES.includes(p.route)),
  excluded:["Não testa autenticação real dos quatro perfis","Não executa JavaScript ou confirma layout responsivo","Não testa checkout Kairos nem faz compras","Não verifica DNS configurado na conta do registrador ou ownership do domínio"],
 };
}
async function main(){
 const origin=parseDeploymentOrigin(process.env.RUBI_STOREFRONT_URL);
 const report=await runSmoke(origin);
 const dir=resolve("artifacts");
 await mkdir(dir,{recursive:true});
 await writeFile(resolve(dir,"rubi-live-smoke.json"),JSON.stringify(report,null,2)+"\n");
 const fmt=p=>`| \`${p.route}\` | ${p.status??"erro"} | ${p.ok?"OK":"Falha"} | ${p.detail.replaceAll("|","/")} |`;
 const md=[
  "## RUBI — Verificação HTTPS da loja publicada",
  `**Domínio:** ${report.origin} · **Data:** ${report.checked_at}`,
  `**Rotas públicas:** ${report.public_success?"HTTP básico aprovado":"Pelo menos uma falha"}`,
  "| Rota | HTTP | Resultado | Observação |","|---|---:|---|---|",
  ...report.public_checks.map(fmt),
  "### Respostas das rotas dos perfis (somente HTTP, não autorização)",
  "| Rota | HTTP | Resultado | Observação |","|---|---:|---|---|",
  ...report.profile_route_responses.map(fmt),
  "### O que este teste NÃO comprova",
  ...report.excluded.map(v=>"- "+v),
 ].join("\n")+"\n";
 await writeFile(resolve(dir,"rubi-live-smoke.md"),md);
 if(process.env.GITHUB_STEP_SUMMARY)await writeFile(process.env.GITHUB_STEP_SUMMARY,md,{flag:"a"});
 process.stdout.write(md);
 if(!report.public_success)process.exitCode=1;
}
if(process.argv[1]&&import.meta.url===new URL(`file://${resolve(process.argv[1])}`).href){
 main().catch(error=>{console.error("Smoke bloqueado:",error.message);process.exitCode=1;});
}
