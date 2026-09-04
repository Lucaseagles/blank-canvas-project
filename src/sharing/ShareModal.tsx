import { Copy, Link2, Share2, X, Check } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { ShareCardGenerator } from "./ShareCardGenerator";
import { ShareCaption } from "./ShareCaption";
import { ShareFormatSelector } from "./ShareFormatSelector";
import { SharePlatformButtons } from "./SharePlatformButtons";
import { useSharing } from "@/hooks/useSharing";
import type { ShareFormat, SharePlatform } from "@/lib/supabase/sharing";

interface Props { isOpen: boolean; onClose: () => void; referralCode: string; referralLink: string; userName: string; reward: string; userId?: string | null; }

export function ShareModal({ isOpen, onClose, referralCode, referralLink, userName, reward, userId }: Props) {
  const [format, setFormat] = useState<ShareFormat>("9_16");
  const [platform, setPlatform] = useState<SharePlatform | null>("whatsapp");
  const [image, setImage] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const { templates, config, loading, logShare, buildCaption } = useSharing(userId);
  useEffect(() => { if (!isOpen) { setImage(null); setCopied(false); } }, [isOpen]);
  const activePlatforms = useMemo(() => templates.map((template) => template.platform), [templates]);
  if (!isOpen) return null;
  const copyLink = async () => { await navigator.clipboard.writeText(referralLink); setCopied(true); window.setTimeout(() => setCopied(false), 1800); };
  const share = async (target: SharePlatform, caption?: string) => {
    const template = templates.find((item) => item.platform === target);
    const text = caption ?? (template ? buildCaption(template, { code: referralCode, link: referralLink, reward, userName }) : referralLink);
    setPlatform(target);
    await logShare({ referralCode, platform: target, format });
    if (target === "whatsapp") window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank", "noopener,noreferrer");
    else if (target === "telegram") window.open(`https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${encodeURIComponent(text)}`, "_blank", "noopener,noreferrer");
    else await navigator.clipboard.writeText(text);
  };
  return <div className="fixed inset-0 z-[100] grid place-items-center bg-black/70 p-3 backdrop-blur-md" role="dialog" aria-modal="true" aria-label="Compartilhar indicação" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><div className="flex max-h-[94vh] w-full max-w-2xl flex-col overflow-hidden rounded-[2rem] border border-glass-border bg-background shadow-2xl"><header className="flex items-center justify-between border-b border-glass-border p-5"><div><p className="text-[9px] font-black uppercase tracking-[.25em] text-primary">Referral Studio</p><h2 className="mt-1 text-xl font-black uppercase italic tracking-tight">Compartilhar e convidar</h2></div><button type="button" onClick={onClose} className="rounded-xl border border-glass-border p-2" aria-label="Fechar"><X className="h-4 w-4" /></button></header><div className="overflow-y-auto p-4 sm:p-6 space-y-5">{loading ? <div className="rounded-2xl border border-glass-border p-10 text-center text-sm font-bold text-muted-foreground">Preparando seu convite…</div> : <><ShareCardGenerator referralCode={referralCode} referralLink={referralLink} userName={userName} reward={reward} format={format} config={config} onGenerated={setImage} image={image} /><ShareFormatSelector selected={format} onSelect={setFormat} /><div className="flex gap-2"><button type="button" onClick={copyLink} className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-glass-border px-4 py-3 text-[10px] font-black uppercase">{copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}{copied ? "Link copiado" : "Copiar link"}</button><div className="inline-flex items-center gap-2 rounded-xl border border-glass-border px-4 py-3 text-[10px] font-black uppercase text-muted-foreground"><Link2 className="h-4 w-4" />24h</div></div><ShareCaption templates={templates} values={{ code: referralCode, link: referralLink, reward }} selectedPlatform={platform} onSelect={(value) => setPlatform(value)} onShare={share} /><div className="space-y-2"><p className="text-[9px] font-black uppercase tracking-[.2em] text-muted-foreground">Atalhos</p><SharePlatformButtons activePlatforms={activePlatforms} onShare={share} /></div></>}</div><footer className="border-t border-glass-border p-4 text-center text-[9px] font-bold uppercase tracking-widest text-muted-foreground"><Share2 className="mr-1 inline h-3 w-3" /> Seu código: {referralCode}</footer></div></div>;
}
