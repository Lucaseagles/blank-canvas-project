import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Clock3 } from "lucide-react";
import { getRubiProductEditorialDeadline } from "@/lib/rubi-editorial-deadline.functions";

function readableCountdown(ms:number):string{
 const seconds=Math.max(0,Math.floor(ms/1000));
 const days=Math.floor(seconds/86400),hours=Math.floor((seconds%86400)/3600),
  minutes=Math.floor((seconds%3600)/60),remainder=seconds%60;
 return days>0?days+"d "+hours+"h "+minutes+"min":
  [hours,minutes,remainder].map(value=>String(value).padStart(2,"0")).join(":");
}
/** Never invent a countdown: hide when the actual editorial campaign deadline expires. */
export function RubiEditorialDeadline({productId}:{productId:string}){
 const fetchDeadline=useServerFn(getRubiProductEditorialDeadline);
 const query=useQuery({queryKey:["rubi-editorial-deadline",productId],
  queryFn:()=>fetchDeadline({data:{productId}}),retry:false,staleTime:30000,refetchInterval:60000});
 const [now,setNow]=useState(()=>Date.now());
 const endsAt=query.data?.endsAt;
 useEffect(()=>{
  if(!endsAt)return;
  const timer=window.setInterval(()=>setNow(Date.now()),1000);
  return()=>window.clearInterval(timer);
 },[endsAt]);
 if(!endsAt)return null;
 const left=Date.parse(endsAt)-now;
 if(!Number.isFinite(left)||left<=0)return null;
 return <aside aria-label="Prazo do destaque editorial" className="rounded-2xl border border-amber-400/30 bg-amber-400/[0.06] p-4 sm:p-5">
  <div className="flex items-center gap-3">
   <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-amber-400/10 text-amber-500"><Clock3 className="h-5 w-5"/></div>
   <div className="min-w-0">
    <p className="text-xs font-black uppercase tracking-widest text-amber-500">Destaque desta campanha</p>
    <p className="font-black tabular-nums text-xl" aria-live="off">{readableCountdown(left)}</p>
   </div>
  </div>
  <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
   Tempo restante da exibição editorial programada na RUBI. Não significa que o preço, o estoque ou o checkout vencerão nesse horário.
  </p>
 </aside>;
}
