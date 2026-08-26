import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getSocialProofEvents, getSocialProofConfig } from '@/lib/social-proof.functions';
import { supabase } from '@/integrations/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, X, Heart, ExternalLink, Play } from 'lucide-react';

export function SocialProofPopup() {
  const [isVisible, setIsVisible] = useState(false);
  const [currentEvent, setCurrentEvent] = useState<any>(null);
  const [isDismissed, setIsDismissed] = useState(false);
  const [productData, setProductData] = useState<any>(null);

  const { data: config, error: configError } = useQuery({
    queryKey: ['socialProofConfig'],
    queryFn: () => getSocialProofConfig()
  });

  const { data: events, error: eventsError } = useQuery({
    queryKey: ['socialProofEvents'],
    queryFn: () => getSocialProofEvents(),
    enabled: !!config && (config as any).is_enabled && !isDismissed,
    refetchInterval: 60000 
  });

  useEffect(() => {
    if (configError) console.error("SocialProof: Config error", configError);
    if (eventsError) console.error("SocialProof: Events error", eventsError);
    if (config) console.log("SocialProof: Config loaded", (config as any).is_enabled);
    if (events) console.log("SocialProof: Events loaded", events.length);
  }, [config, events, configError, eventsError]);

  useEffect(() => {
    if (!config || !(config as any).is_enabled || isDismissed || !events || events.length === 0) {
      console.log("SocialProof: Skipping cycle", { 
        hasConfig: !!config,
        enabled: config ? (config as any).is_enabled : false, 
        dismissed: isDismissed, 
        hasEvents: !!events?.length 
      });
      return;
    }

    let timeout: NodeJS.Timeout;
    const cycleEvent = async () => {
      console.log("SocialProof: Cycling event...");
      const currentEvents = events as any[];
      const randomIndex = Math.floor(Math.random() * currentEvents.length);
      const event = currentEvents[randomIndex];
      
      if (!event || !event.productId) {
        console.log("SocialProof: Invalid event selected", event);
        return;
      }

      console.log("SocialProof: Fetching product data for", event.productId);
      const { data: product, error: productError } = await supabase
        .from('products')
        .select('id, title, images')
        .eq('id', event.productId)
        .single();

      if (productError) {
        console.error("SocialProof: Product fetch error", productError);
        setTimeout(cycleEvent, 2000);
        return;
      }

      if (product) {
        console.log("SocialProof: Showing event for", product.title);
        setProductData(product);
        setCurrentEvent(event);
        setIsVisible(true);

        timeout = setTimeout(() => {
          setIsVisible(false);
          console.log("SocialProof: Hiding event, next in", (config as any).min_interval_seconds || 30, "s");
          setTimeout(cycleEvent, ((config as any).min_interval_seconds || 30) * 1000);
        }, 8000);
      } else {
        console.log("SocialProof: Product not found, cycling...");
        cycleEvent();
      }
    };

    console.log("SocialProof: Setting initial delay (5s)");
    const initialDelay = setTimeout(cycleEvent, 5000);
    return () => {
      clearTimeout(initialDelay);
      clearTimeout(timeout);
    };
  }, [events, config, isDismissed]);

  const handleDismiss = () => {
    setIsVisible(false);
    setIsDismissed(true);
    sessionStorage.setItem('social_proof_dismissed', 'true');
  };

  useEffect(() => {
    if (sessionStorage.getItem('social_proof_dismissed')) {
      setIsDismissed(true);
    }
  }, []);

  if (!currentEvent || !productData) return null;

  const getEventText = () => {
    switch (currentEvent.type) {
      case 'ADD_FAVORITE':
        return <span>favoritou <span className="text-primary font-bold">{productData.title}</span></span>;
      case 'OUTBOUND_CLICK':
        return <span>está vendo uma oferta em <span className="text-primary font-bold">{productData.title}</span></span>;
      case 'PRODUCT_VIEW':
        return <span>está interessado em <span className="text-primary font-bold">{productData.title}</span></span>;
      case 'video_start':
        return <span>começou a ver o review de <span className="text-primary font-bold">{productData.title}</span></span>;
      case 'video_complete':
        return <span>acabou de ver o review completo de <span className="text-primary font-bold">{productData.title}</span></span>;
      default:
        return <span>se interessou por <span className="text-primary font-bold">{productData.title}</span></span>;
    }
  };

  const getEventIcon = () => {
    switch (currentEvent.type) {
      case 'ADD_FAVORITE':
        return <Heart className="w-3 h-3 text-red-500 fill-red-500" />;
      case 'OUTBOUND_CLICK':
      case 'PRODUCT_VIEW':
        return <ExternalLink className="w-3 h-3 text-blue-500" />;
      case 'video_start':
      case 'video_complete':
        return <Play className="w-3 h-3 text-green-500 fill-green-500" />;
      default:
        return <Eye className="w-3 h-3 text-primary" />;
    }
  };

  const imageUrl = Array.isArray(productData.images) ? productData.images[0] : null;

  return (
    <AnimatePresence>
      {isVisible && !isDismissed && (
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="fixed bottom-[88px] left-4 right-4 md:left-8 md:right-auto md:bottom-8 z-[100] max-w-[calc(100vw-32px)] md:max-w-[360px] w-full pb-safe"
        >
          <div className="glass-surface border border-glass-border rounded-2xl p-2.5 shadow-2xl flex items-center gap-3 relative group overflow-hidden">
            <div className="absolute inset-0 bg-primary/5 pointer-events-none" />
            
            <div className="relative w-11 h-11 flex-shrink-0 rounded-lg overflow-hidden border border-glass-border bg-muted">
              {imageUrl ? (
                <img src={imageUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Eye className="w-6 h-6 opacity-20" />
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0 pr-6">
              <div className="flex items-center gap-1.5 mb-0.5">
                <div className="w-4 h-4 rounded-full bg-primary/10 flex items-center justify-center">
                  {getEventIcon()}
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1">
                  Social Proof Real {currentEvent.location && <span className="lowercase font-medium opacity-60">• {currentEvent.location}</span>}
                </span>
              </div>
              <p className="text-[13px] leading-tight text-foreground/90 font-medium line-clamp-2">
                <span className="font-bold">{currentEvent.userName}</span> {getEventText()}
              </p>
            </div>

            <button 
              onClick={handleDismiss}
              className="absolute -top-1 -right-1 p-2 rounded-full hover:bg-white/10 transition-colors text-muted-foreground hover:text-foreground flex items-center justify-center min-h-[44px] min-w-[44px] z-10"
              aria-label="Close social proof"
            >
              <X className="w-4 h-4" />
            </button>

          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
