import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { ProductCard } from "./ProductCard";
import { Zap, Timer } from "lucide-react";
import { useEffect, useState } from "react";

export function FlashDeals() {
  const { data: products } = useQuery({
    queryKey: ["flash-deals"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*, marketplaces(name), video_products(id)")
        .eq("status", "active")
        .not("flash_deal_ends_at", "is", null)
        .gt("flash_deal_ends_at", new Date().toISOString())
        .order("discount", { ascending: false })
        .limit(4);
      
      if (error) throw error;
      
      return data.map(p => ({
        id: p.id,
        slug: p.slug,
        categoryId: p.category_id,
        title: p.title,
        price: p.current_price,
        previousPrice: p.previous_price,
        discount: p.discount,
        image: p.images?.[0] || "",
        marketplace: (p.marketplaces as any)?.name || "External",
        rating: p.rating,
        reviewCount: p.review_count,
        affiliateUrl: p.affiliate_url || null,
        hasVideo: p.video_products && p.video_products.length > 0,
        flashDealEndsAt: p.flash_deal_ends_at
      }));
    },
  });

  if (!products || products.length === 0) return null;

  const mainFlashDeal = products[0];

  return (
    <section className="py-16 px-4 max-w-7xl mx-auto w-full">
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
        <div className="space-y-2">
          <Badge variant="outline" className="rounded-full px-4 border-primary/30 bg-primary/5 text-primary uppercase font-black tracking-widest text-[10px]">
            <Zap className="w-3.5 h-3.5 mr-2 animate-pulse" />
            Oferta Flash
          </Badge>
          <h2 className="text-4xl md:text-6xl font-black tracking-tighter italic uppercase">Ofertas Relâmpago</h2>
        </div>
        
        {mainFlashDeal?.flashDealEndsAt && (
          <div className="bg-primary text-primary-foreground px-6 py-4 rounded-2xl flex items-center gap-4 shadow-xl shadow-primary/20">
            <Timer className="w-6 h-6" />
            <div className="flex flex-col">
              <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Expira em</span>
              <Countdown targetDate={mainFlashDeal.flashDealEndsAt} />
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {products.map((product) => (
          <ProductCard key={product.id} {...product} />
        ))}
      </div>
    </section>
  );
}

function Countdown({ targetDate }: { targetDate: string }) {
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    const timer = setInterval(() => {
      const distance = new Date(targetDate).getTime() - new Date().getTime();
      if (distance < 0) {
        setTimeLeft("EXPIRADO");
        clearInterval(timer);
        return;
      }
      
      const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);
      
      setTimeLeft(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDate]);

  return <span className="text-2xl font-black tracking-tight font-mono">{timeLeft}</span>;
}
