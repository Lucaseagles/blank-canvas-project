import {useEffect,useState} from "react";
import {useQuery} from "@tanstack/react-query";
import {useServerFn} from "@tanstack/react-start";
import {Link} from "@tanstack/react-router";
import {Sparkles} from "lucide-react";
import {trackEvent} from "@/lib/analytics";
import {supabase} from "@/integrations/supabase/client";
import {getMyRubiAffiliateInvitation} from "@/lib/rubi-affiliate-invitation.functions";

/** Reuses the consumer's existing opt-in invitation across discovery surfaces. */
export function RubiAffiliateMiniInvite({userId,placement="right"}:{userId:string;placement?:"left"|"right"}){
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
  },enabled:!!userId,staleTime:60_000,retry:false,refetchOnWindowFocus:true
 });
 const sessionKey="rubi-affiliate-invite-shown-"+userId;
 useEffect(()=>{
  if(!query.data?.eligible||dismissed)return;
  try{
   if(window.sessionStorage.getItem(sessionKey)==="1")return;
   window.sessionStorage.setItem(sessionKey,"1");
   void trackEvent("RUBI_AFFILIATE_INVITE_SHOWN",{program:"rubi_indica",readiness_score:query.data.score??0});
  }catch{/* Keep invitation available if browser storage is restricted. */}
 },[sessionKey,query.data?.eligible,query.data?.score,dismissed]);
 if(!query.data?.eligible||dismissed)return null;
 const dismiss=(forever:boolean)=>{
  try{window.localStorage.setItem(key,forever?"never":String(Date.now()+30*86400000));}
  catch{/* private mode: hide for current session */}
  void trackEvent(forever?"RUBI_AFFILIATE_INVITE_OPTED_OUT":"RUBI_AFFILIATE_INVITE_PAUSED",{program:"rubi_indica",readiness_score:query.data?.score??0});
  setDismissed(true);
 };
 return <aside aria-label="Convite opcional para afiliados"
  className={`fixed bottom-[calc(1.25rem+env(safe-area-inset-bottom))] ${placement==="left"?"left-3":"right-3"} z-[60]`}>
  {collapsed?<button type="button" aria-label="Conheça o RUBI Indica" title="Conheça o RUBI Indica"
    onClick={()=>{void trackEvent("RUBI_AFFILIATE_INVITE_OPENED",{program:"rubi_indica",readiness_score:query.data?.score??0});setCollapsed(false);}}
    className="flex h-12 w-12 items-center justify-center rounded-full border border-primary/40 bg-card/95 text-primary shadow-xl shadow-black/20 backdrop-blur-lg transition hover:scale-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary">
    <Sparkles className="h-5 w-5"/>
    <span className="sr-only">Convite para conhecer o programa de afiliados RUBI</span>
   </button>:<div className="w-[min(260px,calc(100vw-24px))] rounded-2xl border border-primary/30 bg-card/95 p-3 text-card-foreground shadow-2xl backdrop-blur-xl">
    <div className="flex items-center justify-between gap-2">
     <strong className="text-[11px]">RUBI Indica</strong>
     <button type="button" aria-label="Recolher convite" className="rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-muted"
      onClick={()=>setCollapsed(true)}>−</button>
    </div>
    <p className="mt-1 text-xs font-semibold">Seu conteúdo pode abrir novas oportunidades.</p>
    <p className="mt-1 text-[11px] leading-4 text-muted-foreground">
     Conheça o programa e candidate-se para receber comissão por vendas confirmadas. Não precisa comprar nem ter muitos seguidores.
    </p>
    <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px]">
     <Link onClick={()=>void trackEvent("RUBI_AFFILIATE_INVITE_CTA",{program:"rubi_indica",readiness_score:query.data?.score??0})} to="/onboarding" search={{audience:"partner",returnTo:"/partner/portal",partnerType:"affiliate"}}
      className="rounded-lg bg-primary px-3 py-2 font-semibold text-primary-foreground">Conhecer programa</Link>
     <button type="button" onClick={()=>dismiss(false)} className="text-muted-foreground underline">Pausar 30 dias</button>
     <button type="button" onClick={()=>dismiss(true)} className="text-muted-foreground underline">Não mostrar</button>
    </div>
   </div>}
 </aside>;
}
