import { createFileRoute } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ProductCard } from '@/components/product/ProductCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Globe } from 'lucide-react';
import { CustomBreadcrumbs } from '@/components/layout/Breadcrumbs';
import { CategoryHighlightsSection } from '@/components/product/CategoryHighlightsSection';


export const Route = createFileRoute('/category/$slug')({
  head: ({ params }) => {
    const nome = params.slug.replace(/-/g, ' ');
    return {
      meta: [
        { title: `${nome} — Ofertas da Categoria` },
        { name: "description", content: `As melhores ofertas de ${nome} selecionadas automaticamente por pontuação de oferta.` },
        { property: "og:title", content: `${nome} — Ofertas da Categoria` },
        { property: "og:description", content: `As melhores ofertas de ${nome} selecionadas automaticamente por pontuação de oferta.` },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
    };
  },
  component: CategoryPage,
});

function CategoryPage() {
  const { slug } = Route.useParams();

  const { data: category } = useQuery({
    queryKey: ['category-info', slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('slug', slug)
        .single();
      if (error) throw error;
      return data;
    },
  });

  const { data: products, isLoading } = useQuery({
    queryKey: ['category-products', slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*, marketplaces(name), video_products(id)')
        .eq('category_id', category?.id as string);
      
      if (error) throw error;
      
      return data.map(p => ({
        id: p.id,
        slug: (p as any).slug || "",
        title: p.title,
        price: p.current_price,
        previousPrice: p.previous_price,
        discount: p.discount,
        image: p.images?.[0] || "",
        marketplace: (p.marketplaces as any)?.name || "External",
        rating: p.rating,
        reviewCount: p.review_count,
        affiliateUrl: p.affiliate_url || null,
        hasVideo: p.video_products && p.video_products.length > 0
      }));
    },
    enabled: !!category?.id,
  });

  return (
    <div className="container mx-auto py-20 px-4 max-w-7xl reveal-on-scroll">
      <CustomBreadcrumbs 
        items={[
          { label: 'Categories', to: '/products' },
          { label: category?.name || slug.replace(/-/g, ' ') }
        ]} 
      />
      <div className="mb-16 space-y-4">
        <Badge variant="outline" className="px-5 py-2 rounded-full border-primary/30 bg-primary/5 text-primary glass-surface mb-4">
          <Globe className="w-3.5 h-3.5 mr-2" />
          CLASSIFICAÇÃO DE SETOR ATIVA
        </Badge>
        <h1 className="text-6xl md:text-8xl font-black tracking-tighter uppercase italic leading-none">
          {category?.name || slug.replace(/-/g, ' ')}
        </h1>
        <p className="text-xl text-muted-foreground font-medium tracking-tight border-l-2 border-primary/20 pl-6 max-w-2xl">
          Navegue pelas melhores ofertas verificadas em {category?.name || 'esta categoria'}. Análise heurística ativa para este nó.
        </p>
      </div>
      
      {/* Category Highlights (Top 3 by Score) */}
      <CategoryHighlightsSection 
        categoryId={category?.id || undefined} 
        categoryName={category?.name || undefined} 
        limit={3} 
      />


      {isLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="space-y-4">
              <Skeleton className="aspect-square w-full rounded-2xl" />
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ))}
        </div>
      ) : products?.length ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {products.map((product) => (
            <ProductCard 
              key={product.id} 
              id={product.id}
              slug={product.slug}
              title={product.title}
              price={product.price ?? 0}
              previousPrice={product.previousPrice}
              discount={product.discount}
              image={product.image}
              marketplace={product.marketplace}
              rating={product.rating}
              reviewCount={product.reviewCount}
              affiliateUrl={product.affiliateUrl ?? null}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-24 bg-muted/20 rounded-3xl border border-dashed border-muted-foreground/20">
          <p className="text-muted-foreground">Nenhum produto encontrado nesta categoria ainda.</p>
        </div>
      )}
    </div>
  );
}
