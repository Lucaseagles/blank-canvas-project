# Sprint 3 (Parte 2/2) — Video Commerce: Experiência de Consumo

Construção da experiência pública de consumo de vídeo com feed vertical (estilo Reels), tracking de engajamento e integração total com o motor de personalização.

## User Review Required

> [!IMPORTANT]
> A experiência de vídeo vertical (`/videos`) usará `autoplay` com som desligado (muted) por padrão para garantir compatibilidade com navegadores e UX fluida. O usuário poderá ativar o som manualmente.

## Technical Details

### 1. Frontend: Feed Vertical
- **Nova Rota:** `/videos` com layout `snap-scroll` vertical.
- **Componente:** `VideoFeedItem` integrando `VideoPlayer` com lógica de visibilidade (autoplay apenas no vídeo ativo).
- **Performance:** Implementação de `IntersectionObserver` para pré-carregar apenas o próximo vídeo e pausar vídeos fora de vista.

### 2. Analytics & Personalização
- **Tracking:** Eventos `VIDEO_START`, `VIDEO_COMPLETE` (90%+ watch time) e `VIDEO_SKIP` via `trackEvent`.
- **Pesos:** Atualização da tabela `personalization_weights` via migração para incluir sinais de vídeo.
- **Interesses:** Evolução da função `updateInterestScore` para processar sinais vindos de interações com vídeos.

### 3. Integração de Feed
- **Feed Mix:** Atualização do `getPersonalizedFeed` para incluir vídeos com produtos associados como itens elegíveis no mix de descoberta.
- **UI:** Exibição de cards de vídeo no feed principal com o estilo premium já definido.

### 4. Database & Backend
- **Migração:** Inserção dos novos pesos de personalização.
- **Server Functions:** Novas funções em `video.functions.ts` para buscar o feed de vídeos otimizado.

## Database Changes
```sql
-- Adicionar pesos padrão para vídeos
INSERT INTO public.personalization_weights (signal_key, weight)
VALUES 
  ('video_start', 1),
  ('video_complete', 4),
  ('video_skip', -1)
ON CONFLICT (signal_key) DO UPDATE SET weight = EXCLUDED.weight;
```
