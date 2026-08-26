import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { KeyRound, Mail, Lock, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Recuperar Acesso — Motor de Descoberta" },
      { name: "description", content: "Solicite um link seguro para redefinir a senha da sua conta e retomar o acesso ao motor de descoberta de ofertas." },
      { property: "og:title", content: "Recuperar Acesso — Motor de Descoberta" },
      { property: "og:description", content: "Solicite um link seguro para redefinir a senha da sua conta." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isRecoveryMode, setIsRecoveryMode] = useState(false);

  useEffect(() => {
    // Supabase redirects here with a recovery session in the URL hash.
    if (typeof window !== "undefined" && window.location.hash.includes("type=recovery")) {
      setIsRecoveryMode(true);
    }
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setIsRecoveryMode(true);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  const requestLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      toast.success("Link de recuperação enviado. Verifique seu e-mail.");
    } catch (error: any) {
      toast.error(error.message || "Não foi possível enviar o link de recuperação.");
    } finally {
      setIsLoading(false);
    }
  };

  const updatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      toast.success("Senha atualizada. Você já pode acessar o sistema.");
      window.location.href = "/profile";
    } catch (error: any) {
      toast.error(error.message || "Não foi possível atualizar a senha.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-32 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[60%] aspect-square bg-primary/10 rounded-full blur-[150px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] aspect-square bg-blue-600/10 rounded-full blur-[130px]" />
      </div>

      <Card className="w-full max-w-md border-glass-border bg-glass backdrop-blur-xl rounded-[2.5rem] shadow-2xl z-10 overflow-hidden">
        <CardHeader className="pt-12 pb-8 px-6 sm:px-10 text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center text-primary-foreground shadow-2xl shadow-primary/30 mx-auto mb-2">
            <KeyRound size={30} />
          </div>
          <div className="space-y-1">
            <CardTitle className="text-3xl sm:text-4xl font-black tracking-tighter italic uppercase">
              {isRecoveryMode ? "Nova Cifra" : "Recuperar Acesso"}
            </CardTitle>
            <CardDescription className="font-bold text-[10px] sm:text-xs uppercase tracking-[0.2em] text-muted-foreground/60">
              {isRecoveryMode ? "Defina uma nova senha" : "Enviaremos um link seguro"}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="px-6 sm:px-10 pb-12">
          {isRecoveryMode ? (
            <form onSubmit={updatePassword} className="space-y-6">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Nova senha</Label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <Input
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    minLength={6}
                    className="h-14 pl-12 rounded-2xl bg-white/5 border-glass-border font-medium min-h-touch"
                    required
                  />
                </div>
              </div>
              <Button type="submit" disabled={isLoading} className="w-full h-16 rounded-2xl text-lg font-black italic uppercase tracking-tight min-h-[44px]">
                {isLoading ? "Atualizando..." : "Salvar Nova Senha"}
              </Button>
            </form>
          ) : (
            <form onSubmit={requestLink} className="space-y-6">
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
                    className="h-14 pl-12 rounded-2xl bg-white/5 border-glass-border font-medium min-h-touch"
                    required
                  />
                </div>
              </div>
              <Button type="submit" disabled={isLoading} className="w-full h-16 rounded-2xl text-lg font-black italic uppercase tracking-tight group min-h-[44px]">
                {isLoading ? "Enviando..." : (<>Enviar Link<ArrowRight className="ml-3 w-5 h-5 group-hover:translate-x-1 transition-transform" /></>)}
              </Button>
            </form>
          )}

          <div className="mt-8 pt-8 border-t border-glass-border text-center">
            <Link to="/auth" className="text-sm text-primary font-black uppercase tracking-tighter italic hover:underline">
              Voltar para o login
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
