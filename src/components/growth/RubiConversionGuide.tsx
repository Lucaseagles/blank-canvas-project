import { useState } from "react";
import { trackEvent } from "@/lib/analytics";
import { CheckCircle2, ChevronDown, ChevronUp, Lightbulb, ShieldCheck } from "lucide-react";

type Audience="consumer"|"merchant"|"partner";
const guides:Record<Audience,{heading:string;intro:string;steps:{title:string;detail:string}[];note:string}>={
 consumer:{
  heading:"Escolha com confiança",intro:"Compare opções e conheça as condições antes de decidir.",
  steps:[
   {title:"Descubra algo útil",detail:"Explore vídeos, lançamentos e ofertas relacionadas às categorias de seu interesse."},
   {title:"Confira a oferta",detail:"Leia características, condições, prazo verdadeiro de campanhas e avaliações com origem identificada."},
   {title:"Decida no checkout oficial",detail:"Confira o valor final, entrega e pagamento no fornecedor antes de concluir."}],
  note:"Abrir uma oferta ou visualizar uma página não equivale a uma compra. Criar conta para explorar a RUBI é opcional."
 },
 merchant:{
  heading:"Seu caminho para comprar melhor",intro:"Organize uma cotação e facilite sua próxima reposição sem perder o controle dos custos.",
  steps:[
   {title:"Compare por quantidade",detail:"Confira mínimos, faixas de preço e produtos liberados para seu perfil comercial."},
   {title:"Monte uma cotação",detail:"Selecione as quantidades e envie a solicitação para atendimento comercial."},
   {title:"Prepare reposição",detail:"Use uma cotação anterior como referência e, se quiser, autorize um acompanhamento futuro."}],
  note:"A pré-cotação não reserva estoque, não fixa preço e não confirma pedido. Valores são recalculados pelo servidor."
 },
 partner:{
  heading:"Seu plano de divulgação em três passos",intro:"Transforme seus produtos autorizados em conteúdos úteis para sua própria audiência.",
  steps:[
   {title:"Escolha a oferta certa",detail:"Selecione apenas produtos liberados para seu perfil e conectados aos interesses reais do seu público."},
   {title:"Crie três abordagens",detail:"Teste demonstração, história de uso legítimo e explicação de dúvidas. Use imagens e alegações verificadas; identifique a publicidade."},
   {title:"Compartilhe e acompanhe",detail:"Divulgue seu link individual, acompanhe visitas e confira vendas e comissões somente quando confirmadas."}],
  note:"Não prometa ganhos, compras recentes ou escassez inexistentes. O destino de pagamento permanece sujeito à atribuição oficial."
 }
};
/** Small, optional education panel; does not grant access or fabricate conversion claims. */
export function RubiConversionGuide({audience}:{audience:Audience}){
 const [open,setOpen]=useState(false);
 const guide=guides[audience];
 return <section aria-label={guide.heading} className="overflow-hidden rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/[0.10] via-card to-background shadow-sm">
  <button type="button" aria-expanded={open} onClick={()=>setOpen(value=>{if(!value)void trackEvent("RUBI_CONVERSION_GUIDE_OPEN",{audience});return !value;})}
   className="flex min-h-20 w-full items-center justify-between gap-4 p-5 text-left sm:p-6">
   <span className="flex min-w-0 items-center gap-3">
    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary"><Lightbulb className="h-5 w-5"/></span>
    <span><strong className="block text-lg font-black">{guide.heading}</strong>
     <span className="mt-1 block text-xs leading-5 text-muted-foreground">{guide.intro}</span></span>
   </span>
   {open?<ChevronUp className="h-5 w-5 shrink-0 text-primary"/>:<ChevronDown className="h-5 w-5 shrink-0 text-primary"/>}
  </button>
  {open&&<div className="space-y-4 border-t p-5 sm:p-6">
   <div className="grid gap-3 md:grid-cols-3">
    {guide.steps.map((step,i)=><div key={step.title} className="rounded-2xl border bg-background/70 p-4">
     <span className="mb-3 inline-flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-xs font-black text-primary">{i+1}</span>
     <h3 className="flex items-center gap-2 text-sm font-black"><CheckCircle2 className="h-4 w-4 text-primary"/>{step.title}</h3>
     <p className="mt-2 text-xs leading-5 text-muted-foreground">{step.detail}</p>
    </div>)}
   </div>
   <p className="flex gap-2 rounded-xl border bg-background/40 p-3 text-xs leading-5 text-muted-foreground">
    <ShieldCheck className="h-4 w-4 shrink-0 text-primary"/>{guide.note}
   </p>
  </div>}
 </section>;
}
