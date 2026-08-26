import { getRequest } from "@tanstack/react-start/server";

const DEFAULT_WEIGHTS = { view: 1, click: 3, favorite: 5 };

export async function loadWeights() {
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("personalization_weights")
      .select("signal_key, weight");
    if (error) return DEFAULT_WEIGHTS;

    const weights: Record<string, number> = {};
    data?.forEach((item) => {
      weights[item.signal_key] = Number(item.weight);
    });
    return weights["view"] ? weights : DEFAULT_WEIGHTS;
  } catch {
    return DEFAULT_WEIGHTS;
  }
}

export async function verifyOptionalUser(userId: string | null): Promise<void> {
  if (!userId) return;

  const request = getRequest();
  const token = request?.headers.get("authorization")?.replace(/^Bearer\s+/, "");
  if (!token || token.split(".").length !== 3) {
    throw new Error("Unauthorized: authenticated feed requires a valid session");
  }

  const { createClient } = await import("@supabase/supabase-js");
  const url = process.env["SUPABASE_URL"];
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"];
  if (!url || !key) throw new Error("Supabase configuration unavailable");

  const client = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await client.auth.getClaims(token);
  if (error || data?.claims?.sub !== userId) {
    throw new Error("Unauthorized: user identity mismatch");
  }
}