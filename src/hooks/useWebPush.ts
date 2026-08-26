import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getPushPublicKey, subscribeToPush, unsubscribeFromPush } from "@/lib/push.functions";
import { toast } from "sonner";
import { useEffect, useState } from "react";

export function useWebPush() {
  const queryClient = useQueryClient();
  const fetchPublicKey = useServerFn(getPushPublicKey);
  const subscribeFn = useServerFn(subscribeToPush);
  const unsubscribeFn = useServerFn(unsubscribeFromPush);

  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);

  useEffect(() => {
    const checkSupport = async () => {
      const supported = 'serviceWorker' in navigator && 'PushManager' in window;
      setIsSupported(supported);

      if (supported) {
        setPermission(Notification.permission);
        const registration = await navigator.serviceWorker.ready;
        const sub = await registration.pushManager.getSubscription();
        setSubscription(sub);
      }
    };

    checkSupport();
  }, []);

  const subscribeMutation = useMutation({
    mutationFn: async () => {
      if (!isSupported) throw new Error("Push not supported");

      const publicKey = await fetchPublicKey();
      if (!publicKey) throw new Error("VAPID public key not found");

      const registration = await navigator.serviceWorker.ready;
      
      // Request permission if not granted
      if (Notification.permission !== "granted") {
        const result = await Notification.requestPermission();
        setPermission(result);
        if (result !== "granted") throw new Error("Permission denied");
      }

      const sub = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: publicKey
      });

      const subJson = sub.toJSON();
      if (!subJson.endpoint || !subJson['keys']?.['p256dh'] || !subJson['keys']?.['auth']) {
        throw new Error("Invalid subscription format");
      }

      await subscribeFn({
        data: {
          endpoint: subJson.endpoint,
          p256dh: subJson['keys']['p256dh'] as string,
          auth: subJson['keys']['auth'] as string
        }
      });

      setSubscription(sub);
      return sub;
    },
    onSuccess: () => {
      toast.success("Notifications enabled!");
    },
    onError: (err: any) => {
      console.error("Push subscription error:", err);
      toast.error(err.message || "Failed to enable notifications");
    }
  });

  const unsubscribeMutation = useMutation({
    mutationFn: async () => {
      if (!subscription) return;

      await unsubscribeFn({
        data: { endpoint: subscription.endpoint }
      });

      await subscription.unsubscribe();
      setSubscription(null);
    },
    onSuccess: () => {
      toast.success("Notifications disabled");
    },
    onError: (err: any) => {
      toast.error("Failed to disable notifications");
    }
  });

  return {
    isSupported,
    permission,
    subscription,
    isSubscribed: !!subscription,
    subscribe: subscribeMutation.mutate,
    unsubscribe: unsubscribeMutation.mutate,
    isPending: subscribeMutation.isPending || unsubscribeMutation.isPending
  };
}
