import { useServerFn } from "@tanstack/react-start";
import { recordUserActivity } from "@/lib/gamification.functions";
import { useEffect } from "react";

/**
 * Hook to track user page views and update daily streak
 * Scoped to authenticated users only
 */
export const useActivityTracker = () => {
  const recordActivity = useServerFn(recordUserActivity);

  useEffect(() => {
    const track = async () => {
      try {
        await recordActivity();
      } catch (error) {
        console.error("Activity tracking failed:", error);
      }
    };

    track();
  }, [recordActivity]);
};
