import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { runScheduledPublishing } from "@/lib/scheduled-publishing.server";

const workerRequestSchema = z.object({
  limit: z.number().int().min(1).max(50).optional(),
});

function isAuthorized(request: Request): boolean {
  const expectedSecret = process.env["SCHEDULED_PUBLISHING_WORKER_SECRET"]?.trim();
  if (!expectedSecret) return false;

  const authorization = request.headers.get("authorization") ?? "";
  const prefix = "Bearer ";
  if (!authorization.startsWith(prefix)) return false;

  const providedSecret = authorization.slice(prefix.length).trim();
  return providedSecret.length > 0 && providedSecret === expectedSecret;
}

export const Route = createFileRoute("/api/scheduled-publishing")({
  server: {
    handlers: {
      GET: async () => {
        const configured = Boolean(process.env["SCHEDULED_PUBLISHING_WORKER_SECRET"]?.trim());
        return Response.json(
          {
            service: "scheduled-publishing-worker",
            configured,
            status: configured ? "ready" : "not_configured",
          },
          { status: configured ? 200 : 503 },
        );
      },
      POST: async ({ request }) => {
        if (!isAuthorized(request)) {
          return Response.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }

        let body: unknown = {};
        try {
          body = await request.json();
        } catch {
          body = {};
        }

        const parsed = workerRequestSchema.safeParse(body);
        if (!parsed.success) {
          return Response.json(
            { success: false, error: "Payload inválido.", details: parsed.error.flatten() },
            { status: 400 },
          );
        }

        try {
          const result = await runScheduledPublishing(parsed.data.limit ?? 10);
          return Response.json({ success: true, ...result });
        } catch (error) {
          const message = error instanceof Error ? error.message : "Erro interno ao processar publicações.";
          console.error("[Scheduled Publishing Worker]", error);
          return Response.json({ success: false, error: message }, { status: 500 });
        }
      },
    },
  },
});
