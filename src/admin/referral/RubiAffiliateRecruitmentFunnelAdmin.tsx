import {useQuery} from "@tanstack/react-query";
import {useServerFn} from "@tanstack/react-start";
import {Activity,MousePointerClick,Send,UserCheck,PauseCircle,EyeOff} from "lucide-react";
import {getRubiAffiliateRecruitmentFunnelAdmin} from "@/lib/rubi-affiliate-recruitment-funnel.functions";

const metrics=[
 ["Exibições","RUBI_AFFILIATE_INVITE_SHOWN",Activity],
 ["Aberturas","RUBI_AFFILIATE_INVITE_OPENED",MousePointerClick],
 ["Cliques no convite","RUBI_AFFILIATE_INVITE_CTA",Send],
 ["Candidaturas","RUBI_AFFILIATE_APPLICATION_SUBMITTED",UserCheck],
 ["Pausas","RUBI_AFFILIATE_INVITE_PAUSED",PauseCircle],
 ["Recusas definitivas","RUBI_AFFILIATE_INVITE_OPTED_OUT",EyeOff]
] as const;
const pct=(value:number|null)=>value===null?"—":value.toLocaleString("pt-BR",{maximumFractionDigits:1})+"%";

/** Private Shadow Master panel; counts events, not unique consumers or sales. */
export function RubiAffiliateRecruitmentFunnelAdmin(){
 const load=useServerFn(getRubiAffiliateRecruitmentFunnelAdmin);
 const query=useQuery({queryKey:["rubi-affiliate-recruitment-funnel"],queryFn:()=>load(),staleTime:30000,retry:false});
 if(query.isLoading)return <section className="rounded-2xl border p-5 text-sm text-muted-foreground" aria-label="Funil de recrutamento de afiliados">Carregando funil de afiliados...</section>;
 if(query.isError||!query.data)return <section className="rounded-2xl border border-destructive/20 p-5 text-sm text-destructive" role="alert">Não foi possível carregar o funil RUBI Indica.</section>;
 const {counts,rates}=query.data;
 return <section className="space-y-4 rounded-3xl border border-primary/20 bg-card p-5 sm:p-7" aria-label="Funil de recrutamento de afiliados">
  <header><p className="text-xs font-black uppercase tracking-widest text-primary">RUBI Indica · Aquisição</p><h2 className="mt-1 text-xl font-black">Funil de consumidores para afiliados</h2><p className="text-xs text-muted-foreground">Últimos {query.data.periodDays} dias · atualizado {new Date(query.data.asOf).toLocaleString("pt-BR")}</p></header>
  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">{metrics.map(([label,key,Icon])=><article key={key} className="rounded-2xl border bg-background/60 p-3"><Icon className="h-4 w-4 text-primary"/><p className="mt-3 text-2xl font-black tabular-nums">{counts[key].toLocaleString("pt-BR")}</p><p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">{label}</p></article>)}</div>
  <div className="grid gap-3 sm:grid-cols-3"><article className="rounded-xl border p-4"><p className="text-xs text-muted-foreground">Exibição → abertura</p><p className="text-2xl font-black">{pct(rates.openFromShown)}</p></article><article className="rounded-xl border p-4"><p className="text-xs text-muted-foreground">Abertura → clique no CTA</p><p className="text-2xl font-black">{pct(rates.ctaFromOpened)}</p></article><article className="rounded-xl border p-4"><p className="text-xs text-muted-foreground">Clique → candidatura concluída</p><p className="text-2xl font-black">{pct(rates.applicationFromCta)}</p></article></div>
  <p className="text-xs text-muted-foreground">{query.data.note}</p>
 </section>;
}
