import { useQuery } from "@tanstack/react-query";
import { Instagram, Send, Video, PlayCircle, ExternalLink } from "lucide-react";
import { getActiveSocialChannels, trackFollowIntent } from "@/lib/social-cross-promo.functions";
import { Button } from "@/components/ui/button";

const icons = { tiktok: Video, instagram: Instagram, kwai: PlayCircle, telegram: Send, youtube: PlayCircle } as const;

type SocialChannel = { id: string; platform: keyof typeof icons; channel_name: string; channel_url: string; icon: string | null; is_active: boolean; created_at: string | null };

export function VideoSocialMilestone() {
  const { data: channels = [] } = useQuery<SocialChannel[]>({ queryKey: ["active-social-channels"], queryFn: getActiveSocialChannels as () => Promise<SocialChannel[]> });
  const channel = channels.find((item) => item.platform === "tiktok") ?? channels[0];
  if (!channel) return null;
  const Icon = icons[channel.platform] ?? ExternalLink;

  return (
    <aside className="mx-auto w-[min(92vw,34rem)] rounded-2xl border border-white/10 bg-black/45 p-3 backdrop-blur-xl shadow-2xl">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/10 text-white"><Icon className="h-4 w-4" /></div>
        <div className="min-w-0 flex-1"><p className="text-[10px] font-black uppercase tracking-widest text-white/50">Curtiu o conteúdo?</p><p className="truncate text-xs font-bold text-white">Siga nosso canal para mais descobertas.</p></div>
        <Button size="sm" className="h-9 rounded-xl bg-white text-black hover:bg-white/90" onClick={() => { void trackFollowIntent({ data: { platform: channel.platform, exposurePoint: "video_feed", channelId: channel.id } }); window.open(channel.channel_url, "_blank", "noopener,noreferrer"); }}>Seguir <ExternalLink className="ml-1 h-3 w-3" /></Button>
      </div>
      <p className="mt-2 text-[9px] text-white/40">Clique de intenção registrado. O app não confirma seguidores externos.</p>
    </aside>
  );
}
