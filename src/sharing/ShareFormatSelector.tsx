import { Smartphone, Square } from "lucide-react";
import type { ShareFormat } from "@/lib/supabase/sharing";

export function ShareFormatSelector({ selected, onSelect }: { selected: ShareFormat; onSelect: (format: ShareFormat) => void }) {
  return <div className="space-y-2"><p className="text-[9px] font-black uppercase tracking-[.2em] text-muted-foreground">Formato do card</p><div className="grid grid-cols-2 gap-2">
    <button type="button" onClick={() => onSelect("9_16")} className={`rounded-2xl border p-3 text-left transition ${selected === "9_16" ? "border-primary bg-primary/10" : "border-glass-border bg-glass hover:bg-white/5"}`}><Smartphone className="mb-2 h-4 w-4 text-primary" /><span className="block text-xs font-black">Stories 9:16</span><span className="text-[9px] text-muted-foreground">TikTok · Reels · Kwai</span></button>
    <button type="button" onClick={() => onSelect("1_1")} className={`rounded-2xl border p-3 text-left transition ${selected === "1_1" ? "border-primary bg-primary/10" : "border-glass-border bg-glass hover:bg-white/5"}`}><Square className="mb-2 h-4 w-4 text-primary" /><span className="block text-xs font-black">Feed 1:1</span><span className="text-[9px] text-muted-foreground">Instagram · Feed</span></button>
  </div></div>;
}
