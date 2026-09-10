import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { ShoppingBag, Sparkles, Tag } from "lucide-react";
import { ProductCard, type ProductCardProps } from "@/components/product/ProductCard";
import { supabase } from "@/integrations/supabase/client";

type OfferGroup = { id: string; is_featured_on_hub: boolean; featured_priority: number | null; featured_starts_at: string | null; featured_ends_at: string | null };
type ProductRow = { id: string; slug: string | null; title: string; current_price: number | null; previous_price: number | null; discount_percentage: number | null; image_url: string | null; marketplace_id: string | null; category_id: string | null; rating: number | null; review_count: number | null; offer_score: number | null };

export const Route = createFileRoute("/offers")({ component: OffersPage });

function mapProduct(p: ProductRow, marketplace = "Marketplace"): ProductCardProps {
  return { id: p.id, slug: p.slug ?? p.id, categoryId: p.category_id, title: p.title, price: p.current_price ?? 0, previousPrice: p.previous_price, discount: p.discount_percentage, image: p.image_url ?? "", marketplace, rating: p.rating, reviewCount: p.review_count ?? 0, offerScore: p.offer_score ?? 0 } as ProductCardProps;
}

function OfferSection({ icon, title, products, trailing }: { icon: ReactNode; title: string; products: ProductCardProps[]; trailing?: ReactNode }) {
  return <section className="space-y-5"><div className="flex flex-wrap items-center justify-between gap-3"><div className="flex items-center gap-3"><span className="text-primary">{icon}</span><h2 className="text-2xl font-black tracking-tight uppercase italic md:text-3xl">{title}</h2></div>{trailing}</div><div className="grid grid-cols-2 gap-5 lg:grid-cols-4">{products.map((product) => <ProductCard key={`${title}-${product.id}`} {...product} />)}</div></section>;
}

function OffersPage() {
  const [products, setProducts] = useState<ProductCardProps[]>([]); const [loading, setLoading] = useState(true); const [error, setError] = useState<string | null>(null);
  useEffect(() => { void loadOffers(); }, []);
  async function loadOffers() {
    setLoading(true); setError(null);
    const client = supabase as any;
    const { data: groups, error: groupsError } = await client.from("offer_groups").select("id, is_featured_on_hub, featured_priority, featured_starts_at, featured_ends_at").eq("is_featured_on_hub", true).order("featured_priority", { ascending: true });
    if (groupsError) { setError(groupsError.message); setLoading(false); return; }
    const groupIds = (groups as OfferGroup[] ?? []).map((g) => g.id);
    let query = client.from("products").select("id, slug, title, current_price, previous_price, discount_percentage, image_url, marketplace_id, category_id, rating, review_count, offer_score").eq("status", "published").limit(100);
    if (groupIds.length) query = query.in("offer_group_id", groupIds);
    const { data, error: productsError } = await query;
    if (productsError) { setError(productsError.message); setLoading(false); return; }
    setProducts((data as ProductRow[] ?? []).map((p) => mapProduct(p)));
    setLoading(false);
  }
  if (loading) return <div className="container mx-auto flex min-h-[60vh] items-center justify-center"><p className="text-muted-foreground">Carregando ofertas...</p></div>;
  if (error) return <div className="container mx-auto min-h-[60vh] py-16 text-center"><Tag className="mx-auto h-10 w-10 text-destructive" /><h1 className="mt-4 text-2xl font-black">Não foi possível carregar as ofertas</h1><p className="mt-2 text-sm text-muted-foreground">{error}</p></div>;
  return <main className="container mx-auto max-w-7xl space-y-10 px-4 py-10"><header><div className="flex items-center gap-3"><ShoppingBag className="h-7 w-7 text-primary" /><h1 className="text-4xl font-black uppercase italic">Ofertas</h1></div><p className="mt-2 text-muted-foreground">As melhores oportunidades selecionadas.</p></header>{products.length ? <OfferSection icon={<Sparkles className="h-6 w-6" />} title="Destaques" products={products} /> : <div className="rounded-3xl border border-dashed p-12 text-center"><Tag className="mx-auto h-10 w-10 text-muted-foreground" /><h2 className="mt-4 text-xl font-black">Nenhuma oferta disponível</h2></div>}</main>;
}
