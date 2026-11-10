import { useEffect, useState } from "react";
import { Bell, BellRing, Download, Smartphone, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useWebPush } from "@/hooks/useWebPush";
import { trackEvent } from "@/lib/analytics";

const ACTIVATION_KEY = "rubi_new_account_activation";

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

type ActivationRecord = { userId: string; returnTo: string };

export function RubiPostSignupActivation({ returnTo }: { returnTo: string }) {
  const push = useWebPush();
  const [eligible, setEligible] = useState(false);
  const [installed, setInstalled] = useState(false);
  const [deferredInstall, setDeferredInstall] = useState<InstallPromptEvent | null>(null);
  const [showInstructions, setShowInstructions] = useState(false);
  const [installDecision, setInstallDecision] = useState("");
  const eventSource = returnTo.startsWith("/r/") ? "rubi_partner" : "rubi_store";
  const trackActivation = (action: string) => {
    // Each event represents an explicit action or a verified browser outcome,
    // never a confirmed sale, installed app, or delivered notification.
    void trackEvent("RUBI_POST_SIGNUP_ACTIVATION", {
      action, route: returnTo, origin: eventSource,
    }, { source: eventSource });
  };


  useEffect(() => {
    let canceled = false;
    void supabase.auth.getUser().then(({ data }) => {
      if (canceled || !data.user) return;
      try {
        const saved = sessionStorage.getItem(ACTIVATION_KEY);
        if (!saved) return;
        const pending = JSON.parse(saved) as ActivationRecord;
        if (pending.userId === data.user.id && pending.returnTo === returnTo) {
          setEligible(true);
          void trackEvent("RUBI_POST_SIGNUP_ACTIVATION", { action: "guide_shown", route: returnTo, origin: returnTo.startsWith("/r/") ? "rubi_partner" : "rubi_store" }, { source: returnTo.startsWith("/r/") ? "rubi_partner" : "rubi_store" });
          // The guide is only opened once; dismissing it does not affect checkout.
          sessionStorage.removeItem(ACTIVATION_KEY);
        }
      } catch {
        // Storage is optional. Never interrupt the purchase flow.
      }
    }).catch(() => undefined);
    return () => { canceled = true; };
  }, [returnTo]);

  useEffect(() => {
    const standalone = window.matchMedia("(display-mode: standalone)").matches
      || ("standalone" in navigator && (navigator as Navigator & { standalone?: boolean }).standalone === true);
    setInstalled(standalone);
    const onPrompt = (event: Event) => {
      event.preventDefault();
      setDeferredInstall(event as InstallPromptEvent);
    };
    const onInstalled = () => {
      setInstalled(true);
      trackActivation("appinstalled_browser_event");
      setDeferredInstall(null);
      setShowInstructions(false);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const install = async () => {
    trackActivation("install_cta_clicked");
    if (!deferredInstall) {
      trackActivation("install_instructions_shown");
      setShowInstructions(true);
      return;
    }
    try {
      await deferredInstall.prompt();
      const choice = await deferredInstall.userChoice;
      trackActivation(choice.outcome === "accepted" ? "install_prompt_accepted" : "install_prompt_dismissed");
      setInstallDecision(choice.outcome === "accepted"
        ? "Pedido de instalação enviado ao navegador."
        : "Você pode instalar depois pelo menu do navegador.");
    } catch {
      trackActivation("install_prompt_unavailable");
      setShowInstructions(true);
    } finally {
      setDeferredInstall(null);
    }
  };

  if (!eligible) return null;

  const isAppleMobile = typeof navigator !== "undefined" && /iphone|ipad|ipod/i.test(navigator.userAgent);
  return (
    <section aria-label="Bem-vindo à RUBI — ative o sininho e instale o aplicativo"
      className="space-y-4 rounded-3xl border border-primary/30 bg-primary/5 p-5 md:p-7">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="text-xs font-bold uppercase tracking-widest text-primary">Sua conta RUBI foi criada</p>
          <h2 className="text-2xl font-black">Aproveite mais a RUBI no seu celular</h2>
          <p className="text-sm text-muted-foreground">
            Dois passos opcionais para acompanhar ofertas e voltar ao aplicativo mais rapidamente.
            Você também pode continuar sua compra sem ativá-los.
          </p>
        </div>
        <Button type="button" size="icon" variant="ghost" aria-label="Dispensar convite"
          onClick={() => { trackActivation("guide_dismissed"); setEligible(false); }}><X className="h-4 w-4" /></Button>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-3 rounded-2xl border bg-card p-4">
          <div className="flex items-center gap-2 font-bold">
            {push.isSubscribed ? <BellRing className="h-5 w-5 text-primary" /> : <Bell className="h-5 w-5 text-primary" />}
            1. Ative o sininho
          </div>
          <p className="text-sm text-muted-foreground">
            Receba notificações de ofertas e avisos da RUBI no seu dispositivo, quando disponíveis.
            Só ativaremos com sua permissão.
          </p>
          {push.isSubscribed ? <p role="status" className="text-sm font-semibold">Notificações ativadas neste navegador.</p>
            : push.permission === "denied" ? <p className="text-xs text-muted-foreground">
                Seu navegador bloqueou notificações. Você pode alterar isso nas configurações do site.
              </p>
            : !push.isSupported ? <p className="text-xs text-muted-foreground">
                Notificações push não disponíveis neste navegador ou dispositivo.
              </p>
            : <Button type="button" onClick={() => { trackActivation("push_cta_clicked"); push.subscribe(); }}
                disabled={push.isPending} variant="outline">
                <Bell className="mr-2 h-4 w-4" />{push.isPending ? "Ativando..." : "Ativar notificações"}
              </Button>}
        </div>
        <div className="space-y-3 rounded-2xl border bg-card p-4">
          <div className="flex items-center gap-2 font-bold">
            <Smartphone className="h-5 w-5 text-primary" />2. Coloque a RUBI na tela inicial
          </div>
          <p className="text-sm text-muted-foreground">
            Abra a RUBI como aplicativo, sem precisar procurar o link novamente.
          </p>
          {installed ? <p role="status" className="text-sm font-semibold">A RUBI já está aberta como aplicativo.</p> :
            <Button type="button" variant="outline" onClick={() => void install()}>
              <Download className="mr-2 h-4 w-4" />{deferredInstall ? "Instalar aplicativo" : "Como instalar"}
            </Button>}
          {installDecision && <p role="status" className="text-xs text-muted-foreground">{installDecision}</p>}
          {showInstructions && !installed && <p className="text-xs text-muted-foreground">
            {isAppleMobile
              ? "No Safari do iPhone, toque em Compartilhar e depois em Adicionar à Tela de Início. Dependendo da versão do iOS, a opção pode aparecer em Mais."
              : "No navegador do celular, abra o menu e procure Instalar app ou Adicionar à tela inicial. O nome da opção depende do navegador."}
          </p>}
        </div>
      </div>
      <Button type="button" variant="ghost" className="w-full" onClick={() => { trackActivation("guide_dismissed"); setEligible(false); }}>
        Agora não, continuar vendo o produto
      </Button>
    </section>
  );
}
