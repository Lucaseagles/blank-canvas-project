import type {RubiAudienceEvidenceStatus} from "@/lib/rubi-audience-evidence-status";

export function RubiAudienceEvidenceStatusCard({status}:{status:RubiAudienceEvidenceStatus}){
 const presentation={
  missing:{
   tone:"border-border border-l-muted-foreground bg-muted/30",
   pill:"bg-muted text-muted-foreground",
   eyebrow:"ETAPA 1 · REGISTRO",
   title:"Ainda sem evidências",
   detail:"O movimento continua como hipótese editorial. Registre fontes reais antes de solicitar a revisão documental."
  },
  legacy_unstructured:{
   tone:"border-amber-500/40 border-l-amber-500 bg-gradient-to-br from-amber-500/10 via-card to-card",
   pill:"bg-amber-500/15 text-amber-800 dark:text-amber-300",
   eyebrow:"ATENÇÃO · NOTAS ANTIGAS",
   title:"Evidência não estruturada",
   detail:"As notas anteriores foram preservadas, mas não podem ser tratadas como evidência revisável. Organize a fonte, data, método, observação, limites e hipótese."
  },
  declared_pending_review:{
   tone:"border-sky-500/40 border-l-sky-500 bg-gradient-to-br from-sky-500/10 via-card to-card",
   pill:"bg-sky-500/15 text-sky-800 dark:text-sky-300",
   eyebrow:"ETAPA 2 · REVISÃO HUMANA",
   title:"Declaração registrada · revisão pendente",
   detail:"O registro está estruturado. O Shadow Master ainda precisa conferir a fonte e documentar a decisão. Isto não valida o mercado nem autoriza campanha."
  }
 }[status.kind];
 return <aside aria-label="Situação das evidências do público" aria-live="polite"
  className={`space-y-3 rounded-2xl border-l-4 border p-4 shadow-sm ${presentation.tone}`}>
  <div className="flex flex-wrap items-center justify-between gap-2">
   <p className="text-[10px] font-black uppercase tracking-[0.16em] text-muted-foreground">{presentation.eyebrow}</p>
   <span className={`rounded-full px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wide ${presentation.pill}`}>{status.label}</span>
  </div>
  <div className="space-y-1">
   <h4 className="text-base font-extrabold tracking-tight">{presentation.title}</h4>
   <p className="max-w-3xl text-xs leading-relaxed text-muted-foreground">{presentation.detail}</p>
  </div>
  {status.blockers.length>0&&<ul className="space-y-1 border-t border-current/10 pt-2">
   {status.blockers.map((blocker,index)=><li key={index} className="flex gap-2 text-xs leading-relaxed text-muted-foreground">
    <span aria-hidden="true" className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-current"/>
    <span>{blocker}</span>
   </li>)}
  </ul>}
  <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Rascunho → evidência declarada → revisão Master · validação de mercado exige dados reais independentes</p>
 </aside>;
}
