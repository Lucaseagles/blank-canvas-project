import {useEffect,useState} from "react";
import {useQuery} from "@tanstack/react-query";
import {useServerFn} from "@tanstack/react-start";
import {Link} from "@tanstack/react-router";
import {supabase} from "@/integrations/supabase/client";
import {getMyRubiAffiliateInvitation} from "@/lib/rubi-affiliate-invitation.functions";

/** Small opt-in profile invitation. Never traps navigation or displays under 60% readiness. */
export function RubiAffiliateMiniInvite({userId}:{userId:string}){
 const load=useServerFn(getMyRubiAffiliateInvitation);
 const [dismissed,setDismissed]=useState(true);
 const [collapsed,setCollapsed]=useState(true);
 const key="rubi-affiliate-invite-dismissed-"+userId;
 useEffect(()=>{
  try{const raw=window.localStorage.getItem(key);
   setDismissed(raw==="never"||(raw!==null&&Number(raw)>Date.now()));
  }catch{setDismissed(true);}
 },[key]);
 const query=useQuery({
  queryKey:["affiliate-invite-readiness",userId],
  queryFn:async()=>{
   const {data:{session}}=await supabase.auth.getSession();
   if(!session||session.user.id!==userId)throw new Error("Sessão inválida");
   return load({data:{accessToken:session.access_token}});
  },enabled:!!userId,staleTime:300000,retry:false
 });
 if(!query.data?.eligible||dismissed)return null;
 const dismiss=(forever:boolean)=>{
  try{window.localStorage.setItem(key,forever?"never":String(Date.now()+30*86400000));}
  catch{/* private mode: hide for current session */}
  setDismissed(true);
 };
 return <aside aria-label="Convite opcional para afiliados"
   className="fixed bottom-20 right-3 z-30 w-[min(250px,calc(100vw-24px))] rounded-2xl border border-primary/30 bg-card/95 p-3 shadow-xl backdrop-blur-lg">
  <div className="flex items-center justify-between gap-2">
   <strong className="text-[11px]">RUBI Indica · {query.data.score}%</strong>
   <button type="button" aria-label="Dispensar convite por 30 dias" className="text-xs text-muted-foreground"
    onClick={()=>dismiss(false)}>✕</button>
  </div>
  <p className="mt-1 text-xs font-semibold">Gostaria de divulgar ofertas da RUBI?</p>
  {!collapsed&&<p className="mt-1 text-[11px] leading-4 text-muted-foreground">
   Conheça o programa e candidate-se para ganhar comissão por vendas confirmadas.
   Não precisa comprar nem ter muitos seguidores.
  </p>}
  <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px]">
   <Link to="/onboarding" search={{audience:"partner",returnTo:"/partner/portal",partnerType:"affiliate"}}
    className="rounded-lg bg-primary px-2 py-1.5 font-semibold text-primary-foreground">Conhecer</Link>
   <button type="button" onClick={()=>setCollapsed(v=>!v)} className="text-primary underline">
    {collapsed?"Detalhes":"Recolher"}
   </button>
   {!collapsed&&<button type="button" onClick={()=>dismiss(true)}
    className="text-muted-foreground underline">Não mostrar</button>}
  </div>
 </aside>;
}
