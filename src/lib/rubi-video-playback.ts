export type RubiVideoProvider = "youtube" | "tiktok" | "instagram" | "shopee" | "kwai" | "shein" | "mercado_livre" | "external";
export type RubiVideoPlayback =
  | { kind: "native"; src: string; provider: "native" }
  | { kind: "embed"; src: string; provider: "youtube" | "tiktok" }
  | { kind: "external"; href: string; provider: RubiVideoProvider }
  | { kind: "invalid" };

const isHost = (hostname: string, domain: string) =>
  hostname === domain || hostname.endsWith(`.${domain}`);

function identifyProvider(hostname: string): RubiVideoProvider {
  if (isHost(hostname, "youtube.com") || isHost(hostname, "youtu.be") || isHost(hostname, "youtube-nocookie.com")) return "youtube";
  if (isHost(hostname, "tiktok.com") || isHost(hostname, "tiktokv.com")) return "tiktok";
  if (isHost(hostname, "instagram.com")) return "instagram";
  if (isHost(hostname, "shopee.com.br") || isHost(hostname, "shopee.com") || isHost(hostname, "shope.ee")) return "shopee";
  if (isHost(hostname, "kwai.com") || isHost(hostname, "kuaishou.com")) return "kwai";
  if (isHost(hostname, "shein.com") || isHost(hostname, "shein.com.br")) return "shein";
  if (isHost(hostname, "mercadolivre.com.br") || isHost(hostname, "mercadolibre.com")) return "mercado_livre";
  return "external";
}

function getYouTubeId(url: URL): string | null {
  const host = url.hostname.toLowerCase();
  let id: string | null = null;
  if (isHost(host, "youtu.be")) id = url.pathname.split("/").filter(Boolean)[0] ?? null;
  else if (url.pathname === "/watch") id = url.searchParams.get("v");
  else {
    const match = url.pathname.match(/^\/(?:embed|shorts|live)\/([\w-]{6,20})/);
    id = match?.[1] ?? null;
  }
  return id && /^[\w-]{6,20}$/.test(id) ? id : null;
}

/** Resolve only known official embed formats. Unknown/social URLs remain safe link-outs. */
export function resolveRubiVideoPlayback(input: string | null | undefined): RubiVideoPlayback {
  if (!input || !input.trim()) return { kind: "invalid" };
  let url: URL;
  try {
    url = new URL(input.trim());
  } catch {
    return { kind: "invalid" };
  }
  if (url.protocol !== "https:" || url.username || url.password) return { kind: "invalid" };

  const host = url.hostname.toLowerCase();
  const path = url.pathname.toLowerCase();
  if (/\.(mp4|webm|ogv|ogg)$/.test(path)) {
    return { kind: "native", src: url.toString(), provider: "native" };
  }

  const provider = identifyProvider(host);
  if (provider === "youtube") {
    const id = getYouTubeId(url);
    if (id) return { kind: "embed", provider, src: `https://www.youtube-nocookie.com/embed/${id}` };
  }
  if (provider === "tiktok") {
    const match = url.pathname.match(/\/video\/(\d{8,25})/);
    if (match?.[1]) return { kind: "embed", provider, src: `https://www.tiktok.com/player/v1/${match[1]}` };
  }
  return { kind: "external", href: url.toString(), provider };
}
