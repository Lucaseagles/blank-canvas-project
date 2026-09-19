import { ArrowRight, ExternalLink, PlayCircle, Sparkles, Video } from "lucide-react";

interface VideoTypeSelectorProps {
  onSelect: (type: "native" | "bridge") => void;
}

export function VideoTypeSelector({ onSelect }: VideoTypeSelectorProps) {
  return (
    <section className="relative overflow-hidden rounded-[2rem] border border-border/60 bg-card/60 p-5 shadow-elevation-1 backdrop-blur-xl sm:p-7 md:p-9">
      <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -left-24 h-64 w-64 rounded-full bg-primary/5 blur-3xl" />

      <div className="relative flex flex-col gap-8">
        <header className="flex items-start gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 text-primary shadow-sm">
            <PlayCircle className="h-7 w-7" />
          </div>
          <div className="min-w-0">
            <div className="mb-2 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-primary">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              Central de vídeos
            </div>
            <h2 className="text-3xl font-black tracking-[-0.04em] text-foreground sm:text-4xl">
              Adicionar vídeo
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              Escolha a forma de publicação e configure o conteúdo no fluxo adequado.
            </p>
          </div>
        </header>

        <div className="grid gap-5 md:grid-cols-2">
          <button
            type="button"
            onClick={() => onSelect("native")}
            className="group relative min-h-[245px] overflow-hidden rounded-[1.75rem] border border-border/60 bg-background/50 p-6 text-left shadow-sm backdrop-blur-xl transition-all duration-300 hover:-translate-y-1.5 hover:border-primary/40 hover:bg-primary/[0.03] hover:shadow-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
          >
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
            <div className="relative flex h-full flex-col">
              <div className="mb-8 flex items-center justify-between">
                <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary transition-transform duration-300 group-hover:scale-105">
                  <Video className="h-7 w-7" />
                </span>
                <span className="rounded-full border border-border/60 bg-card/70 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-muted-foreground">
                  Hospedado
                </span>
              </div>
              <h3 className="text-xl font-black tracking-tight">Vídeo Nativo</h3>
              <p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">
                Conteúdo hospedado pelo próprio sistema, com controle completo de mídia e publicação.
              </p>
              <span className="mt-auto pt-7 inline-flex items-center gap-2 text-sm font-black text-primary">
                Continuar
                <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
              </span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => onSelect("bridge")}
            className="group relative min-h-[245px] overflow-hidden rounded-[1.75rem] border border-border/60 bg-background/50 p-6 text-left shadow-sm backdrop-blur-xl transition-all duration-300 hover:-translate-y-1.5 hover:border-primary/40 hover:bg-primary/[0.03] hover:shadow-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
          >
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
            <div className="relative flex h-full flex-col">
              <div className="mb-8 flex items-center justify-between">
                <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary transition-transform duration-300 group-hover:scale-105">
                  <ExternalLink className="h-7 w-7" />
                </span>
                <span className="rounded-full border border-border/60 bg-card/70 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-muted-foreground">
                  Externo
                </span>
              </div>
              <h3 className="text-xl font-black tracking-tight">Vídeo Ponte</h3>
              <p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">
                Conecte TikTok, Shopee Video ou Mercado Livre ao produto sem duplicar o conteúdo.
              </p>
              <span className="mt-auto pt-7 inline-flex items-center gap-2 text-sm font-black text-primary">
                Continuar
                <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
              </span>
            </div>
          </button>
        </div>

        <div className="flex items-start gap-3 rounded-2xl border border-primary/10 bg-primary/5 px-4 py-3.5 text-xs leading-5 text-muted-foreground">
          <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <span><strong className="font-bold text-foreground">Um único módulo.</strong> Os dois formatos seguem o mesmo fluxo de publicação e aparecem integrados no painel.</span>
        </div>
      </div>
    </section>
  );
}
