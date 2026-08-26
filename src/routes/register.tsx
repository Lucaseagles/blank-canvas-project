import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { Sparkles, ArrowRight, Mail, Lock, UserPlus, User } from "lucide-react";
import { z } from "zod";

const registerSearchSchema = z.object({
  ref: z.string().optional(),
  campaign_id: z.string().optional(),
});

export const Route = createFileRoute("/register")({
  head: () => ({
    meta: [
      { title: "Criar Conta — Ofertas Personalizadas" },
      { name: "description", content: "Crie sua conta gratuita e ative o motor de descoberta com recomendações, alertas e favoritos." },
      { property: "og:title", content: "Criar Conta — Ofertas Personalizadas" },
      { property: "og:description", content: "Crie sua conta gratuita e ative o motor de descoberta com recomendações, alertas e favoritos." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  validateSearch: (search) => registerSearchSchema.parse(search),
  component: RegisterPage,
});

function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const search = useSearch({ from: '/register' });

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            display_name: displayName,
          },
        },
      });

      if (error) throw error;
      
      if (data.user) {
        toast.success("Identidade criada! Verifique seu e-mail para confirmação.");
        // Forward ref to login if present
        navigate({ 
          to: "/auth",
          search: (prev: any) => ({ ...prev, ref: search.ref, campaign_id: search.campaign_id })
        });

      }
    } catch (error: any) {
      toast.error(error.message || "Falha no registro. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-32 relative overflow-hidden">
      {/* Background Accents */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[60%] aspect-square bg-primary/10 rounded-full blur-[150px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] aspect-square bg-blue-600/10 rounded-full blur-[130px]" />
      </div>

      <Card className="w-full max-w-md border-glass-border bg-glass backdrop-blur-xl rounded-[2.5rem] shadow-2xl z-10 overflow-hidden">
        <CardHeader className="pt-12 pb-8 px-10 text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center text-primary-foreground shadow-2xl shadow-primary/30 mx-auto mb-2">
            <UserPlus size={32} />
          </div>
          <div className="space-y-1">
            <CardTitle className="text-4xl font-black tracking-tighter italic uppercase">Novo Operador</CardTitle>
            <CardDescription className="font-bold text-xs uppercase tracking-[0.2em] text-muted-foreground/60">
              Junte-se à rede de descoberta
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="px-10 pb-12">
          <form onSubmit={handleRegister} className="space-y-5">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Alias: Nome de Exibição</Label>
              <div className="relative group">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <Input
                  type="text"
                  placeholder="Nome do Link Neural"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="h-14 pl-12 rounded-2xl bg-white/5 border-glass-border focus:ring-primary/20 font-medium min-h-touch"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Protocolo: E-mail</Label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <Input
                  type="email"
                  inputMode="email"
                  placeholder="operator@system.io"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-14 pl-12 rounded-2xl bg-white/5 border-glass-border focus:ring-primary/20 font-medium min-h-touch"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Cifra: Senha</Label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-14 pl-12 rounded-2xl bg-white/5 border-glass-border focus:ring-primary/20 font-medium min-h-touch"
                  required
                />
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full h-16 rounded-2xl text-lg font-black italic uppercase tracking-tight group shadow-xl shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98] mt-2"
              disabled={isLoading}
            >
              {isLoading ? "Criando Identidade..." : (
                <>
                  Inicializar Acesso
                  <ArrowRight className="ml-3 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </Button>
          </form>

          <div className="mt-8 pt-8 border-t border-glass-border text-center space-y-4">
            <p className="text-sm text-muted-foreground font-medium">
              Já registrado?{" "}
              <Link to="/auth" className="text-primary font-black uppercase tracking-tighter italic hover:underline">
                Engajar Login
              </Link>
            </p>
            <div className="flex items-center justify-center gap-2 text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground/30">
              <Sparkles className="w-3 h-3" />
              Protocolo de Segurança Ativo
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
