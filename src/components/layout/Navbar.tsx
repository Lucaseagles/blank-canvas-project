import * as React from "react";
import { Link } from "@tanstack/react-router";
import { Search, ShoppingBag, Menu, User, Bell, Heart, Heart as FavoritesIcon, Play, Grid3X3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { supabase } from "@/integrations/supabase/client";
import { getNotifications, getFavorites } from "@/lib/engagement.functions";
import { useServerFn } from "@tanstack/react-start";

export function Navbar() {
  const [isScrolled, setIsScrolled] = React.useState(false);
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const [userId, setUserId] = React.useState<string | null>(null);
  const [isOwner, setIsOwner] = React.useState(false);
  const getNotifsFn = useServerFn(getNotifications);
  const getFavsFn = useServerFn(getFavorites);
  const [notifications, setNotifications] = React.useState<any[]>([]);
  const [favorites, setFavorites] = React.useState<any[]>([]);

  React.useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      setUserId(user.id);
      const { data: hasRole } = await supabase.rpc("has_role", { _user_id: user.id, _role: "owner" });
      setIsOwner(!!hasRole);
    });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  React.useEffect(() => {
    if (!userId) return;
    getNotifsFn().then(setNotifications);
    getFavsFn({ data: {} }).then(setFavorites);
    const interval = setInterval(() => getNotifsFn().then(setNotifications), 30000);
    return () => clearInterval(interval);
  }, [userId, getNotifsFn, getFavsFn]);

  const unreadCount = notifications.filter((n) => !n.read).length;
  const favoritesCount = favorites.length;

  const navigation = [
    { to: "/feed", label: "Feed de Descoberta", icon: ShoppingBag },
    { to: "/products", label: "Produtos", icon: ShoppingBag },
    { to: "/categories", label: "Categorias", icon: Grid3X3 },
    { to: "/deals", label: "Ofertas", icon: ShoppingBag },
    { to: "/trending", label: "Em Alta", icon: ShoppingBag },
    { to: "/videos", label: "Video Commerce", icon: Play },
    { to: "/alerts", label: `Alertas${unreadCount > 0 ? ` (${unreadCount})` : ""}`, icon: Bell },
    { to: "/favorites", label: `Favoritos${favoritesCount > 0 ? ` (${favoritesCount})` : ""}`, icon: FavoritesIcon },
    { to: "/profile", label: "Perfil Neural", icon: User },
  ];

  const closeMenu = () => setIsMenuOpen(false);
  const signOut = async () => {
    closeMenu();
    await supabase.auth.signOut();
    window.location.href = "/auth";
  };

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 px-4 py-4 pt-safe safe-top ${isScrolled ? "glass-surface shadow-2xl" : "bg-transparent"}`}>
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        <Link to="/" className="flex items-center gap-3 group shrink-0">
          <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center text-primary-foreground shadow-2xl shadow-primary/30 group-hover:rotate-[10deg] transition-all duration-500">
            <ShoppingBag size={26} className="group-hover:scale-110 transition-transform" />
          </div>
          <span className="text-2xl font-black tracking-[-0.07em] italic uppercase hidden sm:block leading-none">
            AFFILIATE<span className="text-primary">PRO</span>
          </span>
        </Link>

        <div className="flex-1 max-w-2xl relative hidden md:block group/search">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
          <Input
            placeholder="Buscar produtos, marcas e ofertas..."
            className="pl-14 h-14 bg-white/5 border-2 border-glass-border rounded-full focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:bg-white/10 transition-all font-bold text-sm"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                const value = (e.target as HTMLInputElement).value.trim();
                if (value) window.location.href = `/search?q=${encodeURIComponent(value)}`;
              }
            }}
          />
        </div>

        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <div className="hidden sm:flex items-center gap-1 pr-2 border-r border-glass-border">
            <Button asChild variant="ghost" size="icon" className="w-10 h-10 rounded-xl hover:bg-primary/10 hover:text-primary relative" aria-label="Feed de Descoberta"><Link to="/feed"><ShoppingBag size={20} /></Link></Button>
            <Button asChild variant="ghost" size="icon" className="w-10 h-10 rounded-xl hover:bg-primary/10 hover:text-primary relative" aria-label="Categorias"><Link to="/categories"><Grid3X3 size={20} /></Link></Button>
            <Button asChild variant="ghost" size="icon" className="w-10 h-10 rounded-xl hover:bg-primary/10 hover:text-primary relative" aria-label="Video Commerce"><Link to="/videos"><Play size={20} /></Link></Button>
            <Button asChild variant="ghost" size="icon" className="w-10 h-10 rounded-xl hover:bg-primary/10 hover:text-primary relative" aria-label="Alertas"><Link to="/alerts"><Bell size={20} />{unreadCount > 0 && <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-black text-primary-foreground">{unreadCount}</span>}</Link></Button>
            <Button asChild variant="ghost" size="icon" className="w-10 h-10 rounded-xl hover:bg-primary/10 hover:text-primary relative" aria-label="Favoritos"><Link to="/favorites"><Heart size={20} />{favoritesCount > 0 && <span className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full" />}</Link></Button>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-12 gap-2 px-3 rounded-2xl border border-glass-border bg-glass hover:bg-primary hover:text-primary-foreground">
                <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center"><User size={18} /></div>
                <span className="font-black text-xs uppercase tracking-widest hidden lg:block">{userId ? "Operador" : "Convidado"}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-72 rounded-2xl border-glass-border bg-glass backdrop-blur-3xl p-2 max-h-[80vh] overflow-y-auto">
              <DropdownMenuLabel className="px-4 py-3 font-black text-xs uppercase tracking-[0.2em] opacity-50">Navegação</DropdownMenuLabel>
              <div className="p-1 space-y-1">
                {navigation.map((item) => (
                  <DropdownMenuItem key={item.to} asChild className="rounded-xl focus:bg-primary focus:text-primary-foreground cursor-pointer py-3 px-4">
                    <Link to={item.to} className="flex items-center gap-3"><item.icon size={17} /><span className="font-black text-xs uppercase tracking-tighter">{item.label}</span></Link>
                  </DropdownMenuItem>
                ))}
              </div>
              {isOwner && <>
                <DropdownMenuSeparator className="bg-glass-border" />
                <DropdownMenuItem asChild className="rounded-xl focus:bg-primary/20 cursor-pointer py-3 px-4"><Link to="/admin/dashboard" className="flex items-center gap-3 text-primary"><ShoppingBag size={17} /><span className="font-black text-xs uppercase tracking-tighter">Centro de Comando</span></Link></DropdownMenuItem>
              </>}
              <DropdownMenuSeparator className="bg-glass-border" />
              <DropdownMenuItem onClick={signOut} className="rounded-xl focus:bg-destructive focus:text-destructive-foreground cursor-pointer py-3 px-4 text-destructive"><span className="font-black text-xs uppercase tracking-tighter">Desconectar</span></DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Abrir menu de navegação" className="w-12 h-12 rounded-2xl bg-glass border border-glass-border hover:bg-primary/10 hover:text-primary">
                <Menu size={24} />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[min(86vw,380px)] bg-background/95 backdrop-blur-3xl border-glass-border pt-safe overflow-y-auto">
              <SheetHeader><SheetTitle className="font-black uppercase italic tracking-tighter text-left">Navegação</SheetTitle></SheetHeader>
              <div className="mt-6 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input placeholder="Buscar produtos e ofertas..." className="pl-11 h-12 bg-white/5 border-2 border-glass-border rounded-2xl font-bold text-sm" onKeyDown={(e) => { if (e.key === "Enter") { const value = (e.target as HTMLInputElement).value.trim(); if (value) window.location.href = `/search?q=${encodeURIComponent(value)}`; } }} />
              </div>
              <div className="mt-6 grid gap-2">
                {navigation.map((item) => (
                  <Button key={item.to} asChild variant="ghost" className="justify-start h-12 rounded-2xl border border-glass-border bg-glass gap-3 font-black text-xs uppercase tracking-tighter" onClick={closeMenu}>
                    <Link to={item.to}><item.icon size={18} />{item.label}</Link>
                  </Button>
                ))}
                {isOwner && <Button asChild variant="ghost" className="justify-start h-12 rounded-2xl border border-primary/30 bg-primary/10 text-primary gap-3 font-black text-xs uppercase tracking-tighter" onClick={closeMenu}><Link to="/admin/dashboard"><ShoppingBag size={18} />Centro de Comando</Link></Button>}
                <Button variant="ghost" className="justify-start h-12 rounded-2xl border border-destructive/30 bg-destructive/10 text-destructive gap-3 font-black text-xs uppercase tracking-tighter" onClick={signOut}>Desconectar</Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
}
