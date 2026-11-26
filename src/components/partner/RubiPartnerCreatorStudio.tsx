import {useState} from "react";
import {useMutation,useQuery,useQueryClient} from "@tanstack/react-query";
import {useServerFn} from "@tanstack/react-start";
import {Link2,Video,Clock3,CheckCircle2,AlertCircle} from "lucide-react";
import {toast} from "sonner";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Textarea} from "@/components/ui/textarea";
import {supabase} from "@/integrations/supabase/client";
import {
 createPartnerCreatorUploadUrl,discardPartnerCreatorUpload,
 submitPartnerCreatorContent,getMyPartnerCreatorSubmissions
} from "@/lib/rubi-partner-creator-studio.functions";

type Source="native_upload"|"social_link";
type Platform="youtube"|"tiktok"|"instagram"|"shopee"|"kwai"|"shein"|"mercado_livre";
const platforms:{id:Platform;label:string}[]=[
 {id:"tiktok",label:"TikTok"},{id:"instagram",label:"Instagram / Reels"},
 {id:"youtube",label:"YouTube / Shorts"},{id:"shopee",label:"Shopee Video"},
 {id:"kwai",label:"Kwai"},{id:"shein",label:"SHEIN"},{id:"mercado_livre",label:"Mercado Livre"}
];
const statusLabel:Record<string,string>={pending:"Em análise",approved:"Aprovado · rascunho",rejected:"Não aprovado"};
const statusClass:Record<string,string>={pending:"border-amber-500/40 bg-amber-500/10 text-amber-700",approved:"border-emerald-500/40 bg-emerald-500/10 text-emerald-700",rejected:"border-destructive/40 bg-destructive/10 text-destructive"};

