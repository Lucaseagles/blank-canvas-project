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
    <div className="flex bg-background min-h-screen">
      <AdminSidebar />

      <div className="lg:hidden fixed top-[max(1rem,env(safe-area-inset-top))] left-4 z-40">
        <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Abrir menu administrativo"
              className="bg-glass-fallback border border-glass-border min-h-touch min-w-touch"
            >
              <Menu className="w-5 h-5" />
            </Button>
          </SheetTrigger>
          <SheetContent
            side="left"
            className="p-0 border-r border-glass-border bg-glass-fallback backdrop-blur-3xl w-[min(18rem,85vw)]"
          >
            <AdminSidebar mobile onNavigate={() => setIsMobileOpen(false)} />
          </SheetContent>
        </Sheet>
      </div>

      <main className="flex-1 min-w-0 overflow-x-hidden overflow-y-auto pt-16 lg:pt-0 pb-safe">
        <Outlet />
      </main>
    </div>
  );
}