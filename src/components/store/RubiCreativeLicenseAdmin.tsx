import {useMemo,useState} from "react";
import {useMutation,useQuery,useQueryClient} from "@tanstack/react-query";
import {useServerFn} from "@tanstack/react-start";
import {supabase} from "@/integrations/supabase/client";
import {Button} from "@/components/ui/button";
import {toast} from "sonner";
import {createRubiCreativeLicenseDraftAdmin,inspectRubiCreativeLicenseEvidenceAdmin,listRubiCreativeLicensesAdmin,reviewRubiCreativeLicenseAdmin} from "@/lib/rubi-creative-licenses.functions";

type Creative={id:string;name:string;productTitle:string};
type License={id:string;variantId:string;status:string;revision:number;channels:string[];audiences:string[];
 validFrom:string;validUntil:string;reviewedAt:string|null;revokedAt:string|null};
const permittedChannels=["instagram","tiktok","youtube","whatsapp","telegram","site"] as const;
const permittedAudiences=["partner","consumer","merchant"] as const;
type Channel=(typeof permittedChannels)[number];
type Audience=(typeof permittedAudiences)[number];

export function RubiCreativeLicenseAdmin({assets}:{assets:Creative[]}){
 const client=useQueryClient();
 const list=useServerFn(listRubiCreativeLicensesAdmin);
 const create=useServerFn(createRubiCreativeLicenseDraftAdmin);
 const review=useServerFn(reviewRubiCreativeLicenseAdmin);
 const inspect=useServerFn(inspectRubiCreativeLicenseEvidenceAdmin);
 const [evidenceUrl,setEvidenceUrl]=useState("");
 const [inspectedVariant,setInspectedVariant]=useState("");
 const query=useQuery({queryKey:["rubi-creative-licenses-admin"],queryFn:()=>list(),retry:false});
 const licenses=(query.data?.items??[]) as License[];
 const [variantId,setVariantId]=useState("");
 const [file,setFile]=useState<File|null>(null);
 const [channels,setChannels]=useState<Channel[]>([]);
 const [audiences,setAudiences]=useState<Audience[]>([]);
 const [from,setFrom]=useState("");
 const [until,setUntil]=useState("");
 const activeLicense=useMemo(()=>licenses.find(v=>v.variantId===variantId),[licenses,variantId]);
 const toggle=<T extends string,>(current:T[],value:T,set:(v:T[])=>void)=>
  set(current.includes(value)?current.filter(v=>v!==value):[...current,value]);
 const evidence=useMutation({mutationFn:async()=>{
  if(!variantId)throw new Error("Selecione um criativo.");
  return inspect({data:{variantId}});
 },onSuccess:(signed)=>{setEvidenceUrl(signed.url);setInspectedVariant("");},
   onError:(e:Error)=>toast.error(e.message)});
 const upload=useMutation({mutationFn:async()=>{
  if(!file||!variantId)throw new Error("Selecione um criativo e o documento de licença.");
  if(file.size>10485760||file.size===0||!["application/pdf","image/png","image/jpeg"].includes(file.type))
   throw new Error("Envie PDF, PNG ou JPG com até 10 MB.");
  if(channels.length===0||audiences.length===0)throw new Error("Defina canais e públicos autorizados.");
  if(!from||!until)throw new Error("Informe início e fim da licença.");
  if(activeLicense?.status==="approved"||activeLicense?.status==="revoked")
   throw new Error("Uma licença finalizada não pode ser substituída.");
  const signed=await create({data:{variantId,mime:file.type as "application/pdf"|"image/png"|"image/jpeg",
   channels,audiences,validFrom:new Date(from+"T00:00:00").toISOString(),
   validUntil:new Date(until+"T23:59:59").toISOString()}});
  const {error}=await supabase.storage.from("rubi-creative-license-evidence")
   .uploadToSignedUrl(signed.path,signed.token,file,{contentType:file.type,upsert:false});
  if(error)throw error;
 },onSuccess:()=>{
  toast.success("Documento recebido em área privada. Revise a licença antes de aprovar.");
  setFile(null);setEvidenceUrl("");setInspectedVariant("");void client.invalidateQueries({queryKey:["rubi-creative-licenses-admin"]});
 },onError:(e:Error)=>toast.error(e.message)});
 const transition=useMutation({mutationFn:({item,action}:{item:License;action:"approve"|"revoke"})=>
  review({data:{variantId:item.variantId,revision:item.revision,action}}),
  onSuccess:()=>{toast.success("Decisão registrada na auditoria Master.");void client.invalidateQueries({queryKey:["rubi-creative-licenses-admin"]});},
  onError:(e:Error)=>toast.error(e.message)});
 return <section className="space-y-4 rounded-3xl border border-primary/20 bg-card p-5 sm:p-7" aria-label="Licenciamento documental de criativos">
  <header className="space-y-2">
   <h2 className="text-xl font-black">Licenças documentadas · Shadow Master</h2>
   <p className="text-xs text-muted-foreground">Documentos privados, canais e públicos permitidos, prazo e aprovação humana. Cadastrar documento não prova automaticamente sua validade ou libera distribuição.</p>
  </header>
  {query.isError&&<p role="alert" className="text-sm text-destructive">Não foi possível consultar as licenças. Confirme a migração do banco.</p>}
  {query.data?.partial&&<p role="alert">Mais de 200 licenças: snapshot oculto até existir paginação.</p>}
  <label className="block space-y-1 text-sm">Criativo
   <select className="w-full rounded-xl border bg-background p-3" value={variantId} onChange={e=>{setVariantId(e.target.value);setEvidenceUrl("");setInspectedVariant("");}}>
    <option value="">Selecione um criativo em revisão</option>
    {assets.map(a=><option key={a.id} value={a.id}>{a.productTitle} · {a.name}</option>)}
   </select>
  </label>
  {variantId&&<div className="space-y-3">
   {activeLicense&&<p className="text-sm">Licença: <strong>{activeLicense.status}</strong> · revisão {activeLicense.revision} · até {new Date(activeLicense.validUntil).toLocaleDateString("pt-BR")}</p>}
   {(!activeLicense||activeLicense.status==="draft")&&<>
    <label className="block text-sm">Documento contratual (PDF, PNG ou JPG, máx. 10 MB)
     <input aria-label="Documento de licença" type="file" accept=".pdf,.png,.jpg,.jpeg" className="mt-2 block w-full text-sm" onChange={e=>setFile(e.target.files?.[0]??null)}/>
    </label>
    <div className="grid gap-3 sm:grid-cols-2">
     <label className="text-sm">Válido a partir de
      <input className="mt-1 block w-full rounded-xl border bg-background p-3" type="date" value={from} onChange={e=>setFrom(e.target.value)}/>
     </label>
     <label className="text-sm">Válido até
      <input className="mt-1 block w-full rounded-xl border bg-background p-3" type="date" value={until} onChange={e=>setUntil(e.target.value)}/>
     </label>
    </div>
    <fieldset className="space-y-2"><legend className="text-sm font-semibold">Canais autorizados</legend>
     <div className="flex flex-wrap gap-3">{permittedChannels.map(c=><label key={c} className="flex items-center gap-2 text-sm">
      <input type="checkbox" checked={channels.includes(c)} onChange={()=>toggle(channels,c,setChannels)}/>{c}
     </label>)}</div>
    </fieldset>
    <fieldset className="space-y-2"><legend className="text-sm font-semibold">Públicos autorizados</legend>
     <div className="flex flex-wrap gap-3">{permittedAudiences.map(a=><label key={a} className="flex items-center gap-2 text-sm">
      <input type="checkbox" checked={audiences.includes(a)} onChange={()=>toggle(audiences,a,setAudiences)}/>{a}
     </label>)}</div>
    </fieldset>
    <Button type="button" disabled={upload.isPending} onClick={()=>upload.mutate()}>Enviar documento privado e registrar rascunho</Button>
   </>}
   {activeLicense&&<div className="space-y-2">
    <Button type="button" variant="outline" disabled={evidence.isPending} onClick={()=>evidence.mutate()}>
     Gerar acesso privado ao comprovante (60 segundos)
    </Button>
    {evidenceUrl&&<a href={evidenceUrl} target="_blank" rel="noopener noreferrer"
     onClick={()=>setInspectedVariant(variantId)} className="block text-sm font-semibold text-primary underline">Abrir documento de licença em nova aba</a>}
    <p className="text-xs text-muted-foreground">Acesse e confira autoria, titularidade, canais, território e prazo. O link expira; solicitar o link não comprova validade jurídica do documento.</p>
   </div>}
   {activeLicense?.status==="draft"&&<Button type="button" variant="outline" disabled={transition.isPending||upload.isPending}
    onClick={()=>{if(inspectedVariant!==variantId){toast.error("Abra o documento de licença antes de aprová-lo.");return;}if(window.confirm("Confirma que conferiu o documento, a titularidade, canais e prazo da licença?"))transition.mutate({item:activeLicense,action:"approve"});}}>
     Aprovar após conferência documental
    </Button>}
   {activeLicense?.status==="approved"&&<Button type="button" variant="destructive" disabled={transition.isPending}
    onClick={()=>{if(window.confirm("Revogar a licença para novos acessos? URLs já emitidas podem seguir válidas até expirar."))transition.mutate({item:activeLicense,action:"revoke"});}}>
     Revogar licença
    </Button>}
  </div>}
  <p className="text-xs text-muted-foreground">Aprovação não equivale a liberação de campanha. Antes de servir mídia a qualquer parceiro, verificar licença, revisão atual, perfil, grant do produto e prazo em cada requisição. URLs assinadas já emitidas não são revogadas imediatamente.</p>
 </section>;
}
