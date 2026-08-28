import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { X, ArrowRight, Sparkles } from "lucide-react";

export function PopupEngine() {
  const [popup, setPopup] = useState<any>(null);
  const shown = useRef(false);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      const { data, error } = await (supabase as any).rpc("get_eligible_popup", { p_user_id: user?.id ?? null });
      if (!cancelled && !error && data?.[0] && !shown.current) {
        shown.current = true;
        setPopup(data[0]);
        await (supabase as any).rpc("record_popup_event", {
          p_rule_id: data[0].rule_id,
          p_user_id: user?.id ?? null,
          p_event_type: "view",
        });
      }
    };
    load();
    return () => { cancelled = true; };
  }, []);

  if (!popup) return null;
  const content = popup.content ?? {};

  const record = async (eventType: "click" | "dismiss") => {
    const { data: { user } } = await supabase.auth.getUser();
    await (supabase as any).rpc("record_popup_event", {
      p_rule_id: popup.rule_id,
      p_user_id: user?.id ?? null,
      p_event_type: eventType,
    });
    if (eventType === "click" && popup.cta_target) window.location.href = popup.cta_target;
    else setPopup(null);
  };

  return (
    <div className="fixed inset-x-4 bottom-[88px] z-[80] mx-auto max-w-md md:inset-x-auto md:right-6 md:bottom-6" role="dialog" aria-live="polite">
      <div className="rounded-3xl border border-primary/20 bg-background/95 p-5 shadow-2xl backdrop-blur-xl">
        <button aria-label="Fechar" onClick={() => record("dismiss")} className="absolute right-3 top-3 flex h-11 w-11 items-center justify-center rounded-full hover:bg-muted" type="button">
          <X className="h-4 w-4" />
        </button>
        <div className="pr-8">
          <div className="mb-3 flex items-center gap-2 text-primary"><Sparkles className="h-4 w-4" /><span className="text-[10px] font-black uppercase tracking-widest">Descoberto para você</span></div>
          <h3 className="text-xl font-black uppercase italic">{content.title ?? popup.name}</h3>
          {content.description && <p className="mt-2 text-sm text-muted-foreground">{content.description}</p>}
        </div>
        {popup.cta_label && <Button onClick={() => record("click")} className="mt-4 h-11 w-full rounded-xl font-black uppercase italic" type="button">{popup.cta_label}<ArrowRight className="ml-2 h-4 w-4" /></Button>}
      </div>
    </div>
  );
}
