import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { X, ArrowRight, Clock3, Sparkles, Target, Package, Zap, Crown, Gift, Trophy } from "lucide-react";
import { getStrategicPopup } from "@/lib/relationships.functions";
import { useServerFn } from "@tanstack/react-start";

type PopupContent = { strategy?: string; title?: string; description?: string; image_url?: string; image_alt?: string; secondary_label?: string; secondary_target?: string; snooze_minutes?: number; product_id?: string; bundle_id?: string; sum_price?: number; bundle_discount_price?: number; view_count?: number; current_price?: number; previous_price?: number; discount?: number; ends_at?: string; base_product_id?: string; base_title?: string; base_price?: number; upsell_product_id?: string; upsell_title?: string; upsell_price?: number; price_difference?: number; choice_rate?: number; choice_sample_size?: number; affinity_score?: number; points?: number; reason?: string; earned_at?: string; gift_description?: string; offer_group_id?: string };
type EligiblePopup = { rule_id: string; name?: string; content?: PopupContent; cta_label?: string; cta_target?: string; cooldown_minutes?: number };
const snoozeKey = (ruleId: string) => `popup-engine:snooze:${ruleId}`;

export function PopupEngine() {
  const [popup,setPopup]=useState<EligiblePopup|null>(null);
  const [affinity,setAffinity]=useState<number|null>(null);
  const [remaining,setRemaining]=useState<number|null>(null);
  const shown=useRef(false);
  const getStrategic = useServerFn(getStrategicPopup);

  useEffect(()=>{
    let cancelled=false;
    const load=async()=>{
      const {data:{user}}=await supabase.auth.getUser();
      if(!user||shown.current)return;
      let candidate: EligiblePopup|null=null;
      try { candidate=(await getStrategic()) as EligiblePopup|null; } catch { candidate=null; }
      if(!candidate){
        const {data,error}=await (supabase as any).rpc("get_eligible_popup",{p_user_id:user.id});
        candidate=(error?null:data?.[0]) as EligiblePopup|null;
      }
      if(cancelled||!candidate)return;
      const snoozedUntil=Number(localStorage.getItem(snoozeKey(candidate.rule_id))??0);
      if(snoozedUntil>Date.now())return;
      if(snoozedUntil)localStorage.removeItem(snoozeKey(candidate.rule_id));
      shown.current=true;
      setPopup(candidate);
      const score=candidate.content?.affinity_score;
      setAffinity(score==null?null:Number(score));
      const ends=candidate.content?.ends_at?Date.parse(candidate.content.ends_at):NaN;
      setRemaining(Number.isFinite(ends)?Math.max(0,ends-Date.now()):null);
      await (supabase as any).rpc("record_popup_event",{p_rule_id:candidate.rule_id,p_user_id:user.id,p_event_type:"view"});
    };
    void load();
    return()=>{cancelled=true};
  },[getStrategic]);

  useEffect(()=>{ if(!popup?.content?.ends_at)return; const ends=Date.parse(popup.content.ends_at); const id=window.setInterval(()=>setRemaining(Math.max(0,ends-Date.now())),1000); return()=>window.clearInterval(id); },[popup]);

  const content=useMemo(()=>popup?.content??{},[popup]);
  const record=async(eventType:"click"|"dismiss",target?:string)=>{if(!popup)return;const {data:{user}}=await supabase.auth.getUser(); await (supabase as any).rpc("record_popup_event",{p_rule_id:popup.rule_id,p_user_id:user?.id??null,p_event_type:eventType}); setPopup(null); shown.current=false; if(target)window.location.assign(target)};
  const snoozeMinutes=Math.max(1,Number(content.snooze_minutes??popup?.cooldown_minutes??240));
  const snooze=async()=>{if(!popup)return;localStorage.setItem(snoozeKey(popup.rule_id),String(Date.now()+snoozeMinutes*60000));await record("dismiss")};
  if(!popup)return null;

  const strategy=content.strategy;
  const isFlash=strategy==='flash_deal';
  const isBundle=strategy==='bundle';
  const isUpsell=strategy==='upsell';
  const isReward=strategy==='reward';
  const isGift=strategy==='gift';
  const formatMoney=(v?:number)=>typeof v==='number'?v.toLocaleString('pt-BR',{style:'currency',currency:'BRL'}):null;
  const countdown=remaining!==null?`${String(Math.floor(remaining/3600000)).padStart(2,'0')}:${String(Math.floor((remaining%3600000)/60000)).padStart(2,'0')}:${String(Math.floor((remaining%60000)/1000)).padStart(2,'0')}`:null;
  const icon=isBundle?<Package className="h-4 w-4"/>:isFlash?<Zap className="h-4 w-4"/>:isUpsell?<Crown className="h-4 w-4"/>:isReward?<Trophy className="h-4 w-4"/>:isGift?<Gift className="h-4 w-4"/>:<Sparkles className="h-4 w-4"/>;
  const title=isBundle?'🎁 Kit Exclusivo':isFlash?'⚡ Oferta Relâmpago':isUpsell?'⬆ Upsell Inteligente':isReward?'🏆 Recompensa desbloqueada':isGift?'🎁 Brinde da oferta':content.title??popup.name;
  const description=isBundle
    ? `${content.view_count??0} pessoas visualizaram este kit${content.bundle_discount_price!=null&&content.sum_price!=null?` • De ${formatMoney(content.sum_price)} por ${formatMoney(content.bundle_discount_price)}`:''}`
    : isFlash
      ? `${content.discount!=null?`-${content.discount}% de desconto real`: 'Oferta ativa'}${countdown?` • termina em ${countdown}`:''}`
      : isUpsell
        ? `Por ${formatMoney(content.price_difference??0)} a mais, compare com ${content.upsell_title??'a opção premium'}${content.choice_rate!=null?` • ${content.choice_rate}% escolheram Premium`:''}`
        : isReward
          ? `Você ganhou ${content.points ?? 0} pontos${content.reason?` por ${content.reason.replaceAll('_',' ')}`:''}.`
          : isGift
            ? content.gift_description
            : content.description;

  return <div className="fixed inset-x-4 bottom-[88px] z-[100] mx-auto max-w-[380px] md:inset-x-auto md:right-6 md:bottom-6" role="dialog" aria-live="polite" aria-label="Oferta personalizada">
    <div className="relative overflow-hidden rounded-3xl border border-primary/20 bg-background/95 p-4 shadow-2xl backdrop-blur-xl">
      <button aria-label="Fechar" onClick={()=>void record("dismiss")} className="absolute right-2 top-2 flex h-11 w-11 items-center justify-center rounded-full hover:bg-muted" type="button"><X className="h-4 w-4"/></button>
      {content.image_url&&<img src={content.image_url} alt={content.image_alt||content.title||title} className="mb-3 h-28 w-full rounded-2xl object-cover" loading="lazy"/>}
      <div className="pr-8"><div className="mb-2 flex items-center gap-2 text-primary"><span>{icon}</span><span className="text-[10px] font-black uppercase tracking-widest">{title}</span></div>
        {isBundle&&<h3 className="text-lg font-black tracking-tight">{content.title}</h3>}
        {isFlash&&<h3 className="text-lg font-black tracking-tight">{content.title}</h3>}
        {isUpsell&&<h3 className="text-lg font-black tracking-tight">{content.upsell_title}</h3>}
        {isReward&&<div className="mt-2 text-3xl font-black tracking-tight">+{content.points ?? 0} pontos</div>}
        {isGift&&<h3 className="text-lg font-black tracking-tight">Oferta com brinde</h3>}
        {description&&<p className="mt-2 text-sm leading-snug text-muted-foreground">{description}</p>}
        {affinity!==null&&affinity>=70&&<div className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-3 py-1.5 text-xs font-black text-primary"><Target className="h-3.5 w-3.5"/>{Math.round(affinity)}% compatível com você</div>}
        {isFlash&&countdown&&<div className="mt-3 inline-flex items-center gap-2 rounded-xl bg-primary/10 px-3 py-2 text-xs font-black text-primary"><Clock3 className="h-4 w-4"/> {countdown}</div>}
        {isUpsell&&content.choice_rate!=null&&Number(content.choice_sample_size)>=20&&<p className="mt-2 text-xs font-bold text-muted-foreground">Base real: {content.choice_sample_size} cliques de afiliado</p>}
      </div>
      <div className="mt-4 flex gap-2">{popup.cta_label&&<Button onClick={()=>void record("click",popup.cta_target)} className="h-11 flex-1 rounded-xl font-black uppercase italic" type="button">{popup.cta_label}<ArrowRight className="ml-2 h-4 w-4"/></Button>}</div>
      <button type="button" onClick={()=>void snooze()} className="mt-2 inline-flex min-h-9 w-full items-center justify-center gap-2 rounded-xl text-xs font-bold text-muted-foreground hover:bg-muted"><Clock3 className="h-3.5 w-3.5"/>Lembrar em {snoozeMinutes>=60?`${Math.round(snoozeMinutes/60)}h`:`${snoozeMinutes}min`}</button>
    </div>
  </div>;
}
