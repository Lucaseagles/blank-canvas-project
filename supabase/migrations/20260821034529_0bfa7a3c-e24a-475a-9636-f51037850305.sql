-- Adicionar pesos padrão para vídeos no sistema de personalização
INSERT INTO public.personalization_weights (signal_key, weight)
VALUES 
  ('video_start', 1),
  ('video_complete', 4),
  ('video_skip', -1)
ON CONFLICT (signal_key) DO UPDATE SET weight = EXCLUDED.weight;

-- Garantir que a tabela analytics_events suporte metadados flexíveis para tracking de vídeo
GRANT INSERT, SELECT ON public.analytics_events TO authenticated, anon;
GRANT ALL ON public.analytics_events TO service_role;
