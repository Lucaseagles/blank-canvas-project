import {useEffect,useState} from "react";
import {useQuery} from "@tanstack/react-query";
import {useServerFn} from "@tanstack/react-start";
import {supabase} from "@/integrations/supabase/client";
import {Button} from "@/components/ui/button";
import {getMyRubiCampaignOpportunities} from "@/lib/rubi-partner-campaign-opportunities.functions";

type Opportunity={id:string;teamName:string;teamNiche:string;campaignCode:string;movementName:string;productId:string;productTitle:string;productImage:string|null;productCategory:string|null;retailPrice:number;variantName:string;channel:string;hook:string;script:string;headline:string;body:string;cta:string;licenseValidUntil:string};
const money=(value:number)=>Number(value).toLocaleString("pt-BR",{style:"currency",currency:"BRL"});
/** Shows only currently assigned, approved and licensed opportunities; it never publishes. */
export function RubiPartnerCampaignOpportunities(){
 const [userId,setUserId]=useState<string|null>(null);
 const [copied,setCopied]=useState("");
 const load=useServerFn(getMyRubiCampaignOpportunities);
 useEffect(()=>{
  let active=true;
  const {data:{subscription}}=supabase.auth.onAuthStateChange((_event,session)=>{
   if(active){setUserId(session?.user.id??null);setCopied("");}
  });
  void supabase.auth.getSession().then(({data:{session}})=>{if(active)setUserId(session?.user.id??null);})
   .catch(()=>{if(active)setUserId(null);});
  return ()=>{active=false;subscription.unsubscribe();};
 },[]);
 const query=useQuery({queryKey:["rubi-partner-campaign-opportunities",userId],enabled:!!userId,
  queryFn:async()=>{
   const {data:{session}}=await supabase.auth.getSession();
   if(!session?.access_token||session.user.id!==userId)throw new Error("Sessão alterada. Entre novamente.");
   return load({data:{accessToken:session.access_token}});
  },retry:false,staleTime:30_000,refetchOnWindowFocus:true});
 const items=(query.data?.items??[]) as Opportunity[];
 const copy=async(item:Opportunity)=>{
  const {data:{session}}=await supabase.auth.getSession();
  if(!userId||session?.user.id!==userId||!session.access_token)throw new Error("Sessão alterada.");
  const fresh=await load({data:{accessToken:session.access_token}});
  if(fresh.partial)throw new Error("Consulta incompleta. Material indisponível.");
  const current=(fresh.items as Opportunity[]).find(x=>x.id===item.id);
  if(!current)throw new Error("Campanha, autorização ou licença não está mais vigente.");
  await navigator.clipboard.writeText([
   "Publicidade · parceiro RUBI", "Produto: "+current.productTitle,
   "Campanha: "+current.campaignCode, "Equipe: "+current.teamName,
   "Canal autorizado: "+current.channel, "Gancho: "+current.hook,
   "Roteiro: "+current.script, "Título: "+current.headline,
   current.body, "CTA: "+current.cta,
   "Licença válida até: "+new Date(current.licenseValidUntil).toLocaleDateString("pt-BR"),
   "Confira o link individual do produto no portal antes de publicar."
  ].join("\n\n"));
  setCopied(current.id);
 };
 return <section aria-label="Oportunidades de campanhas RUBI" className="space-y-4 rounded-3xl border border-primary/25 bg-gradient-to-br from-primary/10 to-card p-5 sm:p-7">
  <div className="space-y-2">
   <p className="text-xs font-black uppercase tracking-widest text-primary">RUBI Partners · Oportunidades</p>
   <h2 className="text-2xl font-black">Campanhas selecionadas para seu time</h2>
   <p className="text-sm text-muted-foreground">Veja campanhas aprovadas pelo Master, produtos liberados para sua conta e materiais com licença vigente para cada canal. Copiar um material não publica conteúdo nem confirma vendas.</p>
  </div>
  {!userId&&<p role="status" className="text-sm">Entre na sua conta para consultar oportunidades.</p>}
  {query.isLoading&&<p role="status" className="text-sm">Verificando campanhas, equipe, produtos e licenças...</p>}
  {query.isError&&<div role="alert" className="space-y-2 text-sm"><p>Não foi possível validar suas oportunidades. Os materiais permanecem ocultos.</p><Button variant="outline" size="sm" onClick={()=>void query.refetch()}>Tentar novamente</Button></div>}
  {query.data?.partial&&<p role="alert" className="text-sm">A consulta atingiu o limite seguro. Atualize mais tarde; nenhuma lista parcial foi liberada.</p>}
  {query.data&&!query.data.partial&&items.length===0&&<p className="rounded-xl border bg-background/70 p-4 text-sm text-muted-foreground">Nenhuma campanha disponível para seu time neste momento. Novas oportunidades aparecerão quando o Master aprovar a campanha, a equipe, o produto e os materiais.</p>}
  <div className="grid gap-4 lg:grid-cols-2">
   {items.map(item=><article key={item.id} className="overflow-hidden rounded-2xl border bg-background">
    {item.productImage&&<img src={item.productImage} alt={item.productTitle} loading="lazy" className="aspect-video w-full object-cover"/>}
    <div className="space-y-3 p-4">
     <div className="flex flex-wrap gap-2 text-[11px]"><span className="rounded-full bg-primary/10 px-2 py-1 font-semibold text-primary">{item.channel}</span><span className="rounded-full bg-muted px-2 py-1">{item.teamName}</span></div>
     <div><h3 className="font-bold">{item.productTitle}</h3><p className="text-xs text-muted-foreground">{item.productCategory??"RUBI"} · {money(item.retailPrice)}</p></div>
     <p className="text-sm font-semibold">{item.movementName} · {item.variantName}</p>
     <p className="text-sm">{item.hook}</p>
     <p className="text-xs text-muted-foreground">Licença válida até {new Date(item.licenseValidUntil).toLocaleDateString("pt-BR")}. Link individual disponível na seção de produtos autorizados.</p>
     <Button size="sm" variant="outline" onClick={()=>{void copy(item).catch(()=>setCopied("error"));}}>Copiar material autorizado</Button>
     {copied===item.id&&<p role="status" className="text-xs">Material atualizado e copiado. Revise as regras do canal antes de publicar.</p>}
     {copied==="error"&&<p role="alert" className="text-xs">Não foi possível copiar: a autorização ou licença pode ter mudado.</p>}
    </div>
   </article>)}
  </div>
 </section>;
}
