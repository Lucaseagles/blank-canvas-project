import { useState } from "react";
import { Copy, Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  RUBI_ORGANIC_CHANNELS, normalizeRubiCampaign, rubiOrganicProductPath,
  type RubiOrganicChannel,
} from "@/lib/rubi-organic-campaigns";

/** Owner-only editorial link generator. Produces no affiliate commission. */
export function RubiOrganicLinkBuilder({
  products,
}: {
  products: Array<{ id: string; title: string; active: boolean; checkout_verified: boolean; checkout_url: string | null }>;
}) {
  const [productId, setProductId] = useState("");
  const [channel, setChannel] = useState<RubiOrganicChannel>("instagram");
  const [campaign, setCampaign] = useState("lancamento-rubi");
  const [copied, setCopied] = useState(false);
  const available = products.filter(item => item.active && item.checkout_verified && !!item.checkout_url);
  const selected = available.some(item => item.id === productId) ? productId : "";
  const campaignSlug = normalizeRubiCampaign(campaign);
  const path = selected && campaignSlug ? rubiOrganicProductPath(selected, channel, campaignSlug) : "";
  const copy = async () => {
    if (!path) return;
    try {
      await navigator.clipboard.writeText(new URL(path, window.location.origin).toString());
      setCopied(true);
      toast.success("Link de campanha copiado.");
    } catch {
      toast.error("O navegador não permitiu copiar. Confira as permissões.");
    }
  };
  return <section aria-label="Gerador de links orgânicos RUBI 11×" className="space-y-4 rounded-3xl border border-primary/25 bg-card/80 p-6">
    <div className="space-y-2">
      <h2 className="flex items-center gap-2 text-2xl font-black"><Link2 className="h-5 w-5 text-primary" />Links orgânicos por produto</h2>
      <p className="text-sm text-muted-foreground">
        Prepare URLs rastreáveis para Reels, TikTok, Shorts e comunidades. O link leva diretamente ao pré-checkout RUBI.
        UTM identifica origem editorial — não cria venda, pedido ou comissão de afiliado.
      </p>
    </div>
    <div className="grid gap-4 sm:grid-cols-3">
      <label className="space-y-2 text-sm font-medium">Produto próprio aprovado
        <select className="block h-10 w-full rounded-md border bg-background px-3" value={selected} onChange={e => { setProductId(e.target.value); setCopied(false); }}>
          <option value="">Selecione um produto publicado</option>
          {available.map(item => <option value={item.id} key={item.id}>{item.title}</option>)}
        </select>
      </label>
      <label className="space-y-2 text-sm font-medium">Canal
        <select className="block h-10 w-full rounded-md border bg-background px-3" value={channel} onChange={e => { setChannel(e.target.value as RubiOrganicChannel); setCopied(false); }}>
          {RUBI_ORGANIC_CHANNELS.map(item => <option value={item.id} key={item.id}>{item.label}</option>)}
        </select>
      </label>
      <label className="space-y-2 text-sm font-medium">Identificador da campanha
        <Input maxLength={60} value={campaign} onChange={e => { setCampaign(e.target.value); setCopied(false); }} placeholder="ex: casa-novembro" />
      </label>
    </div>
    <p className="text-xs text-muted-foreground">Exemplo: um vídeo de Beleza pode usar a campanha beleza-novembro, enquanto um vídeo de Casa usa casa-novembro. Não reutilize links de parceiros aqui.</p>
    {path ? <div className="flex flex-wrap items-center gap-3 rounded-xl border bg-background p-3">
      <code className="min-w-0 flex-1 break-all text-xs">{path}</code>
      <Button type="button" size="sm" variant="outline" onClick={() => void copy()}><Copy className="mr-2 h-4 w-4" />{copied ? "Copiar novamente" : "Copiar link"}</Button>
    </div> : <p className="text-sm text-muted-foreground">Selecione um produto aprovado e uma campanha válida para gerar o link.</p>}
    {available.length === 0 && <p className="text-sm text-muted-foreground">Ainda não há produtos com checkout aprovado. O gerador ficará disponível assim que os links reais do fornecedor forem cadastrados e validados.</p>}
  </section>;
}
