import { createFileRoute } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { getFavorites } from '@/lib/engagement.functions';
import { ProductCard } from '@/components/product/ProductCard';
import { Badge } from '@/components/ui/badge';
import { Heart, Search, Sparkles } from 'lucide-react';
import { useServerFn } from '@tanstack/react-start';
import { supabase } from '@/integrations/supabase/client';
import { useEffect, useState } from 'react';
import { Link } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';

export const Route = createFileRoute('/favorites')({
  head: () => ({
    meta: [
      { title: "Favoritos — Seu Cofre de Ofertas" },
      { name: "description", content: "Salve produtos e acompanhe variações de preço em um só lugar, sincronizado na sua conta." },
      { property: "og:title", content: "Favoritos — Seu Cofre de Ofertas" },
      { property: "og:description", content: "Salve produtos e acompanhe variações de preço em um só lugar, sincronizado na sua conta." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: FavoritesPage,
});

function FavoritesPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const getFavsFn = useServerFn(getFavorites);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setUserId(user.id);
    });
  }, []);

  const { data: favorites, isLoading } = useQuery({
    queryKey: ['favorites', userId],
    queryFn: () => getFavsFn({ data: {} }),
    enabled: !!userId,
  });

  if (!userId && !isLoading) {
    return (
      <div className="container mx-auto py-24 px-4 text-center space-y-8">
        <div className="w-24 h-24 rounded-[2rem] bg-muted/20 border border-glass-border flex items-center justify-center mx-auto">
          <Heart className="w-10 h-10 text-muted-foreground opacity-20" />
        </div>
        <div className="space-y-2">
          <h1 className="text-4xl font-black italic uppercase tracking-tighter">Acesso Negado</h1>
          <p className="text-muted-foreground max-w-md mx-auto">Por favor, sincronize seu perfil de operador para acessar sinais de descoberta salvos.</p>
        </div>
        <Button asChild className="rounded-2xl h-14 px-8 font-black uppercase tracking-tighter">
          <Link to="/profile">Sincronizar Perfil</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-12 px-4 max-w-7xl space-y-12">
      <div className="space-y-4">
        <Badge variant="outline" className="px-5 py-2 rounded-full border-primary/30 bg-primary/5 text-primary glass-surface">
          <Sparkles className="w-3.5 h-3.5 mr-2" />
          ENCRYPTED VAULT STORAGE
        </Badge>
        <h1 className="text-6xl font-black italic uppercase tracking-[-0.07em] leading-none">Sinais Salvos</h1>
        <p className="text-muted-foreground font-medium tracking-tight border-l-2 border-primary/20 pl-6">
          Monitorando fluxos de descoberta priorizados e pontos de preço de alta fidelidade.
        </p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-[400px] rounded-[2.5rem] bg-muted/20 animate-pulse border border-glass-border" />
          ))}
        </div>
      ) : favorites && favorites.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {favorites.map((product) => (
            <ProductCard key={product.id} {...product} />
          ))}
        </div>
      ) : (
        <div className="py-24 text-center space-y-8 glass-surface rounded-[3rem] border border-glass-border p-12">
          <div className="w-20 h-20 rounded-2xl bg-primary/5 border border-primary/10 flex items-center justify-center mx-auto text-primary/20">
            <Search className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-black italic uppercase tracking-tight">Vault Vazio</h2>
            <p className="text-muted-foreground max-w-sm mx-auto">Nenhum sinal priorizado detectado. Inicie protocolos de busca para popular este setor.</p>
          </div>
          <Button asChild variant="outline" className="rounded-xl font-black uppercase tracking-tighter border-primary/20 text-primary hover:bg-primary/5">
            <Link to="/feed">Iniciar Descoberta</Link>
          </Button>
        </div>
      )}
    </div>
  );
}
