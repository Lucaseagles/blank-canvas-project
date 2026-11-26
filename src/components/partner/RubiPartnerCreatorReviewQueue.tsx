import {useState} from "react";
import {useMutation,useQuery,useQueryClient} from "@tanstack/react-query";
import {useServerFn} from "@tanstack/react-start";
import {CheckCircle2,Clock3,ShieldAlert} from "lucide-react";
import {toast} from "sonner";
import {Button} from "@/components/ui/button";
import {Textarea} from "@/components/ui/textarea";
import {VideoPlayback} from "@/components/video/VideoPlayback";
import {getAdminPartnerCreatorSubmissions,reviewPartnerCreatorSubmission} from "@/lib/rubi-partner-creator-studio.functions";

export function RubiPartnerCreatorReviewQueue(){
 const [notes,setNotes]=useState<Record<string,string>>({});
 const queryClient=useQueryClient();
 const load=useServerFn(getAdminPartnerCreatorSubmissions);
 const review=useServerFn(reviewPartnerCreatorSubmission);
 const queue=useQuery({queryKey:["admin-partner-creator-submissions","pending"],queryFn:()=>load({data:{status:"pending"}}),retry:false});
 const mutation=useMutation({
  mutationFn:({id,decision}:{id:string;decision:"approve"|"reject"})=>review({data:{submissionId:id,decision,reviewNotes:notes[id]??""}}),
  onSuccess:(_result,variables)=>{
   toast.success(variables.decision==="approve"?"Conteúdo aprovado como rascunho.":"Conteúdo recusado.");
   void queryClient.invalidateQueries({queryKey:["admin-partner-creator-submissions"]});
   void queryClient.invalidateQueries({queryKey:["admin-videos"]});
  },
  onError:(error:Error)=>toast.error(error.message)
 });
 return <section aria-label="Fila de revisão de conteúdo dos parceiros" className="space-y-5 rounded-3xl border border-primary/25 bg-card p-5 sm:p-7">
  <div className="flex flex-wrap items-center justify-between gap-3">
   <div className="space-y-1"><p className="text-xs font-black uppercase tracking-widest text-primary">Shadow Master · Moderação</p><h2 className="text-2xl font-black">Conteúdos enviados pelos afiliados</h2><p className="text-sm text-muted-foreground">Aprovar cria um rascunho no Video Commerce; publicação continua sob decisão do Owner.</p></div>
   <span className="rounded-full border bg-background px-3 py-1.5 text-xs font-bold">{queue.data?.length??0} pendentes</span>
  </div>
  {queue.isLoading&&<p role="status" className="text-sm text-muted-foreground">Carregando fila...</p>}
  {queue.isError&&<div role="alert" className="rounded-xl border p-4 text-sm">Não foi possível carregar a fila. <Button size="sm" variant="outline" onClick={()=>void queue.refetch()}>Tentar novamente</Button></div>}
  {queue.data?.length===0&&<p className="rounded-xl border border-dashed p-5 text-sm text-muted-foreground">Nenhum conteúdo aguardando revisão.</p>}
  {queue.data?.map((item:any)=><article key={item.id} className="grid gap-4 rounded-2xl border p-4 md:grid-cols-[minmax(150px,220px)_1fr]">
   <div className="overflow-hidden rounded-xl bg-black">
    {item.playback_url?<VideoPlayback src={item.playback_url} title={item.title} className="max-h-[320px]"/>:<div className="p-5 text-xs text-white/70">Prévia indisponível</div>}
   </div>
   <div className="min-w-0 space-y-3">
    <div className="flex flex-wrap items-center gap-2"><span className="rounded-full border border-amber-500/40 bg-amber-500/10 px-2 py-1 text-[11px] font-bold text-amber-700"><Clock3 className="mr-1 inline h-3 w-3"/>Pendente</span><span className="text-xs text-muted-foreground">{item.commercial_profiles?.display_name??"Parceiro"} · {item.commercial_profiles?.partner_type??"afiliado"}</span></div>
    <h3 className="text-lg font-black">{item.title}</h3>
    {item.caption&&<p className="whitespace-pre-wrap text-sm text-muted-foreground">{item.caption}</p>}
    <p className="text-xs text-muted-foreground">Origem: {item.content_source==="native_upload"?"Arquivo enviado ao armazenamento privado":item.source_platform}</p>
    {item.external_url&&<a href={item.external_url} target="_blank" rel="noopener noreferrer" className="break-all text-xs font-semibold text-primary underline">Abrir publicação original</a>}
    <label className="block space-y-1 text-xs font-semibold">Observação da revisão (opcional)
     <Textarea value={notes[item.id]??""} onChange={e=>setNotes(current=>({...current,[item.id]:e.target.value}))} maxLength={500} rows={2} placeholder="Explique ajustes necessários ou contexto da decisão."/>
    </label>
    <div className="flex flex-wrap gap-2">
     <Button disabled={mutation.isPending} onClick={()=>mutation.mutate({id:item.id,decision:"approve"})}><CheckCircle2 className="mr-2 h-4 w-4"/>Aprovar como rascunho</Button>
     <Button disabled={mutation.isPending} variant="destructive" onClick={()=>mutation.mutate({id:item.id,decision:"reject"})}><ShieldAlert className="mr-2 h-4 w-4"/>Recusar</Button>
    </div>
   </div>
  </article>)}
 </section>;
}
