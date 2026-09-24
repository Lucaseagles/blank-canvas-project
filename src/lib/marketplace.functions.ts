import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireOwnerRole } from "./auth-guards.server";

const marketplaceSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(2).max(120),
  slug: z.string().trim().min(2).max(120).regex(/^[a-z0-9]+(?:-[a-z0-9-]*[a-z0-9])?$/),
  status: z.enum(["active", "pending", "disabled"]),
  affiliate_link_structure: z.string().trim().max(2000).optional().nullable(),
});

export const listAdminMarketplaces = createServerFn({ method: "GET" })
  .middleware([requireOwnerRole])
  .handler(async () => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("marketplaces")
      .select("id,name,slug,status,api_status,created_at,updated_at,affiliate_link_structure")
      .order("name");
    if (error) throw error;
    return data ?? [];
  });

export const getAdminMarketplace = createServerFn({ method: "GET" })
  .middleware([requireOwnerRole])
  .validator((data: unknown) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row, error } = await supabaseAdmin
      .from("marketplaces")
      .select("id,name,slug,status,api_status,created_at,updated_at,affiliate_link_structure")
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw error;
    if (!row) throw new Error("Marketplace não encontrado.");
    return row;
  });

export const saveAdminMarketplace = createServerFn({ method: "POST" })
  .middleware([requireOwnerRole])
  .validator((data: unknown) => marketplaceSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const payload = {
      name: data.name,
      slug: data.slug,
      status: data.status,
      affiliate_link_structure: data.affiliate_link_structure || null,
      updated_at: new Date().toISOString(),
    };

    let rowId = data.id;
    let previous: unknown = null;

    if (data.id) {
      const { data: existing, error: readError } = await supabaseAdmin
        .from("marketplaces")
        .select("*")
        .eq("id", data.id)
        .maybeSingle();
      if (readError) throw readError;
      if (!existing) throw new Error("Marketplace não encontrado.");
      previous = existing;

      const { error } = await supabaseAdmin.from("marketplaces").update(payload).eq("id", data.id);
      if (error) throw error;
    } else {
      const { data: created, error } = await supabaseAdmin
        .from("marketplaces")
        .insert(payload)
        .select("id")
        .single();
      if (error) throw error;
      rowId = created.id;
    }

    await (supabaseAdmin as any).from("admin_audit_log").insert({
      actor_user_id: context.userId,
      actor_email: context.userEmail ?? null,
      action_type: data.id ? "MARKETPLACE_UPDATED" : "MARKETPLACE_CREATED",
      entity_type: "marketplaces",
      entity_id: rowId,
      previous_value: previous,
      new_value: payload,
    });

    return { success: true, id: rowId };
  });

export const deleteAdminMarketplace = createServerFn({ method: "POST" })
  .middleware([requireOwnerRole])
  .validator((data: unknown) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: existing, error: readError } = await supabaseAdmin
      .from("marketplaces")
      .select("*")
      .eq("id", data.id)
      .maybeSingle();
    if (readError) throw readError;
    if (!existing) throw new Error("Marketplace não encontrado.");

    const { data: linked, error: linkedError } = await supabaseAdmin
      .from("products")
      .select("id")
      .eq("marketplace_id", data.id)
      .limit(1);
    if (linkedError) throw linkedError;
    if ((linked?.length ?? 0) > 0) {
      throw new Error("Não é possível excluir: existem produtos vinculados. Desative o marketplace ou reatribua os produtos antes.");
    }

    const { error } = await supabaseAdmin.from("marketplaces").delete().eq("id", data.id);
    if (error) throw error;

    await (supabaseAdmin as any).from("admin_audit_log").insert({
      actor_user_id: context.userId,
      actor_email: context.userEmail ?? null,
      action_type: "MARKETPLACE_DELETED",
      entity_type: "marketplaces",
      entity_id: data.id,
      previous_value: existing,
      new_value: null,
    });

    return { success: true };
  });
