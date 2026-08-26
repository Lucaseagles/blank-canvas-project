import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { updateNotificationPreferences } from "@/lib/push.functions";
import { useWebPush } from "./useWebPush";
import { toast } from "sonner";

export function useNotificationPreferences(userId: string | null) {
  const queryClient = useQueryClient();
  const updatePrefsFn = useServerFn(updateNotificationPreferences);
  const webPush = useWebPush();

  const updatePreferences = useMutation({
    mutationFn: async (data: { 
      push_enabled?: boolean; 
      retention_enabled?: boolean; 
      frequency_cap_days?: number;
      togglePushSubscription?: boolean;
    }) => {
      if (!userId) throw new Error("Unauthorized");

      if (data.togglePushSubscription) {
        if (data.push_enabled) {
          await webPush.subscribe();
        } else {
          await webPush.unsubscribe();
        }
      }

      const { togglePushSubscription, ...apiData } = data;
      return updatePrefsFn({ data: apiData });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notification-preferences", userId] });
    },
    onError: (err: any) => {
      toast.error("Failed to update preferences: " + err.message);
    }
  });

  return {
    updatePreferences,
    webPush
  };
}
