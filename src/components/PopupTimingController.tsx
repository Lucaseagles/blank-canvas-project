import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

const KEY = "popup-timing:last-fired";
const COOLDOWN_MS = 60_000;

export function PopupTimingController() {
  const fired = useRef(false);
  useEffect(() => {
    const sessionId = sessionStorage.getItem("analytics_session_id") ?? crypto.randomUUID();
    sessionStorage.setItem("analytics_session_id", sessionId);
    const fire = async (timing_trigger: string) => {
      if (fired.current) return;
      const last = Number(localStorage.getItem(KEY) ?? 0);
      if (Date.now() - last < COOLDOWN_MS) return;
      fired.current = true;
      localStorage.setItem(KEY, String(Date.now()));
      try {
        await (supabase as any).rpc("track_event", {
          p_event_type: "POPUP_TIMING_TRIGGER",
          p_metadata: { timing_trigger, path: window.location.pathname, device: window.innerWidth < 768 ? "mobile" : "desktop" },
          p_session_id: sessionId,
          p_anonymous_id: localStorage.getItem("analytics_anonymous_id") ?? undefined,
        });
      } catch {
        /* telemetria não deve quebrar a UI */
      }
    };
    void fire("store_entry");
    const onProductView = () => void fire("product_view");
    const onAffiliateReturn = () => void fire("affiliate_return");
    const onVisibility = () => { if (document.visibilityState === "visible" && sessionStorage.getItem("affiliate_click_pending") === "1") { sessionStorage.removeItem("affiliate_click_pending"); onAffiliateReturn(); } };
    const onMouseLeave = (e: MouseEvent) => { if (e.clientY <= 0) void fire("exit_intent"); };
    const idle = window.setTimeout(() => void fire("browse_time"), 45_000);
    window.addEventListener("product-view", onProductView as EventListener);
    window.addEventListener("affiliate-return", onAffiliateReturn);
    document.addEventListener("visibilitychange", onVisibility);
    document.addEventListener("mouseleave", onMouseLeave);
    return () => { window.clearTimeout(idle); window.removeEventListener("product-view", onProductView as EventListener); window.removeEventListener("affiliate-return", onAffiliateReturn); document.removeEventListener("visibilitychange", onVisibility); document.removeEventListener("mouseleave", onMouseLeave); };
  }, []);
  return null;
}
