import { Copy, Send, Check } from "lucide-react";
import { useState } from "react";
import type { ShareTemplate, SharePlatform } from "@/lib/supabase/sharing";

export function buildShareCaption(template: ShareTemplate, values: { code: string; link: string; reward: string }) {
  const base = template.caption_template.replace(/{code}/g, values.code).replace(/{link}/g, values.link).replace(/{reward}/g, values.reward).replace(/{emoji}/g, "🎁");
  const tags = template.hashtags?.filter(Boolean).map((tag) => `#${tag.replace(/^#/, "")}`).join(" ");
  return tags && !base.includes(tags) ? `${base}\n\n${tags}` : base;
}

export function ShareCaption({ templates, values, selectedPlatform, onSelect, onShare }: { templates: ShareTemplate[]; values: { code: string; link: string; reward: string }; selectedPlatform: SharePlatform | null; onSelect: (platform: SharePlatform) => void; onShare: (platform: SharePlatform, caption: string) => void }) {
  const [copied, setCopied] = useState(false);
  const selected = templates.find((template) => template.platform === selectedPlatform);
  const caption = selected ? buildShareCaption(selected, values) : "";
  if (!templates.length) return null;
  const copy = async () => { await navigator.clipboard.writeText(caption); setCopied(true); window.setTimeout(() => setCopied(false), 1800); };
  return <section className="space-y-3"><p className="text-[9px] font-black uppercase tracking-[.2em] text-muted-foreground">Legenda otimizada</p><div className="flex flex-wrap gap-2">{templates.map((template) => <button key={template.id} type="button" onClick={() => onSelect(template.platform as SharePlatform)} className={`rounded-xl border px-3 py-2 text-[10px] font-black uppercase transition ${selectedPlatform === template.platform ? "border-primary bg-primary/10 text-primary" : "border-glass-border bg-glass"}`}>{template.platform}</button>)}</div>{selected && <div className="rounded-2xl border border-glass-border bg-black/20 p-4"><p className="whitespace-pre-wrap text-xs leading-6 text-muted-foreground">{caption}</p><div className="mt-4 flex gap-2"><button type="button" onClick={copy} className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-glass-border px-3 py-2 text-[10px] font-black uppercase">{copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}{copied ? "Copiada" : "Copiar"}</button><button type="button" onClick={() => onShare(selected.platform as SharePlatform, caption)} className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-3 py-2 text-[10px] font-black uppercase text-primary-foreground"><Send className="h-3.5 w-3.5" />Compartilhar</button></div></div>}</section>;
}
