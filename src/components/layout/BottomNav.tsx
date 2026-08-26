import { Link } from "@tanstack/react-router";
import { Home, Compass, Play, Heart, User } from "lucide-react";

const items = [
  { to: "/", label: "Início", icon: Home },
  { to: "/feed", label: "Feed", icon: Compass },
  { to: "/videos", label: "Vídeos", icon: Play },
  { to: "/favorites", label: "Favoritos", icon: Heart },
  { to: "/profile", label: "Perfil", icon: User },
] as const;

export function BottomNav() {
  return (
    <nav
      aria-label="Navegação principal mobile"
      className="md:hidden fixed bottom-0 inset-x-0 z-50 border-t border-glass-border bg-background/90 backdrop-blur-2xl pb-safe"
    >
      <ul className="grid grid-cols-5">
        {items.map(({ to, label, icon: Icon }) => (
          <li key={to} className="min-w-0">
            <Link
              to={to}
              aria-label={label}
              activeOptions={{ exact: to === "/" }}
              activeProps={{ className: "text-primary" }}
              inactiveProps={{ className: "text-muted-foreground" }}
              className="flex min-h-[56px] min-w-[44px] flex-col items-center justify-center gap-1 px-1 py-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset"
            >
              <Icon className="w-5 h-5 shrink-0" />
              <span className="text-[10px] font-black uppercase tracking-tight truncate max-w-full">
                {label}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}