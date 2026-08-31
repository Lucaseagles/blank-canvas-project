import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const OWNER_EMAIL = "eaglesfr49@gmail.com";

export const Route = createFileRoute("/admin")({
  ssr: false,
  component: AdminLayout,
});

function AdminLayout() {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;

    async function checkAuth() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          if (!cancelled) navigate({ to: "/auth", replace: true });
          return;
        }

        const email = session.user.email?.toLowerCase();
        if (email !== OWNER_EMAIL) {
          if (!cancelled) navigate({ to: "/", replace: true });
          return;
        }

        const { data: hasRole, error } = await supabase.rpc("has_role", {
          _user_id: session.user.id,
          _role: "owner",
        });

        if (error || !hasRole) {
          if (!cancelled) navigate({ to: "/", replace: true });
          return;
        }

        if (!cancelled) setIsAuthorized(true);
      } catch (error) {
        console.error("Admin authorization check failed:", error);
        if (!cancelled) navigate({ to: "/", replace: true });
      }
    }

    checkAuth();
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  if (isAuthorized !== true) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-6">
        <div className="animate-pulse flex flex-col items-center gap-4 text-center">
          <div className="w-12 h-12 rounded-2xl bg-primary/20" />
          <div className="h-4 w-40 bg-muted rounded" />
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
            Verificando acesso seguro...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar authorized={true} />

      <div className="lg:hidden fixed inset-x-0 top-0 z-[60] pointer-events-none">
        <div className="relative h-16">
          <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
            <SheetTrigger asChild>
              <Button
                type="button"
                variant="outline"
                size="icon"
                aria-label="Abrir menu administrativo"
                aria-expanded={isMobileOpen}
                className="pointer-events-auto absolute left-4 top-[max(0.75rem,env(safe-area-inset-top))] z-[61] flex h-11 w-11 min-h-[44px] min-w-[44px] items-center justify-center rounded-xl border-2 border-primary/50 bg-background/95 text-foreground shadow-xl backdrop-blur-xl hover:bg-primary/10 hover:text-primary focus-visible:ring-2 focus-visible:ring-primary"
              >
                <Menu className="h-5 w-5" strokeWidth={2.5} aria-hidden="true" />
                <span className="sr-only">Abrir menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent
              side="left"
              className="z-[70] h-dvh w-[min(20rem,88vw)] p-0 border-r border-glass-border bg-glass-fallback backdrop-blur-3xl"
            >
              <AdminSidebar mobile authorized={true} onNavigate={() => setIsMobileOpen(false)} />
            </SheetContent>
          </Sheet>
        </div>
      </div>

      <main className="flex-1 min-w-0 overflow-x-hidden overflow-y-auto pt-16 lg:pt-0 pb-safe">
        <Outlet />
      </main>
    </div>
  );
}
