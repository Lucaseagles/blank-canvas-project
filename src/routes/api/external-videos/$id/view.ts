import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/api/external-videos/$id/view')({
  server: {
    handlers: {
      POST: async ({ params, request }) => {
        const { createServerClient } = await import('@/integrations/supabase/server');
        const supabase = await createServerClient(request);
        const { error } = await supabase.rpc('increment_external_video_view', { video_id: params.id });
        if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { 'content-type': 'application/json' } });
        return new Response(JSON.stringify({ ok: true }), { headers: { 'content-type': 'application/json' } });
      },
    },
  },
});
