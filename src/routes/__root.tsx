import { createRootRoute, Outlet, Scripts } from "@tanstack/react-router";
import { HeadContent } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/router-devtools";
import * as React from "react";
import { Toaster } from "@/components/ui/sonner";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { BottomNav } from "@/components/layout/BottomNav";
import { SocialProofPopup } from "@/components/SocialProofPopup";
import { PremiumError } from "@/components/ui/PremiumError";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "@/styles.css";



// Ensure a stable queryClient for the root
const rootQueryClient = new QueryClient();

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Ofertas Inteligentes — Descoberta e Video Commerce" },
      { name: "description", content: "Motor de descoberta de ofertas com curadoria inteligente, vídeos e alertas de preço em vários marketplaces." },
      { property: "og:title", content: "Ofertas Inteligentes — Descoberta e Video Commerce" },
      { property: "og:description", content: "Curadoria inteligente de ofertas, vídeos e alertas de preço." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: RootComponent,
  errorComponent: ({ error, reset }) => {
    console.error("Root Error Component caught:", error);
    return (
      <PremiumError 
        title="Runtime Anomaly" 
        message={error instanceof Error ? error.message : "A catastrophic engine failure was detected."} 
        reset={reset} 
      />
    );
  },
  notFoundComponent: () => (
    <PremiumError 
      title="Coordinate Mismatch" 
      message="The requested sector does not exist in our discovery database." 
      isNotFound 
    />
  ),
});

function RootComponent() {
  React.useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
        }
      });
    }, { threshold: 0.1 });

    document.querySelectorAll('.reveal-on-scroll').forEach(el => observer.observe(el));
    
    return () => observer.disconnect();
  }, []);

  return (
    <QueryClientProvider client={rootQueryClient}>
      <html lang="pt-BR" className="dark">
        <head>
          <HeadContent />
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
          <link href="https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap" rel="stylesheet" />
        </head>
        <body className="antialiased selection:bg-primary selection:text-primary-foreground bg-background">
          <Navbar />
          <main className="min-h-[calc(100vh-200px)] pb-[72px] md:pb-0">
            <Outlet />
          </main>
          <Footer />
          <BottomNav />
          <SocialProofPopup />
          <Toaster />
          
          {/* <TanStackRouterDevtools position="bottom-right" /> */}
          <Scripts />
        </body>
      </html>
    </QueryClientProvider>
  );
}