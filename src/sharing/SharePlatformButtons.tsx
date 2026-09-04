import { Instagram, MessageCircle, Music2, Send, Smartphone } from "lucide-react";
import type { SharePlatform } from "@/lib/supabase/sharing";

const platforms: Array<{ id: SharePlatform; label: string; Icon: typeof Instagram }> = [
  { id: "instagram", label: "Instagram", Icon: Instagram },
  { id: "tiktok", label: "TikTok", Icon: Music2 },
  { id: "kwai", label: "Kwai", Icon: Smartphone },
  { id: "telegram", label: "Telegram", Icon: Send },
  { id: "whatsapp", label: "WhatsApp", Icon: MessageCircle },
];

export function SharePlatformButtons({ activePlatforms, onShare }: { activePlatforms: string[]; onShare: (platform: SharePlatform) => void }) {
  const visible = platforms.filter((platform) => activePlatforms.includes(platform.id));
  if (!visible.length) return null;
  return <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">{visible.map(({ id, label, Icon }) => <button key={id} type="button" onClick={() => onShare(id)} className="group rounded-2xl border border-glass-border bg-glass p-3 text-center transition hover:-translate-y-0.5 hover:border-primary/40"><Icon className="mx-auto h-5 w-5 text-primary" /><span className="mt-2 block text-[10px] font-black uppercase">{label}</span><span className="mt-1 block text-[8px] text-muted-foreground group-hover:text-primary">Compartilhar</span></button>)}</div>;
}
