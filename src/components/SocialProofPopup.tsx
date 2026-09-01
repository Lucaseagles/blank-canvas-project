import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getSocialProofEvents, getSocialProofConfig, getAggregatedSocialProof } from '@/lib/social-proof.functions';
import { supabase } from '@/integrations/supabase/client';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import { Eye, Heart, ExternalLink, Users, ArrowDown, PlayCircle, Award, UserPlus } from 'lucide-react';

type SocialEvent = { id:string; type:string; userName:string; location?:string; productId?:string; badgeName?:string; timestamp:string };
type Format = 'session'|'favorite'|'offer_click'|'price_alert_conversion'|'aggregate_count'|'video_complete'|'badge_unlock'|'referral_activated';
const SWIPE_THRESHOLD=90;
const DAILY_CAP=5;
const ACTIVE_WINDOW_MS=5*60*1000;
const DISPLAY_INTERVAL_MS=30*1000;
const DAILY_KEY='social_proof_daily_count';
const REAL_EVENT_TYPES = new Set(['ADD_FAVORITE','OUTBOUND_CLICK','SESSION_START','PRICE_ALERT_CONVERSION','VIDEO_COMPLETE','video_complete','BADGE_UNLOCKED','REFERRAL_ACTIVATED']);

function getFormat(e:SocialEvent):Format|null {
 if(e.type==='ADD_FAVORITE')return'favorite';
 if(e.type==='OUTBOUND_CLICK')return'offer_click';
 if(e.type==='SESSION_START')return'session';
 if(e.type==='PRICE_ALERT_CONVERSION')return'price_alert_conversion';
 if(e.type==='VIDEO_COMPLETE'||e.type==='video_complete')return'video_complete';
 if(e.type==='BADGE_UNLOCKED')return'badge_unlock';
 if(e.type==='REFERRAL_ACTIVATED')return'referral_activated';
 return null;
}

function getDailyCount(){
 try { const raw=localStorage.getItem(DAILY_KEY); if(!raw)return 0; const parsed=JSON.parse(raw); if(parsed.day!==new Date().toISOString().slice(0,10))return 0; return Number(parsed.count)||0; } catch { return 0; }
}
function incrementDailyCount(){
 const day=new Date().toISOString().slice(0,10); const next=getDailyCount()+1; localStorage.setItem(DAILY_KEY,JSON.stringify({day,count:next})); return next;
}

