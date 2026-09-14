import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const REPO = "Lucaseagles/blank-canvas-project";
const ISSUER = "https://token.actions.githubusercontent.com";
const JWKS_URL = `${ISSUER}/.well-known/jwks`;
const EXPECTED_AUDIENCE = "scheduled-publishing";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  { auth: { persistSession: false, autoRefreshToken: false } },
);

type Claims = { iss?: string; aud?: string; repository?: string; exp?: number; nbf?: number };
type Jwk = JsonWebKey & { kid?: string; alg?: string; use?: string };
let jwksCache: { keys: Jwk[]; expiresAt: number } | null = null;

function base64UrlToBytes(value: string): Uint8Array {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(value.length / 4) * 4, "=");
  const binary = atob(normalized);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}
function decodeJson<T>(segment: string): T {
  return JSON.parse(new TextDecoder().decode(base64UrlToBytes(segment))) as T;
}
async function getJwks(): Promise<Jwk[]> {
  if (jwksCache && jwksCache.expiresAt > Date.now()) return jwksCache.keys;
  const response = await fetch(JWKS_URL, { headers: { accept: "application/json" } });
  if (!response.ok) throw new Error(`GitHub JWKS respondeu HTTP ${response.status}.`);
  const payload = (await response.json()) as { keys?: Jwk[] };
  jwksCache = { keys: payload.keys ?? [], expiresAt: Date.now() + 10 * 60 * 1000 };
  return jwksCache.keys;
}
async function verifyGitHubOidc(request: Request): Promise<void> {
  const authorization = request.headers.get("authorization") ?? "";
  if (!authorization.startsWith("Bearer ")) throw new Error("Unauthorized");
  const token = authorization.slice(7).trim();
  const parts = token.split(".");
  if (parts.length !== 3) throw new Error("Unauthorized");
  const header = decodeJson<{ alg?: string; kid?: string }>(parts[0]);
  const claims = decodeJson<Claims>(parts[1]);
  if (header.alg !== "RS256" || !header.kid) throw new Error("Unauthorized");
  if (claims.iss !== ISSUER || claims.aud !== EXPECTED_AUDIENCE || claims.repository !== REPO) throw new Error("Unauthorized");
  const now = Math.floor(Date.now() / 1000);
  if (!claims.exp || claims.exp < now || (claims.nbf && claims.nbf > now + 30)) throw new Error("Unauthorized");
  const jwk = (await getJwks()).find((key) => key.kid === header.kid);
  if (!jwk) throw new Error("Unauthorized");
  const publicKey = await crypto.subtle.importKey("jwk", jwk, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["verify"]);
  const valid = await crypto.subtle.verify("RSASSA-PKCS1-v1_5", publicKey, base64UrlToBytes(parts[2]), new TextEncoder().encode(`${parts[0]}.${parts[1]}`));
  if (!valid) throw new Error("Unauthorized");
}
async function getSecret(field: string): Promise<string | null> {
  const { data, error } = await supabase.rpc("get_integration_secret", { p_platform_id: "telegram", p_field_key: field });
  if (error) throw new Error(`Não foi possível obter a credencial Telegram: ${error.message}`);
  return typeof data === "string" && data.trim() ? data.trim() : null;
}
async function sendTelegram(message: string): Promise<void> {
  const token = await getSecret("bot_token");
  const chatId = await getSecret("channel_id");
  if (!token || !chatId) throw new Error("Telegram não está configurado no Secure Hub.");
  const response = await fetch(`https://api.telegram.org/bot${encodeURIComponent(token)}/sendMessage`, {
    method: "POST", headers: { "Content-Type": "application/json", accept: "application/json" },
    body: JSON.stringify({ chat_id: chatId, text: message, disable_web_page_preview: false }), signal: AbortSignal.timeout(10000),
  });
  const result = (await response.json()) as { ok?: boolean; description?: string };
  if (!response.ok || !result.ok) throw new Error(result.description ?? `Telegram respondeu HTTP ${response.status}.`);
}
async function runScheduledPublishing(limit: number) {
  const { data: duePosts, error } = await supabase.from("scheduled_posts").select("*").eq("status", "pending").lte("scheduled_for", new Date().toISOString()).order("scheduled_for", { ascending: true }).limit(limit);
  if (error) throw new Error(`Não foi possível localizar publicações vencidas: ${error.message}`);
  const results: Array<{ id: string; status: "published" | "failed"; error?: string }> = [];
  for (const post of duePosts ?? []) {
    const { data: claimed, error: claimError } = await supabase.from("scheduled_posts").update({ status: "processing", error_message: null }).eq("id", post.id).eq("status", "pending").select("id").maybeSingle();
    if (claimError || !claimed) continue;
    try {
      const channels = Array.isArray(post.channels) ? post.channels : [];
      if (!channels.length) throw new Error("Nenhum canal configurado.");
      const unsupported = channels.filter((channel: string) => channel !== "telegram");
      if (unsupported.length) throw new Error(`Canal não suportado pelo publicador: ${unsupported.join(", ")}.`);
      if (!post.message_template?.trim()) throw new Error("Mensagem da publicação está vazia.");
      for (const channel of channels) if (channel === "telegram") await sendTelegram(post.message_template.trim());
      const { error: publishError } = await supabase.from("scheduled_posts").update({ status: "published", published_at: new Date().toISOString(), error_message: null }).eq("id", post.id).eq("status", "processing");
      if (publishError) throw new Error(`Publicação enviada, mas não foi possível atualizar o status: ${publishError.message}`);
      results.push({ id: post.id, status: "published" });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro desconhecido ao publicar.";
      await supabase.from("scheduled_posts").update({ status: "failed", error_message: message }).eq("id", post.id).eq("status", "processing");
      results.push({ id: post.id, status: "failed", error: message });
    }
  }
  return { processed: results.length, results };
}

Deno.serve(async (request) => {
  if (request.method !== "POST") return new Response(JSON.stringify({ service: "scheduled-publishing", status: "ready", method: "POST required" }), { status: 200, headers: { "content-type": "application/json" } });
  try {
    await verifyGitHubOidc(request);
    let body: unknown = {};
    try { body = await request.json(); } catch { body = {}; }
    const limitValue = typeof body === "object" && body !== null && "limit" in body ? (body as { limit?: unknown }).limit : undefined;
    const limit = limitValue === undefined ? 10 : Number(limitValue);
    if (!Number.isInteger(limit) || limit < 1 || limit > 50) return new Response(JSON.stringify({ success: false, error: "limit deve ser um inteiro entre 1 e 50." }), { status: 400, headers: { "content-type": "application/json" } });
    return new Response(JSON.stringify({ success: true, ...(await runScheduledPublishing(limit)) }), { status: 200, headers: { "content-type": "application/json" } });
  } catch (error) {
    const unauthorized = error instanceof Error && error.message === "Unauthorized";
    const message = unauthorized ? "Unauthorized" : error instanceof Error ? error.message : "Erro interno ao processar publicações.";
    return new Response(JSON.stringify({ success: false, error: message }), { status: unauthorized ? 401 : 500, headers: { "content-type": "application/json" } });
  }
});
