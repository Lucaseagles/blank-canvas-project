import { useQuery } from "@tanstack/react-query";
import { ExternalLink, Instagram, Send, Video, PlayCircle } from "lucide-react";
import { getActiveSocialChannels, trackFollowIntent } from "@/lib/social-cross-promo.functions";
import { Button } from "@/components/ui/button";

const icons = { tiktok: Video, instagram: Instagram, kwai: PlayCircle, telegram: Send, youtube: PlayCircle } as const;
const labels = { tiktok: "TikTok", instagram: "Instagram", kwai: "Kwai", telegram: "Telegram", youtube: "YouTube" } as const;
export type SocialExposurePoint = "profile" | "video_feed" | "post_affiliate" | "campaign" | "gamification";

export function SocialChannels({ exposurePoint = "profile", compact = false }: { exposurePoint?: SocialExposurePoint; compact?: boolean }) {
  const { data: channels = [], isLoading } = useQuery({ queryKey: ["active-social-channels"], queryFn: () => getActiveSocialChannels() });
  if (isLoading || channels.length === 0) return null;
  return <section className={compact ? "space-y-3" : "rounded-2xl border border-glass-border bg-glass/40 backdrop-blur-xl p-5 space-y-4"}>
    <div><h3 className="text-sm font-black uppercase tracking-widest">Siga nossos canais</h3><p className="text-xs text-muted-foreground mt-1">Conteúdo novo e novidades fora do app.</p></div>
    <div className="flex flex-wrap gap-2">
      {channels.map((channel: any) => {
        const Icon = icons[channel.platform as keyof typeof icons] ?? ExternalLink;
        const label = labels[channel.platform as keyof typeof labels] ?? channel.channel_name;
        return <Button key={channel.id} variant="outline" size="sm" className="rounded-xl gap-2 border-glass-border" onClick={() => { void trackFollowIntent({ data: { platform: channel.platform, exposurePoint, channelId: channel.id } }); window.open(channel.channel_url, "_blank", "noopener,noreferrer"); }} aria-label={`Abrir canal ${label}`}><Icon className="h-4 w-4" />{compact ? label : channel.channel_name}<ExternalLink className="h-3 w-3 opacity-50" /></Button>;
      })}
    </div>
    <p className="text-[10px] text-muted-foreground/70">O app registra apenas o clique de intenção; o acompanhamento na plataforma externa acontece fora do nosso controle.</p>
  </section>;
}
