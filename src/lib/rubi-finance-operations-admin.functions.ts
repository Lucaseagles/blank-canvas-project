import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireOwnerRole } from "./auth-guards.server";

const allocateInput = z.object({
  entry_id: z.string().uuid(),
  obligation_id: z.string().uuid(),
  amount: z.number().positive().finite(),
  note: z.string().max(500).optional(),
});

export const allocateFinanceEntryAdmin = createServerFn({ method: "POST" })
  .middleware([requireOwnerRole])
  .validator((input: unknown) => allocateInput.parse(input))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: allocationId, error } = await (supabaseAdmin as any).rpc("rubi_finance_allocate_entry", {
      p_entry_id: data.entry_id,
      p_obligation_id: data.obligation_id,
      p_amount: data.amount,
      p_actor: context.userId,
      p_note: data.note ?? null,
    });
    if (error) throw error;
    return { allocationId: allocationId as string };
  });

const reverseInput = z.object({
  entry_id: z.string().uuid(),
  effective_at: z.string().datetime({ offset: true }),
  reason: z.string().trim().min(8).max(500),
});

export const reverseFinanceEntryAdmin = createServerFn({ method: "POST" })
  .middleware([requireOwnerRole])
  .validator((input: unknown) => reverseInput.parse(input))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: reversalId, error } = await (supabaseAdmin as any).rpc("rubi_finance_reverse_entry", {
      p_entry_id: data.entry_id,
      p_effective_at: data.effective_at,
      p_reason: data.reason,
      p_actor: context.userId,
    });
    if (error) throw error;
    return { reversalId: reversalId as string, externalProviderActionRequired: true };
  });