export function RubiPartnerCreatorStudio(){
 const [source,setSource]=useState<Source>("native_upload");
 const [title,setTitle]=useState("");
 const [caption,setCaption]=useState("");
 const [externalUrl,setExternalUrl]=useState("");
 const [platform,setPlatform]=useState<Platform>("tiktok");
 const [file,setFile]=useState<File|null>(null);
 const [busy,setBusy]=useState(false);
 const queryClient=useQueryClient();
 const createUpload=useServerFn(createPartnerCreatorUploadUrl);
 const discardUpload=useServerFn(discardPartnerCreatorUpload);
 const submit=useServerFn(submitPartnerCreatorContent);
 const load=useServerFn(getMyPartnerCreatorSubmissions);
 const submissions=useQuery({
  queryKey:["my-partner-creator-submissions"],
  queryFn:async()=>{
   const {data:{session}}=await supabase.auth.getSession();
   if(!session?.access_token)throw new Error("Entre novamente para consultar seus envios.");
   return load({data:{accessToken:session.access_token}});
  },retry:false
 });
 const reset=()=>{setTitle("");setCaption("");setExternalUrl("");setFile(null);};
 const send=async(event:React.FormEvent<HTMLFormElement>)=>{
  event.preventDefault();
  if(busy)return;
  setBusy(true);
  let uploadedPath:string|null=null;
  try{
   const {data:{session}}=await supabase.auth.getSession();
   if(!session?.access_token)throw new Error("Sua sessão expirou. Entre novamente.");
   if(source==="native_upload"){
    if(!file)throw new Error("Selecione um vídeo MP4 ou WebM.");
    if(!["video/mp4","video/webm"].includes(file.type)||file.size<=0||file.size>50*1024*1024)
     throw new Error("Envie um vídeo MP4 ou WebM com até 50 MB.");
    const signed=await createUpload({data:{accessToken:session.access_token,fileName:file.name,contentType:file.type as "video/mp4"|"video/webm",size:file.size}});
    const {error:uploadError}=await supabase.storage.from("videos").uploadToSignedUrl(signed.path,signed.token,file,{contentType:file.type,upsert:false});
    if(uploadError)throw uploadError;
    uploadedPath=signed.path;
    await submit({data:{accessToken:session.access_token,title,caption,contentSource:"native_upload",storagePath:uploadedPath,sourcePlatform:"native"}});
   }else{
    await submit({data:{accessToken:session.access_token,title,caption,contentSource:"social_link",externalUrl,sourcePlatform:platform}});
   }
   toast.success("Conteúdo enviado para revisão do Shadow Master.");
   reset();
   await queryClient.invalidateQueries({queryKey:["my-partner-creator-submissions"]});
  }catch(error){
   if(uploadedPath){
    try{
     const {data:{session}}=await supabase.auth.getSession();
     if(session?.access_token)await discardUpload({data:{accessToken:session.access_token,path:uploadedPath}});
    }catch(cleanupError){console.error("Creator upload cleanup pending",cleanupError);}
   }
   toast.error(error instanceof Error?error.message:"Não foi possível enviar o conteúdo.");
  }finally{setBusy(false);}
 };
 return <section aria-label="Estúdio de criador RUBI" className="space-y-5 rounded-3xl border border-primary/25 bg-card p-5 sm:p-7">
  <div className="space-y-2">
   <p className="text-xs font-black uppercase tracking-widest text-primary">RUBI Creator Studio</p>
   <h2 className="text-2xl font-black">Seu conteúdo, sua audiência, sua vitrine</h2>
   <p className="max-w-3xl text-sm leading-6 text-muted-foreground">Envie vídeos originais ou compartilhe o link de um vídeo publicado nas redes compatíveis. O conteúdo passa por revisão antes de entrar no feed RUBI; enviar não significa publicação automática nem garante comissão.</p>
  </div>
  <div className="grid gap-3 sm:grid-cols-2">
   <button type="button" onClick={()=>setSource("native_upload")} aria-pressed={source==="native_upload"} className={`flex items-center gap-3 rounded-2xl border p-4 text-left transition ${source==="native_upload"?"border-primary bg-primary/5":"bg-background hover:bg-muted/40"}`}>
    <Video className="h-5 w-5 text-primary"/><span><strong className="block text-sm">Enviar vídeo</strong><small className="text-muted-foreground">MP4 ou WebM · até 50 MB</small></span>
   </button>
   <button type="button" onClick={()=>setSource("social_link")} aria-pressed={source==="social_link"} className={`flex items-center gap-3 rounded-2xl border p-4 text-left transition ${source==="social_link"?"border-primary bg-primary/5":"bg-background hover:bg-muted/40"}`}>
    <Link2 className="h-5 w-5 text-primary"/><span><strong className="block text-sm">Compartilhar link social</strong><small className="text-muted-foreground">TikTok, Instagram, YouTube e parceiros</small></span>
   </button>
  </div>
  <form onSubmit={send} className="space-y-4 rounded-2xl border bg-background p-4">
   <label className="block space-y-1.5 text-sm font-semibold">Título do conteúdo
    <Input value={title} onChange={e=>setTitle(e.target.value)} required minLength={1} maxLength={120} placeholder="Ex.: Como esse produto funciona na prática"/>
   </label>
   <label className="block space-y-1.5 text-sm font-semibold">Legenda
    <Textarea value={caption} onChange={e=>setCaption(e.target.value)} maxLength={1200} rows={3} placeholder="Conte o contexto, identifique publicidade/parceria quando aplicável e evite alegações não comprovadas."/>
   </label>
   {source==="native_upload"?<label className="block space-y-1.5 text-sm font-semibold">Arquivo de vídeo
    <Input type="file" accept="video/mp4,video/webm" onChange={e=>setFile(e.target.files?.[0]??null)} required/>
    <span className="block text-xs font-normal text-muted-foreground">{file?file.name+" · "+(file.size/1024/1024).toFixed(1)+" MB":"Formato MP4/WebM, tamanho máximo de 50 MB."}</span>
   </label>:<div className="grid gap-3 sm:grid-cols-2">
    <label className="block space-y-1.5 text-sm font-semibold">Rede social
     <select value={platform} onChange={e=>setPlatform(e.target.value as Platform)} className="h-10 w-full rounded-md border bg-background px-3 text-sm">
      {platforms.map(p=><option key={p.id} value={p.id}>{p.label}</option>)}
     </select>
    </label>
    <label className="block space-y-1.5 text-sm font-semibold">Link público do vídeo
     <Input type="url" value={externalUrl} onChange={e=>setExternalUrl(e.target.value)} placeholder="https://..." required/>
    </label>
   </div>}
   <div className="flex items-start gap-2 rounded-xl bg-muted/50 p-3 text-xs leading-5 text-muted-foreground"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0"/> Só envie conteúdo próprio ou com autorização de uso. Links externos abrem/ incorporam conforme os recursos oficiais da plataforma; não copiamos vídeos de terceiros nem contornamos restrições. A equipe revisará direitos, segurança e adequação antes da publicação.</div>
   <Button type="submit" disabled={busy||!title.trim()||(source==="native_upload"&&!file)||(source==="social_link"&&!externalUrl.trim())}>{busy?"Enviando...":"Enviar para revisão"}</Button>
  </form>
  <div className="space-y-3">
   <div className="flex items-center justify-between gap-3"><h3 className="font-black">Meus envios</h3><span className="text-xs text-muted-foreground">Até 50 registros recentes</span></div>
   {submissions.isLoading&&<p role="status" className="text-sm text-muted-foreground">Carregando seus conteúdos...</p>}
   {submissions.isError&&<div role="alert" className="rounded-xl border p-3 text-sm">Não foi possível carregar seus envios. <Button size="sm" variant="outline" onClick={()=>void submissions.refetch()}>Tentar novamente</Button></div>}
   {submissions.data?.length===0&&<p className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">Você ainda não enviou conteúdo para o feed RUBI.</p>}
   {submissions.data?.map((item:any)=><article key={item.id} className="flex flex-wrap items-start justify-between gap-3 rounded-xl border p-4">
    <div className="min-w-0 flex-1"><p className="font-bold">{item.title}</p><p className="mt-1 text-xs text-muted-foreground">{item.content_source==="native_upload"?"Vídeo enviado":item.source_platform+" · link externo"} · {new Date(item.submitted_at).toLocaleString("pt-BR")}</p>{item.review_notes&&<p className="mt-2 text-xs text-muted-foreground">Observação: {item.review_notes}</p>}</div>
    <span className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-bold ${statusClass[item.status]??""}`}>{item.status==="pending"?<Clock3 className="h-3 w-3"/>:item.status==="approved"?<CheckCircle2 className="h-3 w-3"/>:null}{statusLabel[item.status]??item.status}</span>
   </article>)}
  </div>
 </section>;
}
