import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { Sparkles, ArrowRight, Mail, Lock, ShieldCheck } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { processReferral } from "@/lib/referral.functions";
import { z } from "zod";

const authSearchSchema = z.object({
  ref: z.string().optional(),
  campaign_id: z.string().optional(),
});

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Entrar — Motor de Descoberta de Ofertas" },
      { name: "description", content: "Acesse sua conta para receber ofertas personalizadas, alertas de preço e recomendações inteligentes." },
      { property: "og:title", content: "Entrar — Motor de Descoberta de Ofertas" },
      { property: "og:description", content: "Acesse sua conta para receber ofertas personalizadas, alertas de preço e recomendações inteligentes." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  validateSearch: (search) => authSearchSchema.parse(search),
  component: LoginPage,
});

function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const search = useSearch({ from: '/auth' });
  const trackReferral = useServerFn(processReferral);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      
      // If there's a referral code in the URL, process it
      if (search.ref && data.user) {
        console.log('Processing referral code:', search.ref);
        try {
          await trackReferral({ 
            data: { 
              code: search.ref, 
              invitedUserId: data.user.id,
              campaignId: search.campaign_id ?? null
            } 
          });
        } catch (err) {
          console.error('Referral tracking error:', err);
        }
      }

      toast.success("Login realizado com sucesso. Acessando sistema...");
      navigate({ to: "/profile" });
    } catch (error: any) {
      toast.error(error.message || "Falha na autenticação. Verifique suas credenciais.");
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
            <ShieldCheck size={32} />
          </div>
          <div className="space-y-1">
            <CardTitle className="text-4xl font-black tracking-tighter italic uppercase italic">Verificação de Identidade</CardTitle>
            <CardDescription className="font-bold text-xs uppercase tracking-[0.2em] text-muted-foreground/60">
              Acesse o motor de descoberta
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="px-10 pb-12">
          <form onSubmit={handleLogin} className="space-y-6">
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
              className="w-full h-16 rounded-2xl text-lg font-black italic uppercase tracking-tight group shadow-xl shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98] min-h-[44px]"

              disabled={isLoading}
            >
              {isLoading ? "Autenticando..." : (
                <>
                  Engajar Sistema
                  <ArrowRight className="ml-3 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </Button>
          </form>

          <div className="mt-4 text-center">
            <Link to="/reset-password" className="text-xs font-black uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors inline-flex items-center justify-center min-h-[44px] px-2">
              Esqueci minha senha
            </Link>
          </div>

          <div className="mt-4 pt-8 border-t border-glass-border text-center space-y-4">
            <p className="text-sm text-muted-foreground font-medium">
              Novo operador?{" "}
              <Link to="/register" className="text-primary font-black uppercase tracking-tighter italic hover:underline">
                Criar Identidade
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
