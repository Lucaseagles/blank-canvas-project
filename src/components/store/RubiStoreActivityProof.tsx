import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Eye, MousePointerClick, ShieldCheck } from "lucide-react";
import { getRubiStoreActivityProof } from "@/lib/rubi-store-activity-proof.functions";

/** Verified event counters. Not unique customers, paid orders or invented testimonials. */
export function RubiStoreActivityProof({productId,compact=false}:{productId:string;compact?:boolean}){
 const fetchProof=useServerFn(getRubiStoreActivityProof);
 const query=useQuery({queryKey:["rubi-store-activity-proof",productId],
  queryFn:()=>fetchProof({data:{productId}}),retry:false,staleTime:120000});
 const proof=query.data;
 if(!proof||(proof.viewEvents===0&&proof.checkoutIntentEvents===0))return null;
 return <aside aria-label="Atividade real da oferta" className={compact
  ?"rounded-xl border border-primary/20 bg-primary/[0.04] p-3"
  :"rounded-2xl border border-primary/20 bg-card/80 p-4 shadow-sm sm:p-5"}>
  <div className="mb-3 flex items-center gap-2 text-xs font-black uppercase tracking-wider text-primary">
   <ShieldCheck className="h-4 w-4"/> Atividade registrada na RUBI
  </div>
  <div className="flex flex-wrap gap-2">
   {proof.viewEvents>0&&<span className="inline-flex items-center gap-2 rounded-full border bg-background px-3 py-2 text-xs font-semibold">
    <Eye className="h-3.5 w-3.5 text-primary"/>{proof.viewEvents.toLocaleString("pt-BR")} visualizações da página
   </span>}
   {proof.checkoutIntentEvents>0&&<span className="inline-flex items-center gap-2 rounded-full border bg-background px-3 py-2 text-xs font-semibold">
    <MousePointerClick className="h-3.5 w-3.5 text-primary"/>{proof.checkoutIntentEvents.toLocaleString("pt-BR")} saídas registradas ao checkout
   </span>}
  </div>
  <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">
   Eventos observados nas últimas {proof.windowHours} horas. Não representam pessoas únicas, compras concluídas ou pagamentos confirmados.
  </p>
 </aside>;
}
