import { Link, Video, ArrowRight, Sparkles, PlayCircle, ExternalLink } from "lucide-react";

interface VideoTypeSelectorProps { onSelect: (type: "native" | "bridge") => void; }

export function VideoTypeSelector({ onSelect }: VideoTypeSelectorProps) {
  return (
    <div className="video-type-selector">
      <h2>Adicionar vídeo</h2>
      <p className="subtitle">Escolha como este vídeo será disponibilizado.</p>
      <div className="relative grid gap-5 md:grid-cols-2">
        <button type="button" className="group relative overflow-hidden rounded-3xl border border-border/60 bg-background/50 p-6 text-left shadow-sm backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:bg-primary/[0.03] hover:shadow-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50" onClick={() => onSelect("native")}>
          <span className="type-icon native"><Video size={32} /></span><h3>Vídeo Nativo</h3>
          <p>URL ou arquivo hospedado pelo próprio sistema.</p>
          <span className="type-cta">Escolher <ArrowRight size={16} /></span>
        </button>
        <button type="button" className="type-card glassmorphism" onClick={() => onSelect("bridge")}>
          <span className="type-icon bridge"><Link size={32} /></span><h3>Vídeo Ponte</h3>
          <p>Link para TikTok, Shopee Video ou Mercado Livre.</p>
          <span className="type-cta">Escolher <ArrowRight size={16} /></span>
        </button>
      </div>
      <div className="relative mt-6 flex items-center gap-2 rounded-2xl border border-primary/10 bg-primary/5 px-4 py-3 text-xs font-medium text-muted-foreground"><Sparkles size={16} className="shrink-0 text-primary" /> Os dois formatos são administrados no mesmo módulo e seguem o mesmo padrão de publicação.</div>
    </div>
  );
}
