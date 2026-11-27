import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireOwnerRole } from "@/lib/auth-guards.server";

export const updateProductImagesAudited = createServerFn({ method: "POST" })
  .middleware([requireOwnerRole])
  .inputValidator((input) => z.object({
    productId: z.string().uuid(),
    images: z.array(z.string().url().max(2000)).max(30),
    expectedUpdatedAt: z.string().datetime({ offset: true }),
  }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: result, error } = await (supabaseAdmin as any).rpc("rubi_update_product_images_audited", {
      p_product_id: data.productId,
      p_images: data.images,
      p_actor: context.userId,
      p_expected_updated_at: data.expectedUpdatedAt,
    });
    if (error) throw new Error(error.message);
    if (result?.id !== data.productId || !result?.updated_at) {
      throw new Error("A galeria e sua auditoria não foram confirmadas.");
    }
    return result as { id: string; updated_at: string; image_count: number };
  });
