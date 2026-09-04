import { useEffect, useRef } from "react";
import QRCode from "qrcode";

interface ShareQRCodeProps { value: string; size?: number; color?: string; backgroundColor?: string; }

export function ShareQRCode({ value, size = 160, color = "#FFFFFF", backgroundColor = "#0A0A0F" }: ShareQRCodeProps) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (!ref.current || !value) return;
    void QRCode.toCanvas(ref.current, value, { width: size, margin: 1, color: { dark: color, light: backgroundColor } });
  }, [value, size, color, backgroundColor]);
  return <canvas ref={ref} width={size} height={size} aria-label="QR Code da indicação" className="max-w-full rounded-xl" />;
}
