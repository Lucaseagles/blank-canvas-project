import { Download } from "lucide-react";
import { ShareCardCanvas } from "./ShareCardCanvas";
import type { ShareCardConfig, ShareFormat } from "@/lib/supabase/sharing";

export function ShareCardGenerator(props: { referralCode: string; referralLink: string; userName: string; reward: string; format: ShareFormat; config: ShareCardConfig | null; onGenerated: (dataUrl: string) => void; image: string | null }) {
  const { referralCode, referralLink, userName, reward, format, config, onGenerated, image } = props;
  const download = () => { if (!image) return; const anchor = document.createElement("a"); anchor.href = image; anchor.download = `convite-${format}-${referralCode}.png`; anchor.click(); };
  return <div className="space-y-3"><div className="grid place-items-center overflow-hidden rounded-[2rem] border border-glass-border bg-black/30 p-3 min-h-72"><ShareCardCanvas referralCode={referralCode} referralLink={referralLink} userName={userName} reward={reward} format={format} config={config} onGenerated={onGenerated} />{image ? <img src={image} alt="Prévia do card de indicação" className={`max-h-[55vh] w-auto rounded-xl object-contain shadow-2xl ${format === "1_1" ? "aspect-square max-w-full" : "max-w-[280px]"}`} /> : <div className="py-20 text-sm font-bold text-muted-foreground">Gerando seu card…</div>}</div><button type="button" onClick={download} disabled={!image} className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 text-xs font-black uppercase tracking-wider text-primary-foreground disabled:opacity-40"><Download className="h-4 w-4" />Baixar imagem</button></div>;
}
