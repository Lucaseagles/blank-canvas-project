import {useEffect,useState} from "react";
import {useQuery} from "@tanstack/react-query";
import {useServerFn} from "@tanstack/react-start";
import {supabase} from "@/integrations/supabase/client";
import {Button} from "@/components/ui/button";
import {getMyLicensedRubiCreativeAssets} from "@/lib/rubi-licensed-partner-assets.functions";
import {selectFreshRubiLicensedAsset} from "@/lib/rubi-creative-license-access";
type Channel="instagram"|"tiktok"|"youtube"|"whatsapp"|"telegram"|"site";
type Asset={id:string;productId:string;productTitle:string;name:string;hook:string;script:string;headline:string;body:string;cta:string;channel:Channel;validUntil:string};
const channels:Channel[]=["instagram","tiktok","youtube","whatsapp","telegram","site"];

export function RubiLicensedPartnerCreatives(){
 const [channel,setChannel]=useState<Channel>("instagram");
 const [copied,setCopied]=useState("");
 const [userId,setUserId]=useState<string|null>(null);
 useEffect(()=>{
  let active=true;
  const {data:{subscription}}=supabase.auth.onAuthStateChange((_event,session)=>{
   if(active){setUserId(session?.user.id??null);setCopied("");}
  });
  void supabase.auth.getSession().then(({data:{session}})=>{
   if(active)setUserId(session?.user.id??null);
  }).catch(()=>{if(active)setUserId(null);});
  return ()=>{active=false;subscription.unsubscribe();};
 },[]);
 const load=useServerFn(getMyLicensedRubiCreativeAssets);
 const query=useQuery({queryKey:["rubi-partner-licensed-creatives",userId,channel],enabled:!!userId,queryFn:async()=>{
  const {data:{session}}=await supabase.auth.getSession();
  if(!session?.access_token||session.user.id!==userId)throw new Error("Sessão alterada. Entre novamente.");
  return load({data:{accessToken:session.access_token,channel}});
 },retry:false,staleTime:0});
 const items=(userId?query.data?.items??[]:[]) as Asset[];
 const copy=async(asset:Asset)=>{
  // Re-authorize at the instant of copy; React Query data may predate revocation.
  const {data:{session}}=await supabase.auth.getSession();
  if(!userId||session?.user.id!==userId||!session.access_token)throw new Error("Sessão alterada.");
  const latest=await load({data:{accessToken:session.access_token,channel}});
  if(latest.partial)throw new Error("Consulta incompleta; material indisponível.");
  const fresh=selectFreshRubiLicensedAsset((latest.items??[]) as Asset[],asset.id,asset.productId,channel);
  if(!fresh)throw new Error("Licença revogada, expirada ou alterada.");
  // Never copy cached/obsolete creative text, private media paths, or license proof.
  const text=["Publicidade · parceiro RUBI","Produto: "+fresh.productTitle,"Gancho: "+fresh.hook,
   "Roteiro: "+fresh.script,"Página: "+fresh.headline,fresh.body,"CTA: "+fresh.cta,
   "Canal autorizado: "+fresh.channel,"Validade: "+new Date(fresh.validUntil).toLocaleDateString("pt-BR"),
   "Uso permitido somente no escopo da licença e do seu produto autorizado."].join("\n\n");
  await navigator.clipboard.writeText(text);
  setCopied(fresh.id);
 };
 return <section className="space-y-4 rounded-2xl border border-primary/20 bg-card p-5" aria-label="Criativos licenciados para parceiros">
  <h2 className="text-xl font-bold">Criativos licenciados para seu canal</h2>
  {!userId&&<p role="status" className="text-sm">Entre na sua conta para consultar os criativos autorizados.</p>}
  <p className="text-sm text-muted-foreground">Exibe somente textos com licença aprovada e vigente, revisão atual e produto liberado individualmente para seu perfil. Não inclui arquivos de prova nem concede direitos sobre outras mídias.</p>
  <label className="block text-sm">Canal de publicação
   <select className="mt-1 block w-full rounded-xl border bg-background p-3" value={channel} onChange={e=>{setChannel(e.target.value as Channel);setCopied("");}}>
    {channels.map(c=><option key={c} value={c}>{c}</option>)}
   </select>
  </label>
  {query.isLoading&&<p role="status" className="text-sm">Verificando licenças e autorizações...</p>}
  {query.isError&&<p role="alert" className="text-sm text-destructive">Não foi possível confirmar licenças. A biblioteca permanece indisponível.</p>}
  {userId&&query.data?.partial&&<p role="alert" className="text-sm">Consulta excedeu o limite seguro. Materiais ocultados para evitar liberação incompleta.</p>}
  {userId&&query.data&&!query.data.partial&&items.length===0&&<p className="text-sm text-muted-foreground">Nenhum criativo autorizado para este canal e perfil no momento.</p>}
  {items.map(asset=><article key={asset.id} className="space-y-2 rounded-xl border bg-background p-4">
   <h3 className="font-semibold">{asset.productTitle} · {asset.name}</h3>
   <p className="text-sm">{asset.hook}</p>
   <p className="text-xs text-muted-foreground">Autorizado até {new Date(asset.validUntil).toLocaleDateString("pt-BR")} no canal {asset.channel}.</p>
   <Button variant="outline" size="sm" onClick={()=>{void copy(asset).catch(()=>setCopied("error"));}}>Copiar texto com identificação publicitária</Button>
   {copied===asset.id&&<p role="status" className="text-xs">Texto copiado. Reconfirme a licença antes de publicar.</p>}
   {copied==="error"&&<p role="alert" className="text-xs">Não foi possível copiar: licença, autorização ou sessão indisponível.</p>}
  </article>)}
 </section>;
}
