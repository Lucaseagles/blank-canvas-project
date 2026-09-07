import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useProductSync() {
  const queryClient = useQueryClient();
  useEffect(() => {
    const channel = supabase.channel("products-sync").on("postgres_changes", { event: "*", schema: "public", table: "products" }, (payload) => {
      const id = (payload.new as { id?: string } | null)?.id ?? (payload.old as { id?: string } | null)?.id;
      void queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      void queryClient.invalidateQueries({ queryKey: ["products"] });
      void queryClient.invalidateQueries({ queryKey: ["product", id] });
      void queryClient.invalidateQueries({ queryKey: ["feed"] });
      void queryClient.invalidateQueries({ queryKey: ["category-products"] });
    }).subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [queryClient]);
}
