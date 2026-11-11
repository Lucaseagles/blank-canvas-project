import {Link} from "@tanstack/react-router";
import {ArrowUpRight,ShoppingBag} from "lucide-react";
/** The official RUBI retail storefront; permissions/prices of the current audience are unchanged. */
export function RubiStorefrontEntry({audience="consumer"}:{audience?:"consumer"|"merchant"|"partner"}){
 const details={
  consumer:{eyebrow:"RUBI Eagles · Loja oficial",title:"Explore a nossa vitrine",detail:"Descubra produtos e histórias que combinam com você."},
  merchant:{eyebrow:"RUBI Eagles · Varejo",title:"Conheça nossa loja principal",detail:"Veja a experiência do consumidor. Seus preços de atacado continuam exclusivos do painel lojista."},
  partner:{eyebrow:"RUBI Eagles · Varejo",title:"Explore a vitrine da RUBI",detail:"Conheça os produtos da loja. Para divulgar com atribuição e comissão, utilize seus links autorizados no portal."}
 }[audience];
 return <Link to="/hub-shop" className="group flex items-center gap-4 rounded-[1.5rem] border border-primary/20 bg-gradient-to-r from-primary/15 via-card to-card p-4 transition hover:-translate-y-0.5 hover:border-primary/50 sm:p-5">
  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/15 text-primary"><ShoppingBag className="h-6 w-6"/></div>
  <div className="min-w-0 flex-1"><p className="text-[10px] font-black uppercase tracking-[.2em] text-primary">{details.eyebrow}</p><h2 className="mt-1 text-lg font-black leading-tight">{details.title}</h2><p className="mt-1 text-xs text-muted-foreground">{details.detail}</p></div>
  <ArrowUpRight className="h-5 w-5 shrink-0 text-primary transition group-hover:translate-x-1 group-hover:-translate-y-1"/>
 </Link>;
}
