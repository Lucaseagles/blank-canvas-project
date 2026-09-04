import { useEffect, useRef } from "react";
import QRCode from "qrcode";
import type { ShareCardConfig, ShareFormat } from "@/lib/supabase/sharing";

interface Props { referralCode: string; referralLink: string; userName: string; reward: string; format: ShareFormat; config: ShareCardConfig | null; onGenerated: (dataUrl: string) => void; }

const roundedRect = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) => { const radius = Math.min(r, w / 2, h / 2); ctx.beginPath(); ctx.moveTo(x + radius, y); ctx.arcTo(x + w, y, x + w, y + h, radius); ctx.arcTo(x + w, y + h, x, y + h, radius); ctx.arcTo(x, y + h, x, y, radius); ctx.arcTo(x, y, x + w, y, radius); ctx.closePath(); };
const hex = (value: string, fallback: string) => /^#[0-9a-f]{6}$/i.test(value) ? value : fallback;

export function ShareCardCanvas({ referralCode, referralLink, userName, reward, format, config, onGenerated }: Props) {
  const ref = useRef<HTMLCanvasElement>(null);
  const generating = useRef(false);
  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (generating.current) return;
      const canvas = ref.current; if (!canvas) return;
      generating.current = true;
      try {
        const width = format === "9_16" ? 540 : 800, height = format === "9_16" ? 960 : 800;
        canvas.width = width; canvas.height = height;
        const ctx = canvas.getContext("2d"); if (!ctx) return;
        const primary = hex(config?.primary_color ?? "", "#6366F1"), secondary = hex(config?.secondary_color ?? "", "#8B5CF6"), background = hex(config?.background ?? "", "#0A0A0F"), text = hex(config?.text_color ?? "", "#FFFFFF"), accent = hex(config?.accent_color ?? "", "#FBBF24");
        const bg = ctx.createLinearGradient(0, 0, width, height); bg.addColorStop(0, background); bg.addColorStop(1, secondary); ctx.fillStyle = bg; ctx.fillRect(0, 0, width, height);
        const glow = ctx.createRadialGradient(width * .5, height * .28, 0, width * .5, height * .28, width * .65); glow.addColorStop(0, `${primary}55`); glow.addColorStop(1, "transparent"); ctx.fillStyle = glow; ctx.fillRect(0, 0, width, height);
        ctx.strokeStyle = "rgba(255,255,255,.10)"; ctx.lineWidth = 2; ctx.strokeRect(18, 18, width - 36, height - 36);
        const top = format === "9_16" ? 62 : 78;
        ctx.textAlign = "center"; ctx.textBaseline = "top"; ctx.fillStyle = text; ctx.font = `800 ${format === "9_16" ? 34 : 46}px Inter, Arial, sans-serif`; ctx.fillText(config?.title ?? "Ganhe Recompensas Exclusivas", width / 2, top);
        ctx.fillStyle = `${text}B3`; ctx.font = `500 ${format === "9_16" ? 18 : 23}px Inter, Arial, sans-serif`; ctx.fillText(config?.subtitle ?? "Use meu código de indicação", width / 2, top + 54);
        ctx.fillStyle = accent; ctx.font = `800 ${format === "9_16" ? 27 : 34}px Inter, Arial, sans-serif`; ctx.fillText(userName || "Usuário", width / 2, top + 105);
        const codeY = format === "9_16" ? 230 : 310; roundedRect(ctx, (width - 280) / 2, codeY, 280, 56, 14); ctx.fillStyle = "rgba(255,255,255,.08)"; ctx.fill(); ctx.fillStyle = accent; ctx.font = `800 ${format === "9_16" ? 22 : 28}px monospace`; ctx.textBaseline = "middle"; ctx.fillText(referralCode || "CODIGO", width / 2, codeY + 28);
        ctx.textBaseline = "top"; ctx.fillStyle = `${text}DD`; ctx.font = `500 ${format === "9_16" ? 16 : 20}px Inter, Arial, sans-serif`; const rewardText = (config?.reward_label ?? "Ganhe {reward} ao se cadastrar").replace("{reward}", reward || "recompensas"); ctx.fillText(rewardText, width / 2, format === "9_16" ? 325 : 420);
        const qrSize = format === "9_16" ? 180 : 220, qrCanvas = document.createElement("canvas");
        await QRCode.toCanvas(qrCanvas, referralLink, { width: qrSize, margin: 1, color: { dark: "#FFFFFF", light: "#00000000" } });
        if (cancelled) return;
        roundedRect(ctx, (width - qrSize - 28) / 2, (format === "9_16" ? 382 : 485), qrSize + 28, qrSize + 28, 16); ctx.fillStyle = "rgba(255,255,255,.08)"; ctx.fill(); ctx.drawImage(qrCanvas, (width - qrSize) / 2, format === "9_16" ? 396 : 499);
        const ctaY = format === "9_16" ? 620 : 735, ctaW = format === "9_16" ? 330 : 430, ctaH = 60; const cta = ctx.createLinearGradient((width - ctaW) / 2, ctaY, (width + ctaW) / 2, ctaY); cta.addColorStop(0, primary); cta.addColorStop(1, secondary); roundedRect(ctx, (width - ctaW) / 2, ctaY, ctaW, ctaH, 14); ctx.fillStyle = cta; ctx.fill(); ctx.fillStyle = "#FFFFFF"; ctx.font = `800 ${format === "9_16" ? 18 : 22}px Inter, Arial, sans-serif`; ctx.textBaseline = "middle"; ctx.fillText(config?.cta ?? "Baixe o app agora", width / 2, ctaY + ctaH / 2);
        ctx.textBaseline = "bottom"; ctx.fillStyle = `${text}66`; ctx.font = `500 ${format === "9_16" ? 11 : 13}px Inter, Arial, sans-serif`; ctx.fillText("Compartilhe seu convite • Aproveite suas recompensas", width / 2, height - 40);
        if (!cancelled) onGenerated(canvas.toDataURL("image/png"));
      } finally {
        generating.current = false;
      }
    };
    void run(); return () => { cancelled = true; };
  }, [referralCode, referralLink, userName, reward, format, config, onGenerated]);
  return <canvas ref={ref} className="hidden" aria-hidden="true" />;
}
