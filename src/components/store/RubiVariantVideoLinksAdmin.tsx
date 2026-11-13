import {useState} from "react";
import {useMutation,useQuery,useQueryClient} from "@tanstack/react-query";
import {useServerFn} from "@tanstack/react-start";
import {toast} from "sonner";
import {Button} from "@/components/ui/button";
import {listRubiVariantVideoLinksAdmin,saveRubiVariantVideoLinkAdmin,deleteRubiVariantVideoLinkAdmin} from "@/lib/rubi-variant-video-links.functions";

export function RubiVariantVideoLinksAdmin({variantId}:{variantId:string}){
 const [videoId,setVideoId]=useState("");
 const list=useServerFn(listRubiVariantVideoLinksAdmin);
 const save=useServerFn(saveRubiVariantVideoLinkAdmin);
 const remove=useServerFn(deleteRubiVariantVideoLinkAdmin);
 const cache=useQueryClient();
 const key=["rubi-variant-video-links",variantId];
 const query=useQuery({queryKey:key,queryFn:()=>list({data:{variantId}}),retry:false});
 const mutation=useMutation({
  mutationFn:()=>save({data:{variantId,videoId}}),
  onSuccess:()=>{toast.success("Vídeo associado à variante.");setVideoId("");void cache.invalidateQueries({queryKey:key});},
  onError:(error:Error)=>toast.error(error.message)
 });
 const deletion=useMutation({
  mutationFn:(id:string)=>remove({data:{variantId,videoId:id}}),
  onSuccess:()=>{toast.success("Vínculo removido.");void cache.invalidateQueries({queryKey:key});},
  onError:(error:Error)=>toast.error(error.message)
 });
 return <section className="space-y-3 rounded-xl border p-3" aria-label="Vídeos associados à variante">
  <h5 className="text-sm font-bold">Vídeos associados ao criativo</h5>
  <p className="text-xs text-muted-foreground">Informe o identificador UUID de um vídeo publicado no catálogo. O vínculo exige variante revisada, não altera os vídeos e não atribui vendas, retenção ou direito de uso automaticamente.</p>
  <label className="block space-y-1 text-xs font-semibold">ID do vídeo publicado
   <input className="block w-full rounded-lg border bg-background p-2 text-sm" placeholder="UUID do vídeo" value={videoId} onChange={e=>setVideoId(e.target.value.trim())}/>
  </label>
  <Button type="button" variant="outline" disabled={mutation.isPending||!/^[0-9a-f-]{36}$/i.test(videoId)}
   onClick={()=>mutation.mutate()}>Associar vídeo à variante</Button>
  {query.isLoading&&<p role="status" className="text-xs">Consultando vídeos associados...</p>}
  {query.isError&&<p role="alert" className="text-xs text-destructive">Falha ao consultar os vínculos. Confira a migração e o acesso Master.</p>}
  {query.data?.partial&&<p role="alert" className="text-xs">Histórico parcial: mais de 50 vínculos registrados.</p>}
  {query.data?.rows?.map((row:{video_id:string;title:string;status:string})=><div key={row.video_id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border p-2">
   <div className="min-w-0"><p className="text-sm font-semibold">{row.title}</p>
    <p className="break-all text-xs text-muted-foreground">{row.video_id} · {row.status}</p></div>
   <Button type="button" variant="outline" disabled={deletion.isPending}
    onClick={()=>deletion.mutate(row.video_id)}>Desvincular</Button>
  </div>)}
 </section>;
}
