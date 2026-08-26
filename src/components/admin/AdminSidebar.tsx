import { Link } from "@tanstack/react-router";
import { 
  LayoutDashboard, ShoppingBag, Play, Store, Folders, 
  Settings, Users, Target, BarChart3, Megaphone, 
  Send, Bell, Gift, GitBranch, ShieldCheck, Mail, MessageSquare 
} from "lucide-react";

const ADMIN_ROUTES = [
  { name: "Dashboard", path: "/admin/dashboard", icon: LayoutDashboard },
  { name: "Products", path: "/admin/products", icon: ShoppingBag },
  { name: "Videos", path: "/admin/videos", icon: Play },
  { name: "Marketplaces", path: "/admin/marketplaces", icon: Store },
  { name: "Categories", path: "/admin/categories", icon: Folders },
  { name: "Integrations", path: "/admin/integrations", icon: ShieldCheck },
  { name: "Users", path: "/admin/users", icon: Users },
  { name: "Recommendations", path: "/admin/recommendations", icon: Target },
  { name: "Analytics", path: "/admin/analytics", icon: BarChart3 },
  { name: "Campaigns", path: "/admin/campaigns", icon: Megaphone },
  { name: "Telegram", path: "/admin/telegram", icon: Send },
  { name: "Notifications", path: "/admin/notifications", icon: Bell },
  { name: "Referrals", path: "/admin/referrals", icon: Gift },
  { name: "Automations", path: "/admin/automations", icon: GitBranch },
  { name: "Settings", path: "/admin/settings", icon: Settings },
  { name: "Offers", path: "/admin/offers", icon: Mail },
  { name: "Social Proof", path: "/admin/social-proof", icon: MessageSquare },
];

export function AdminSidebar({ mobile = false, onNavigate }: { mobile?: boolean; onNavigate?: () => void }) {
  const content = (
    <div className={`flex flex-col gap-8 ${mobile ? "p-4" : "p-6 w-64 min-h-screen bg-glass-fallback border-r border-glass-border"}`}>
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-black italic">A</div>
        <span className="font-black tracking-tighter uppercase italic">Admin Panel</span>
      </div>
      
      <nav className="flex flex-col gap-1">
        {ADMIN_ROUTES.map((route) => (
          <Link
            key={route.path}
            to={route.path}
            onClick={onNavigate}
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-widest text-muted-foreground hover:bg-primary/10 hover:text-primary transition-all [&.active]:bg-primary [&.active]:text-primary-foreground"
          >
            <route.icon size={16} />
            {route.name}
          </Link>
        ))}
      </nav>
    </div>
  );

  if (mobile) return content;
  return <aside className="hidden lg:block">{content}</aside>;
}
