import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";

export function BannerCarousel() {
  const { data: banners } = useQuery({
    queryKey: ["banners"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("banners")
        .select(`
          *
        `)
        .eq("is_active", true)
        .order("position");
      if (error) throw error;
      return data;
    },
  });

  if (!banners || banners.length === 0) return null;

  return (
    <section className="py-8 px-4 max-w-7xl mx-auto w-full">
      <Carousel className="w-full overflow-hidden rounded-[2.5rem] border border-glass-border shadow-2xl">
        <CarouselContent>
          {banners.map((banner) => (
            <CarouselItem key={banner.id}>
              <div className="relative aspect-[21/9] md:aspect-[24/7] overflow-hidden group">
                <img
                  src={banner.image_url}
                  alt={banner.title}
                  className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-black/40 flex items-center p-8 md:p-16">
                  <div className="space-y-4 max-w-xl">
                    <h2 className="text-4xl md:text-6xl font-black text-white uppercase italic tracking-tighter leading-none">
                      {banner.title}
                    </h2>
                    {banner.link_url && (
                      <Button asChild size="lg" className="rounded-xl px-8 font-black uppercase italic tracking-tighter shadow-2xl">
                        <Link 
                          to={banner.link_url} 
                          search={(prev: any) => ({ 
                            ...prev, 
                            utm_source: 'feed_banner'
                          })}
                        >
                          View Selection
                          <ArrowRight className="ml-2 w-5 h-5" />
                        </Link>
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="left-8 bg-black/20 border-white/10 text-white backdrop-blur-md" />
        <CarouselNext className="right-8 bg-black/20 border-white/10 text-white backdrop-blur-md" />
      </Carousel>
    </section>
  );
}