export function SocialProofPopup(){
 const [visible,setVisible]=useState(false),[event,setEvent]=useState<SocialEvent|null>(null),[product,setProduct]=useState<any>(null),[aggregate,setAggregate]=useState<any>(null),[active,setActive]=useState(true),[dailyCount,setDailyCount]=useState(0),[dragging,setDragging]=useState(false);
 const x=useMotionValue(0),opacity=useTransform(x,[-220,0,220],[0,1,0]),shownIds=useRef<Set<string>>(new Set()),lastActivity=useRef(Date.now());
 const {data:config}=useQuery({queryKey:['socialProofConfig'],queryFn:getSocialProofConfig,staleTime:30000});
 const enabled=Boolean((config as any)?.is_enabled)&&active&&dailyCount<DAILY_CAP;
 const {data:events=[]}=useQuery({queryKey:['socialProofEvents'],queryFn:getSocialProofEvents,enabled,refetchInterval:15000,staleTime:5000});

 useEffect(()=>{setDailyCount(getDailyCount()); const mark=()=>{lastActivity.current=Date.now();setActive(true)}; const check=()=>setActive(Date.now()-lastActivity.current<ACTIVE_WINDOW_MS); const names=['pointerdown','pointermove','keydown','touchstart','scroll']; names.forEach(n=>window.addEventListener(n,mark,{passive:true})); const id=window.setInterval(check,30000); check(); return()=>{names.forEach(n=>window.removeEventListener(n,mark));window.clearInterval(id)}},[]);

 const allowed=useMemo(()=>new Set(((config as any)?.enabled_formats?.length?(config as any).enabled_formats:['session','favorite','offer_click','price_alert_conversion','aggregate_count','video_complete','badge_unlock','referral_activated']) as string[]),[config]);
 const candidates=useMemo(()=> (events as SocialEvent[]).filter(e=>REAL_EVENT_TYPES.has(e.type)).map(e=>({event:e,format:getFormat(e)})).filter(({event,format})=>Boolean(format)&&allowed.has(format as string)&&(event.type==='SESSION_START'||event.type==='BADGE_UNLOCKED'||event.type==='REFERRAL_ACTIVATED'||Boolean(event.productId))),[events,allowed]);

 useEffect(()=>{ if(!enabled||visible||!candidates.length)return; let cancelled=false; const run=async()=>{ if(getDailyCount()>=DAILY_CAP){setDailyCount(DAILY_CAP);return;} const fresh=candidates.filter(({event:e})=>!shownIds.current.has(e.id)); const pool=fresh.length?fresh:candidates; const selected=pool[Math.floor(Math.random()*pool.length)]; if(!selected||cancelled)return; shownIds.current.add(selected.event.id); let p:any=null; if(selected.event.productId){const r=await supabase.from('products').select('id,title,images').eq('id',selected.event.productId).maybeSingle(); p=r.data;} if(cancelled)return; incrementDailyCount(); setDailyCount(getDailyCount()); setProduct(p); setEvent(selected.event); setVisible(true); }; const t=window.setTimeout(run,1800); return()=>{cancelled=true;window.clearTimeout(t)}; },[enabled,visible,candidates]);

 useEffect(()=>{ if(!enabled||visible||!allowed.has('aggregate_count'))return; const candidate=(events as SocialEvent[]).find(e=>REAL_EVENT_TYPES.has(e.type)&&e.productId); if(!candidate?.productId)return; getAggregatedSocialProof({data:{productId:candidate.productId}} as any).then(d=>{if(d)setAggregate(d)}).catch(()=>undefined); },[enabled,visible,allowed,events]);

 const close=()=>{setVisible(false);setEvent(null);setProduct(null);x.set(0)};
 if(!event||!active||dailyCount>DAILY_CAP)return null;
 const format=getFormat(event); if(!format)return null;
 const image=product&&Array.isArray(product.images)?product.images[0]:null;
 const copy:any={favorite:<><b>{event.userName}</b> favoritou <strong>{product?.title??'um produto'}</strong></>,offer_click:<><b>{event.userName}</b> está vendo uma oferta em <strong>{product?.title??'um produto'}</strong></>,price_alert_conversion:<><b>{event.userName}</b> aproveitou uma queda de preço em <strong>{product?.title??'um produto'}</strong></>,session:<><b>{event.userName}</b> entrou recentemente no app</>,aggregate_count:<><strong>{aggregate?.views??0}</strong> pessoas viram esta oferta recentemente</>,video_complete:<><b>{event.userName}</b> assistiu ao vídeo de <strong>{product?.title??'um produto'}</strong></>,badge_unlock:<><b>{event.userName}</b> desbloqueou a conquista <strong>{event.badgeName??'uma conquista'}</strong></>,referral_activated:<><b>{event.userName}</b> entrou através de uma indicação</>}[format];
 const icon:any={favorite:<Heart className="h-3.5 w-3.5 fill-current"/>,offer_click:<ExternalLink className="h-3.5 w-3.5"/>,price_alert_conversion:<ArrowDown className="h-3.5 w-3.5"/>,session:<Users className="h-3.5 w-3.5"/>,aggregate_count:<Eye className="h-3.5 w-3.5"/>,video_complete:<PlayCircle className="h-3.5 w-3.5"/>,badge_unlock:<Award className="h-3.5 w-3.5"/>,referral_activated:<UserPlus className="h-3.5 w-3.5"/>}[format];
 return <AnimatePresence><motion.div key={event.id} role="status" aria-live="polite" drag="x" dragConstraints={{left:0,right:0}} style={{x,opacity}} onDragStart={()=>setDragging(true)} onDragEnd={(_,info)=>{setDragging(false);if(Math.abs(info.offset.x)>=SWIPE_THRESHOLD)close();else x.set(0)}} initial={{opacity:0,y:24,scale:.96}} animate={{opacity:1,y:0,scale:1}} exit={{opacity:0,y:20,scale:.96}} className="fixed bottom-[88px] left-4 right-4 z-[110] mx-auto w-auto max-w-[380px] cursor-grab select-none touch-pan-y md:bottom-6 md:left-auto md:right-6" data-social-proof-format={format} data-daily-count={dailyCount} data-dragging={dragging}><div className="relative overflow-hidden rounded-2xl border border-border/70 bg-background/95 p-3 shadow-2xl backdrop-blur-xl"><div className="flex items-center gap-3">{image?<img src={image} alt="" loading="lazy" decoding="async" className="h-12 w-12 shrink-0 rounded-xl object-cover"/>:<div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">{icon}</div>}<div className="min-w-0 flex-1 pr-7"><div className="mb-1 flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[.16em] text-muted-foreground"><span className="text-primary">{icon}</span> Prova social</div><p className="text-[13px] leading-snug text-foreground/90">{copy}</p></div><button type="button" onClick={close} aria-label="Dispensar prova social" className="absolute right-1 top-1 flex h-10 w-10 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"><Eye className="h-4 w-4"/></button></div></div></motion.div></AnimatePresence>;
}
