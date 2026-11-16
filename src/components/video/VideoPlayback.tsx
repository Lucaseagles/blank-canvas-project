import { ExternalLink } from "lucide-react";
import { VideoPlayer } from "@/components/video/VideoPlayer";
import { resolveRubiVideoPlayback } from "@/lib/rubi-video-playback";
import { Button } from "@/components/ui/button";

interface VideoPlaybackProps {
  src?: string | null;
  poster?: string | null;
  title: string;
  className?: string;
  autoPlay?: boolean;
  loop?: boolean;
  onStart?: () => void;
  onComplete?: () => void;
}

const providerNames: Record<string, string> = {
  youtube: "YouTube", tiktok: "TikTok", instagram: "Instagram",
  shopee: "Shopee", kwai: "Kwai", shein: "SHEIN",
  mercado_livre: "Mercado Livre", external: "plataforma externa",
};

export function VideoPlayback({ src, poster, title, className, autoPlay = false, loop = true, onStart, onComplete }: VideoPlaybackProps) {
  const playback = resolveRubiVideoPlayback(src);

  if (playback.kind === "native") {
    return <VideoPlayer src={playback.src} poster={poster ?? undefined} className={className} autoPlay={autoPlay} loop={loop} onStart={onStart} onComplete={onComplete} />;
  }
  if (playback.kind === "embed") {
    return (
      <div className={`relative aspect-[9/16] w-full overflow-hidden bg-black ${className ?? ""}`}>
        <iframe src={playback.src} title={`Vídeo: ${title}`} loading="lazy"
          allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen referrerPolicy="strict-origin-when-cross-origin"
          className="absolute inset-0 h-full w-full border-0" />
      </div>
    );
  }
  if (playback.kind === "external") {
    return (
      <div className={`relative flex aspect-[9/16] w-full flex-col items-center justify-center overflow-hidden bg-black text-center ${className ?? ""}`}>
        {poster && <img src={poster} alt="" loading="lazy" decoding="async" className="absolute inset-0 h-full w-full object-cover opacity-45" />}
        <div className="relative z-10 flex max-w-xs flex-col items-center gap-4 px-6">
          <ExternalLink className="h-12 w-12 text-white" />
          <p className="text-sm font-bold text-white">Este vídeo é reproduzido na plataforma de origem.</p>
          <Button asChild className="min-h-11 rounded-full font-bold">
            <a href={playback.href} target="_blank" rel="noopener noreferrer">Assistir no {providerNames[playback.provider]}</a>
          </Button>
        </div>
      </div>
    );
  }
  return <div className={`flex aspect-[9/16] w-full items-center justify-center bg-black px-6 text-center text-sm text-white/70 ${className ?? ""}`}>A origem deste vídeo ainda não possui um endereço de reprodução válido.</div>;
}
