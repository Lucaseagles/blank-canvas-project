import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AlertCircle, Check, Copy, ExternalLink, Tag } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/my-coupons")({ component: MyCouponsPage });

type Coupon = {
  id: string; code: string; description: string | null; discount_type: string;
  discount_value: number; valid_until: string | null; marketplace_id: string;
  product_id: string | null; marketplaces?: { name?: string; icon?: string | null } | null;
  products?: { title?: string; slug?: string | null } | null;
};

function MyCouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => { void loadCoupons(); }, []);

  async function loadCoupons() {
    setLoading(true);
    const client = supabase as any;
    const { data, error } = await client.from("customer_coupons")
      .select("*, marketplaces:marketplace_id(name, icon), products:product_id(title, slug)")
      .eq("is_active", true).eq("is_real", true)
      .lte("valid_from", new Date().toISOString())
      .or(`valid_until.is.null,valid_until.gte.${new Date().toISOString()}`)
      .order("valid_until", { ascending: true, nullsFirst: false });
    if (error) console.error("Erro ao carregar cupons:", error);
    setCoupons(data ?? []);
    setLoading(false);
  }

  async function copyCode(code: string) {
    try { await navigator.clipboard.writeText(code); setCopied(code); window.setTimeout(() => setCopied(null), 2000); }
    catch { /* clipboard can be unavailable in insecure contexts */ }
  }

  const discount = (coupon: Coupon) => coupon.discount_type === "percentage"
    ? `${coupon.discount_value}% OFF`
    : `R$ ${Number(coupon.discount_value).toFixed(2).replace(".", ",")} OFF`;

  if (loading) return <div className="container mx-auto min-h-[70vh] px-4 py-16 flex flex-col items-center justify-center gap-4"><div className="h-10 w-10 rounded-full border-4 border-primary/20 border-t-primary animate-spin" /><p className="text-sm text-muted-foreground">Carregando seus cupons...</p></div>;

  return <div className="container mx-auto max-w-7xl px-4 py-10 sm:py-14 min-h-[70vh] space-y-8">
    <header><div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1.5 text-xs font-black uppercase tracking-wider text-primary"><Tag className="h-4 w-4" /> Carteira de cupons</div><h1 className="mt-4 text-4xl sm:text-5xl font-black tracking-tight">Meus Cupons</h1><p className="mt-2 text-muted-foreground">Códigos promocionais reais disponíveis para você.</p></header>
    {coupons.length === 0 ? <Card className="rounded-[2rem] border-glass-border bg-glass"><CardContent className="p-12 text-center"><Tag className="mx-auto h-12 w-12 text-muted-foreground" /><h2 className="mt-5 text-xl font-black">Nenhum cupom disponível</h2><p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">Ainda não temos cupons exclusivos ativos. Assim que houver cupons reais e válidos, eles aparecerão aqui.</p><div className="mt-5 inline-flex items-center gap-2 rounded-xl bg-muted/50 px-4 py-3 text-xs text-muted-foreground"><AlertCircle className="h-4 w-4" />Somente cupons confirmados como reais são exibidos.</div></CardContent></Card> : <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">{coupons.map(coupon => {
      const expires = coupon.valid_until ? new Date(coupon.valid_until) : null;
      const soon = expires ? expires.getTime() <= Date.now() + 3 * 86400000 : false;
      return <Card key={coupon.id} className="overflow-hidden rounded-[2rem] border-glass-border bg-glass backdrop-blur-xl"><CardContent className="p-0"><div className="border-b border-border/60 p-5"><div className="flex items-start justify-between gap-3"><div className="flex items-center gap-2 font-bold"><span>{coupon.marketplaces?.icon || "🛍️"}</span><span>{coupon.marketplaces?.name || "Marketplace"}</span></div>{soon && <span className="rounded-full bg-destructive/10 px-2.5 py-1 text-[10px] font-black uppercase text-destructive">Expira em breve</span>}</div></div><div className="space-y-5 p-5"><div><span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Código</span><div className="mt-2 flex items-center gap-2 rounded-2xl border border-dashed border-primary/30 bg-primary/5 p-2"><code className="min-w-0 flex-1 truncate px-2 font-black tracking-widest">{coupon.code}</code><Button size="sm" variant="secondary" onClick={() => void copyCode(coupon.code)}>{copied === coupon.code ? <><Check className="mr-1.5 h-4 w-4" />Copiado</> : <><Copy className="mr-1.5 h-4 w-4" />Copiar</>}</Button></div></div><div><div className="text-2xl font-black text-primary">{discount(coupon)}</div>{coupon.description && <p className="mt-1 text-sm text-muted-foreground">{coupon.description}</p>}</div>{coupon.products?.slug && <a href={`/product/${coupon.products.slug}`} className="inline-flex items-center gap-1.5 text-sm font-bold text-primary hover:underline"><ExternalLink className="h-4 w-4" />Ver produto</a>}<div className="border-t border-border/60 pt-4 text-xs text-muted-foreground">{expires ? `Válido até ${expires.toLocaleDateString("pt-BR")}` : "Validade não informada"}</div></div></CardContent></Card>;
    })}</div>}
    <div className="flex items-start gap-2 rounded-2xl border border-border/60 bg-muted/30 p-4 text-xs text-muted-foreground"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />Os cupons desta carteira são publicados somente após confirmação de que são reais e oficiais do marketplace.</div>
  </div>;
}
