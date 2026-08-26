import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toggleFavorite } from "@/lib/engagement.functions";
import { updateInterestScore } from "@/lib/personalization.functions";
import { useWebPush } from "@/hooks/useWebPush";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Gift } from "lucide-react";
import React from "react";

export function useEngagement(productId: string, categoryId?: string | null) {
  const [isFavorited, setIsFavorited] = useState(false);
  const [isOptimistic, setIsOptimistic] = useState(false);
  const toggleFavFn = useServerFn(toggleFavorite);
  const updateInterestFn = useServerFn(updateInterestScore);
  const webPush = useWebPush();

  const handleToggleFavorite = async (userId: string) => {
    const previousState = isFavorited;
    setIsFavorited(!previousState);
    setIsOptimistic(true);

    try {
      const result = await toggleFavFn({ data: { productId } });
      setIsFavorited(result.favorited);
      
      if (result.favorited && categoryId) {
        await updateInterestFn({ data: { userId, categoryId, action: 'favorite' } });
      }
      
      if (result.favorited) {
        const { data: referral } = await supabase.from('referrals').select('referral_code').eq('referrer_user_id', userId).maybeSingle();
        
        if (referral) {
          toast("Love this discovery?", {
            description: "Invite a friend to unlock early access protocols.",
            icon: React.createElement(Gift, { className: "w-4 h-4 text-primary" }),
            action: {
              label: "Invite Now",
              onClick: () => {
                const link = `${window.location.origin}/auth?ref=${referral.referral_code}`;
                if (navigator.share) {
                  navigator.share({ title: 'Heartful Helper Box', url: link });
                } else {
                  navigator.clipboard.writeText(link);
                  toast.success("Referral link copied!");
                }
              }
            }
          });
        }

        if (webPush.isSupported && !webPush.isSubscribed) {
          toast("Activate Real-Time Signals?", {
            description: "Get notified when this product drops in price.",
            action: {
              label: "Enable",
              onClick: () => webPush.subscribe()
            }
          });
        }
      }
      
      toast.success(result.favorited ? "Saved to favorites" : "Removed from favorites");
    } catch (error) {
      setIsFavorited(previousState);
      toast.error("Failed to update favorites");
    } finally {
      setIsOptimistic(false);
    }
  };

  return {
    isFavorited,
    setIsFavorited,
    isOptimistic,
    handleToggleFavorite
  };
}
