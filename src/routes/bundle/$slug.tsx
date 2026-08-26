import { createFileRoute } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { useServerFn } from '@tanstack/react-start';
import { getBundleDetails } from '@/lib/relationships.functions';
import { ProductCard } from '@/components/product/ProductCard';
import { Badge } from '@/components/ui/badge';
import { Package, Sparkles, ArrowRight } from 'lucide-react';
import { CustomBreadcrumbs } from '@/components/layout/Breadcrumbs';

export const Route = createFileRoute('/bundle/$slug')({
  head: ({ params }) => {
    const nome = params.slug.replace(/-/g, ' ');
    return {
      meta: [
        { title: `Combo ${nome} — Kit de Ofertas` },
        { name: "description", content: `Kit combinado ${nome} com produtos selecionados e melhor custo-benefício.` },
        { property: "og:title", content: `Combo ${nome} — Kit de Ofertas` },
        { property: "og:description", content: `Kit combinado ${nome} com produtos selecionados e melhor custo-benefício.` },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
    };
  },
  component: BundlePage,
});

function BundlePage() {
  const { slug } = Route.useParams();
  const fetchBundle = useServerFn(getBundleDetails);

  const { data: bundle, isLoading } = useQuery({
    queryKey: ['bundle', slug],
    queryFn: () => fetchBundle({ data: slug }),
  });

  if (isLoading) {
    return (
      <div className="container mx-auto py-24 px-4 text-center">
        <div className="animate-pulse space-y-8">
          <div className="h-12 w-64 bg-muted mx-auto rounded-full" />
          <div className="h-24 w-full max-w-2xl bg-muted mx-auto rounded-3xl" />
        </div>
      </div>
    );
  }

  if (!bundle) {
    return (
      <div className="container mx-auto py-24 px-4 text-center">
        <h1 className="text-4xl font-black uppercase italic">Bundle Not Found</h1>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-12 px-4 max-w-7xl space-y-16">
      <CustomBreadcrumbs 
        items={[
          { label: 'Deals', to: '/deals' },
          { label: 'Bundles', to: '/feed' },
          { label: bundle.title }
        ]} 
      />

      <section className="relative py-20 px-8 rounded-[3rem] overflow-hidden bg-glass border border-glass-border shadow-2xl text-center">
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-primary/10 to-transparent" />
        <div className="max-w-3xl mx-auto space-y-8">
          <Badge className="px-5 py-2 rounded-full border-primary/30 bg-primary/5 text-primary glass-surface uppercase font-black tracking-widest text-xs">
            <Package className="w-4 h-4 mr-2" />
            Curated Collection
          </Badge>
          
          <h1 className="text-5xl md:text-8xl font-black tracking-[-0.07em] leading-[0.85] uppercase italic">
            {bundle.title}
          </h1>
          
          <p className="text-xl md:text-2xl text-muted-foreground leading-relaxed font-medium tracking-tight">
            {bundle.description}
          </p>
        </div>
      </section>

      <div className="space-y-12">
        <div className="flex items-center gap-4 border-b border-glass-border pb-6">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-2xl font-black uppercase italic tracking-tighter">Included Products</h2>
            <p className="text-[10px] text-muted-foreground font-black uppercase tracking-[0.2em]">Verified high-fidelity selection</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {bundle.products?.map(({ product, position }: any) => (
            <ProductCard 
              key={product.id}
              id={product.id}
              slug={product.slug}
              categoryId={product.category_id}
              title={product.title}
              price={product.current_price}
              previousPrice={product.previous_price}
              discount={product.discount}
              image={product.images?.[0]}
              marketplace={product.marketplace_id || 'Marketplace'} // Should join marketplace name in real usage
              rating={product.rating}
              reviewCount={product.review_count}
              affiliateUrl={product.affiliate_url}
              hasVideo={false}
            />
          ))}
        </div>
      </div>

      <section className="py-20 border-t border-glass-border text-center space-y-8">
        <h3 className="text-2xl font-black uppercase italic tracking-tighter text-muted-foreground">Each product maintains its individual secure protocol</h3>
        <p className="max-w-2xl mx-auto text-muted-foreground font-medium">Clicking on any product will redirect you via our secure encrypted affiliate gateway to the respective marketplace.</p>
      </section>
    </div>
  );
}
