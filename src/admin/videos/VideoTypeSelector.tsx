import { Link, Video, ArrowRight, Sparkles } from "lucide-react";

interface VideoTypeSelectorProps { onSelect: (type: "native" | "bridge") => void; }

export function VideoTypeSelector({ onSelect }: VideoTypeSelectorProps) {
  return (
    <div className="video-type-selector">
      <h2>Adicionar vídeo</h2>
      <p className="subtitle">Escolha como este vídeo será disponibilizado.</p>
      <div className="type-grid">
        <button type="button" className="type-card glassmorphism" onClick={() => onSelect("native")}>
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
      <div className="type-hint"><Sparkles size={16} /> Os dois tipos são administrados no mesmo módulo.</div>
    </div>
  );
}
