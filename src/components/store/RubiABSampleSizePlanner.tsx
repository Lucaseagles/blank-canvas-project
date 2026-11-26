import {useMemo,useState} from "react";
import {estimateRubiABSampleSize} from "@/lib/rubi-ab-sample-size";

/** Planning aid only: estimates traffic needed before a controlled A/B test starts. */
export function RubiABSampleSizePlanner(){
 const [baseline,setBaseline]=useState("5");
 const [effect,setEffect]=useState("2");
 const estimate=useMemo(()=>estimateRubiABSampleSize({
  baselineRatePercent:Number(baseline),
  minimumDetectableEffectPoints:Number(effect),
 }),[baseline,effect]);
 const fmt=(value:number)=>value.toLocaleString("pt-BR");
 return <aside className="space-y-3 rounded-xl border p-3" aria-label="Planejador de amostra para experimento A/B">
  <div>
   <h5 className="text-sm font-bold">Planejamento de amostra para A/B</h5>
   <p className="text-xs text-muted-foreground">Estime o tráfego necessário antes de iniciar um teste controlado. Use uma taxa-base observada e escolha a menor diferença que valeria uma decisão comercial.</p>
  </div>
  <div className="grid gap-3 sm:grid-cols-2">
   <label className="space-y-1 text-xs">
    <span className="font-medium">Taxa-base estimada (%)</span>
    <input aria-label="Taxa-base estimada em porcentagem" type="number" min="0.1" max="99.9" step="0.1" value={baseline} onChange={event=>setBaseline(event.target.value)} className="h-10 w-full rounded-lg border bg-background px-3 text-sm"/>
   </label>
   <label className="space-y-1 text-xs">
    <span className="font-medium">Efeito mínimo detectável (pontos percentuais)</span>
    <input aria-label="Efeito mínimo detectável em pontos percentuais" type="number" min="0.1" max="99" step="0.1" value={effect} onChange={event=>setEffect(event.target.value)} className="h-10 w-full rounded-lg border bg-background px-3 text-sm"/>
   </label>
  </div>
  {estimate?<div className="grid grid-cols-2 gap-2">
   <div className="rounded-lg bg-muted/40 p-3"><p className="text-xs text-muted-foreground">Por variante</p><p className="text-xl font-bold tabular-nums">{fmt(estimate.perArm)}</p></div>
   <div className="rounded-lg bg-muted/40 p-3"><p className="text-xs text-muted-foreground">Total estimado</p><p className="text-xl font-bold tabular-nums">{fmt(estimate.total)}</p></div>
   <p className="col-span-2 text-xs text-muted-foreground">Referência: {estimate.baselineRatePercent.toLocaleString("pt-BR")}% → {estimate.challengerRatePercent.toLocaleString("pt-BR")}%, significância bilateral de 5% e poder de 80%, com alocação igual.</p>
  </div>:<p role="alert" className="text-xs text-destructive">Informe uma taxa-base entre 0% e 100% e um efeito positivo que não ultrapasse 100%.</p>}
  <p className="text-xs text-muted-foreground">Estimativa aproximada para duas proporções independentes. Não é análise de significância, não declara vencedor e não substitui revisão de tráfego, randomização, janela, perdas, múltiplas comparações ou métricas financeiras. A taxa de intenção de checkout não deve ser tratada como taxa de compra paga.</p>
 </aside>;
}
