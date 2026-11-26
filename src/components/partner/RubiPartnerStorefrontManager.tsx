import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Copy, ExternalLink, Store } from "lucide-react";

export function RubiPartnerStorefrontManager({ storeCode }: { storeCode: string | null }) {
  const [copied, setCopied] = useState(false);
  const url = storeCode ? `/loja/${storeCode}` : null;

  const copy = async () => {
    if (!url) return;
    try {
      await navigator.clipboard.writeText(new URL(url, window.location.origin).toString());
      setCopied(true);
      toast.success("Link da sua vitrine copiado.");
    } catch {
      setCopied(false);
      toast.error("Não foi possível copiar automaticamente. Abra a vitrine e copie o endereço do navegador.");
    }
  };

  return <section aria-label="Minha vitrine pública RUBI" className="overflow-hidden rounded-3xl border border-primary/25 bg-gradient-to-br from-primary/10 via-card to-background p-5 sm:p-7">
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="flex items-start gap-3">
        <div className="rounded-2xl border bg-background p-3"><Store className="h-6 w-6 text-primary"/></div>
        <div className="space-y-1">
          <p className="text-xs font-black uppercase tracking-widest text-primary">Sua operação comercial</p>
          <h2 className="text-2xl font-black">Minha vitrine RUBI</h2>
          <p className="max-w-xl text-sm leading-6 text-muted-foreground">Compartilhe uma única página com seus produtos autorizados. Cada produto mantém seu próprio link rastreável até a oferta e o checkout aprovado.</p>
        </div>
      </div>
      <span className="rounded-full border bg-background px-3 py-1.5 text-xs font-bold">Vitrine individual</span>
    </div>
    {url && storeCode ? <div className="mt-5 flex flex-col gap-3 rounded-2xl border bg-background/80 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">Endereço público da sua loja</p>
        <p className="mt-1 break-all text-sm font-bold">{typeof window === "undefined" ? url : new URL(url, window.location.origin).toString()}</p>
      </div>
      <div className="flex shrink-0 flex-wrap gap-2">
        <Button type="button" onClick={() => void copy()}><Copy className="mr-2 h-4 w-4"/>{copied ? "Copiado" : "Copiar link"}</Button>
        <Button asChild type="button" variant="outline"><Link to="/loja/$storeCode" params={{ storeCode }}><ExternalLink className="mr-2 h-4 w-4"/>Visualizar</Link></Button>
        <Button asChild type="button" variant="outline"><Link to="/creator/$storeCode" params={{ storeCode }}><ExternalLink className="mr-2 h-4 w-4"/>Perfil de criador</Link></Button>
      </div>
    </div> : <p className="mt-5 rounded-2xl border bg-background p-4 text-sm text-muted-foreground">Seu endereço público será disponibilizado após a atualização da base de cadastro e a aprovação do parceiro.</p>}
  </section>;
}
