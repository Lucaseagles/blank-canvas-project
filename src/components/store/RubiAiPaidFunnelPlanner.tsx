import {useState} from "react";
import {toast} from "sonner";
import {Button} from "@/components/ui/button";
import {BadgeCheck,BrainCircuit,ClipboardCopy,Megaphone,ShieldCheck} from "lucide-react";
import {buildRubiPaidFunnelBrief,validateRubiPaidFunnel,type RubiPaidFunnelAudience,type RubiPaidFunnelMode} from "@/lib/rubi-ai-paid-funnel";

/** Master-only parent must guard access. Draft generation never publishes or spends. */
export function RubiAiPaidFunnelPlanner({
 productId,variantName,campaign
}:{productId:string;variantName:string;campaign:string}){
 const [mode,setMode]=useState<RubiPaidFunnelMode>("ai_seller_video");
 const [audience,setAudience]=useState<RubiPaidFunnelAudience>("consumer");
 const [dailyBudget,setDailyBudget]=useState("10");
 const [runDays,setRunDays]=useState("3");
 const [claimEvidence,setClaimEvidence]=useState("");
 const [approved,setApproved]=useState(false);
 const input={mode,audience,productId,productName:variantName,campaign,
  dailyBudget:Number(dailyBudget),runDays:Number(runDays),claimEvidence};
 const errors=validateRubiPaidFunnel(input);
 const total=Number(dailyBudget)*Number(runDays);
 const resetApproval=()=>setApproved(false);
 const copy=async()=>{
  if(!approved||errors.length){toast.error("Confira o planejamento e confirme a revisão antes de copiar.");return;}
  try{
   await navigator.clipboard.writeText(buildRubiPaidFunnelBrief(input));
   toast.success("Brief de campanha copiado. Nenhum anúncio foi publicado.");
  }catch{toast.error("Não foi possível copiar o brief neste navegador.");}
 };
 return <section aria-label="Planejador de tráfego pago assistido por IA" className="space-y-4 rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 via-card to-background p-4 sm:p-5">
  <header className="flex items-start gap-3">
   <div className="rounded-xl bg-primary/10 p-2.5 text-primary"><BrainCircuit className="h-5 w-5"/></div>
   <div className="space-y-1">
    <h5 className="font-black">Funis de tráfego pago + IA · planejamento</h5>
    <p className="text-xs leading-5 text-muted-foreground">Prepare um brief a partir desta variante. IA pode ajudar no roteiro, mas não há geração de vídeo nem compra de mídia automática aqui.</p>
   </div>
  </header>
  <div className="grid gap-3 sm:grid-cols-2">
   <label className="space-y-1 text-xs font-semibold">Modelo de aquisição
    <select className="block w-full rounded-xl border bg-background p-2.5 text-sm" value={mode}
     onChange={e=>{setMode(e.target.value as RubiPaidFunnelMode);resetApproval();}}>
     <option value="ai_seller_video">Agente vendedor → produto → prompt → vídeo → resultado</option>
     <option value="direct_response">Anúncio → criativo → página de vendas → resultado</option>
    </select>
   </label>
   <label className="space-y-1 text-xs font-semibold">Público do funil
    <select className="block w-full rounded-xl border bg-background p-2.5 text-sm" value={audience}
     onChange={e=>{setAudience(e.target.value as RubiPaidFunnelAudience);resetApproval();}}>
     <option value="consumer">Consumidor</option><option value="merchant">Lojista</option><option value="partner">Parceiro</option>
    </select>
   </label>
   <label className="space-y-1 text-xs font-semibold">Limite proposto de gasto diário (R$)
    <input type="number" min="0.01" max="10000" step="0.01" value={dailyBudget}
     onChange={e=>{setDailyBudget(e.target.value);resetApproval();}}
     className="block w-full rounded-xl border bg-background p-2.5 text-sm"/>
   </label>
   <label className="space-y-1 text-xs font-semibold">Duração proposta em dias
    <input type="number" min="1" max="90" step="1" value={runDays}
     onChange={e=>{setRunDays(e.target.value);resetApproval();}}
     className="block w-full rounded-xl border bg-background p-2.5 text-sm"/>
   </label>
  </div>
  <label className="block space-y-1 text-xs font-semibold">Evidência das afirmações comerciais
   <textarea value={claimEvidence} maxLength={1500} rows={3} onChange={e=>{setClaimEvidence(e.target.value);resetApproval();}}
    placeholder="Fonte das características, benefícios e condições que o criativo pode afirmar"
    className="block w-full rounded-xl border bg-background p-3 text-sm"/>
  </label>
  <div className="flex flex-wrap items-center gap-2 rounded-xl border bg-background/70 p-3">
   <Megaphone className="h-4 w-4 text-primary"/>
   <p className="text-xs font-semibold">Campanha: {campaign||"não selecionada"} · Teto planejado: {Number.isFinite(total)&&total>0?total.toLocaleString("pt-BR",{style:"currency",currency:"BRL"}):"—"}</p>
  </div>
  {errors.length>0&&<div role="status" className="space-y-1 text-xs text-muted-foreground">
   {errors.map(error=><p key={error}>• {error}</p>)}
  </div>}
  <label className="flex items-start gap-2 rounded-xl border p-3 text-xs leading-5">
   <input type="checkbox" checked={approved} onChange={e=>setApproved(e.target.checked)} className="mt-1"/>
   <span>Revisei o conteúdo, entendi que orçamento é apenas uma projeção e que o Shadow Master precisará aprovar e publicar anúncios separadamente.</span>
  </label>
  <Button type="button" disabled={errors.length>0||!approved} onClick={()=>void copy()}>
   <ClipboardCopy className="mr-2 h-4 w-4"/> Copiar brief para revisão
  </Button>
  <p className="flex gap-2 text-xs leading-5 text-muted-foreground"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary"/>
   Sem API de Meta Ads/TikTok Ads, gasto automático, promessa de retorno ou autorização de pagamento. Para parceiros, links individuais e atribuição oficial continuam obrigatórios.</p>
  <p className="flex gap-2 text-xs text-muted-foreground"><BadgeCheck className="h-4 w-4 shrink-0 text-primary"/> Gatilhos permitidos: solução legítima, demonstração, dúvidas, prova real, prazos verdadeiros e criativos aprovados.</p>
 </section>;
}
