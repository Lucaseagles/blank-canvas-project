import { createRootRoute, Outlet, Scripts } from "@tanstack/react-router";
import { HeadContent } from "@tanstack/react-router";
import * as React from "react";
import { Toaster } from "@/components/ui/sonner";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { BottomNav } from "@/components/layout/BottomNav";
import { SocialProofPopup } from "@/components/SocialProofPopup";
import { PopupEngine } from "@/components/PopupEngine";
import { PremiumError } from "@/components/ui/PremiumError";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import "@/styles.css";
const rootQueryClient = new QueryClient();
export const Route = createRootRoute({
  head: () => ({ meta: [{ charSet: "utf-8" }, { name: "viewport", content: "width=device-width, initial-scale=1" }, { title: "Ofertas Inteligentes — Descoberta e Video Commerce" }, { name: "description", content: "Motor de descoberta de ofertas com curadoria inteligente, vídeos e alertas de preço em vários marketplaces." }] }),
  component: RootComponent,
  errorComponent: ({ error, reset }) => <PremiumError title="Runtime Anomaly" message={error instanceof Error ? error.message : "A catastrophic engine failure was detected."} reset={reset} />,
  notFoundComponent: () => <PremiumError title="Coordinate Mismatch" message="The requested sector does not exist in our discovery database." isNotFound />,
});
function RootComponent() {
  React.useEffect(() => {
    const observer = new IntersectionObserver((entries) => entries.forEach(entry => entry.isIntersecting && entry.target.classList.add("is-visible")), { threshold: 0.1 });
    document.querySelectorAll(".reveal-on-scroll").forEach(el => observer.observe(el));
    const key = "analytics_session_id";
    const existing = sessionStorage.getItem(key);
    const sessionId = existing ?? crypto.randomUUID();
    if (!existing) sessionStorage.setItem(key, sessionId);
    const anonymousId = localStorage.getItem("analytics_anonymous_id") ?? crypto.randomUUID();
    localStorage.setItem("analytics_anonymous_id", anonymousId);
    const sessionKey = `session_started:${sessionId}`;
    if (!sessionStorage.getItem(sessionKey)) {
      sessionStorage.setItem(sessionKey, "1");
      void (supabase as any).rpc("track_event", {
        p_event_type: "SESSION_START",
        p_metadata: { source: "app_shell" },
        p_anonymous_id: anonymousId,
        p_session_id: sessionId,
      }).catch(() => undefined);
    }
    return () => observer.disconnect();
  }, []);
  return <QueryClientProvider client={rootQueryClient}>
    <html lang="pt-BR" className="dark"><head><HeadContent /><link rel="preconnect" href="https://fonts.googleapis.com" /><link rel="preconnect" href="https://fonts.googleapis.com" crossOrigin="anonymous" /><link href="https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32;1,14..32&display=swap" rel="stylesheet" /></head>
    <body className="antialiased selection:bg-primary selection:text-primary-foreground bg-background"><Navbar /><main className="min-h-[calc(100vh-200px)] pb-[72px] md:pb-0"><Outlet /></main><Footer /><BottomNav /><SocialProofPopup /><PopupEngine /><Toaster /><Scripts /></body></html>
  </QueryClientProvider>;
}