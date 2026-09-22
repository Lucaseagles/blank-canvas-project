import { useState } from "react";
import { ArrowLeft, Clapperboard, Sparkles } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { VideoTypeSelector } from "./VideoTypeSelector";
import { NativeVideoForm } from "./NativeVideoForm";
import { BridgeVideoForm } from "./BridgeVideoForm";

type VideoType = "native" | "bridge";

export function VideoForm({ mode }: { mode: "create" | "edit" }) {
  const navigate = useNavigate();
  const [type, setType] = useState<VideoType | null>(null);

  const onBack = () => {
    if (mode === "create" && type) {
      setType(null);
      return;
    }
    navigate({ to: "/admin/videos" });
  };

  if (mode === "create" && !type) {
    return (
      <div className="relative min-h-full overflow-hidden pb-12">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-80 bg-gradient-to-b from-primary/[0.08] via-primary/[0.025] to-transparent" />
        <div className="relative mx-auto max-w-6xl px-4 py-8 sm:py-10">
          <Button variant="ghost" className="mb-6 rounded-xl font-bold" onClick={onBack}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Voltar para vídeos
          </Button>
          <div className="mb-5 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-primary">
            <Clapperboard className="h-3.5 w-3.5" /> Central de conteúdo
          </div>
          <VideoTypeSelector onSelect={setType} />
        </div>
      </div>
    );
  }

  const typeLabel = type === "bridge" ? "Vídeo Ponte" : "Vídeo Nativo";
  const typeDescription = type === "bridge" ? "Conecte um vídeo público externo ao produto e leve o cliente para a origem." : "Cadastre conteúdo próprio com mídia, legenda e produto associado.";

  return (
    <div className="relative min-h-full overflow-hidden pb-12">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-80 bg-gradient-to-b from-primary/[0.08] via-primary/[0.025] to-transparent" />
      <div className="relative mx-auto max-w-6xl px-4 py-8 sm:py-10">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <Button variant="ghost" className="w-fit rounded-xl font-bold" onClick={onBack}>
            <ArrowLeft className="mr-2 h-4 w-4" /> {mode === "create" ? "Trocar formato" : "Voltar para vídeos"}
          </Button>
          <Badge variant="outline" className="w-fit gap-2 rounded-full border-primary/20 bg-primary/5 px-3 py-1.5 text-primary">
            <Sparkles className="h-3.5 w-3.5" /> {mode === "create" ? "Novo conteúdo" : "Edição"}
          </Badge>
        </div>
        <header className="mt-5 mb-6 overflow-hidden rounded-[2rem] border border-border/60 bg-card/75 p-6 shadow-elevation-1 backdrop-blur-xl sm:p-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 text-primary shadow-sm"><Clapperboard className="h-7 w-7" /></div>
            <div className="min-w-0"><div className="mb-1 text-[10px] font-black uppercase tracking-[0.2em] text-primary">Central de vídeos · {typeLabel}</div><h1 className="text-3xl font-black tracking-[-0.04em] sm:text-4xl">{mode === "create" ? "Novo vídeo" : "Editar vídeo"}</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">{typeDescription}</p></div>
          </div>
          <div className="mt-6 grid grid-cols-3 gap-2 sm:max-w-md">{[["01", "Formato", true],["02", "Conteúdo", true],["03", "Publicação", false]].map(([step,label,active]) => <div key={String(step)} className={`rounded-xl border px-3 py-2 ${active ? "border-primary/20 bg-primary/5" : "border-border/60 bg-background/40"}`}><div className={`text-[10px] font-black ${active ? "text-primary" : "text-muted-foreground"}`}>{step}</div><div className="mt-0.5 text-xs font-bold">{label}</div></div>)}</div>
        </header>
        <div className="overflow-hidden rounded-[2rem] border border-border/60 bg-card/60 shadow-elevation-1 backdrop-blur-xl">
          {type === "bridge" ? <BridgeVideoForm onBack={onBack} /> : <NativeVideoForm mode={mode} onBack={onBack} />}
        </div>
      </div>
    </div>
  );
}
