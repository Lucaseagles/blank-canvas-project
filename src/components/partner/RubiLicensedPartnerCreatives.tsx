import {useState} from "react";
import {useQuery} from "@tanstack/react-query";
import {useServerFn} from "@tanstack/react-start";
import {supabase} from "@/integrations/supabase/client";
import {Button} from "@/components/ui/button";
import {getMyLicensedRubiCreativeAssets} from "@/lib/rubi-licensed-partner-assets.functions";
type Channel="instagram"|"tiktok"|"youtube"|"whatsapp"|"telegram"|"site";
type Asset={id:string;productTitle:string;name:string;hook:string;script:string;headline:string;body:string;cta:string;channel:Channel;validUntil:string};
const channels:Channel[]=["instagram","tiktok","youtube","whatsapp","telegram","site"];

export function RubiLicensedPartnerCreatives(){
 const [channel,setChannel]=useState<Channel>("instagram");
 const [copied,setCopied]=useState("");
 const load=useServerFn(getMyLicensedRubiCreativeAssets);
 const query=useQuery({queryKey:["rubi-partner-licensed-creatives",channel],queryFn:async()=>{
  const {data:{session}}=await supabase.auth.getSession();
  if(!session?.access_token)throw new Error("Entre na conta.");
  return load({data:{accessToken:session.access_token,channel}});
 },retry:false,staleTime:0});
 const items=(query.data?.items??[]) as Asset[];
 const copy=async(asset:Asset)=>{
  // No license documents or media references are copied.
  const text=["Publicidade · parceiro RUBI","Produto: "+asset.productTitle,"Gancho: "+asset.hook,
   "Roteiro: "+asset.script,"Página: "+asset.headline,asset.body,"CTA: "+asset.cta,
   "Canal autorizado: "+asset.channel,"Validade: "+new Date(asset.validUntil).toLocaleDateString("pt-BR"),
   "Uso permitido somente no escopo da licença e do seu produto autorizado."].join("\n\n");
  await navigator.clipboard.writeText(text);
  setCopied(asset.id);
 };
 return <section className="space-y-4 rounded-2xl border border-primary/20 bg-card p-5" aria-label="Criativos licenciados para parceiros">
  <h2 className="text-xl font-bold">Criativos licenciados para seu canal</h2>
  <p className="text-sm text-muted-foreground">Exibe somente textos com licença aprovada e vigente, revisão atual e produto liberado individualmente para seu perfil. Não inclui arquivos de prova nem concede direitos sobre outras mídias.</p>
  <label className="block text-sm">Canal de publicação
   <select className="mt-1 block w-full rounded-xl border bg-background p-3" value={channel} onChange={e=>{setChannel(e.target.value as Channel);setCopied("");}}>
    {channels.map(c=><option key={c} value={c}>{c}</option>)}
   </select>
  </label>
  {query.isLoading&&<p role="status" className="text-sm">Verificando licenças e autorizações...</p>}
  {query.isError&&<p role="alert" className="text-sm text-destructive">Não foi possível confirmar licenças. A biblioteca permanece indisponível.</p>}
  {query.data?.partial&&<p role="alert" className="text-sm">Consulta excedeu o limite seguro. Materiais ocultados para evitar liberação incompleta.</p>}
  {query.data&&!query.data.partial&&items.length===0&&<p className="text-sm text-muted-foreground">Nenhum criativo autorizado para este canal e perfil no momento.</p>}
  {items.map(asset=><article key={asset.id} className="space-y-2 rounded-xl border bg-background p-4">
   <h3 className="font-semibold">{asset.productTitle} · {asset.name}</h3>
   <p className="text-sm">{asset.hook}</p>
   <p className="text-xs text-muted-foreground">Autorizado até {new Date(asset.validUntil).toLocaleDateString("pt-BR")} no canal {asset.channel}.</p>
   <Button variant="outline" size="sm" onClick={()=>{void copy(asset).catch(()=>setCopied("error"));}}>Copiar texto com identificação publicitária</Button>
   {copied===asset.id&&<p role="status" className="text-xs">Texto copiado. Reconfirme a licença antes de publicar.</p>}
   {copied==="error"&&<p role="alert" className="text-xs">Falha ao copiar.</p>}
  </article>)}
 </section>;
}
