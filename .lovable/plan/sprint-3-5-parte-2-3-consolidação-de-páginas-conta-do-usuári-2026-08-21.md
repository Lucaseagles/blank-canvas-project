# Sprint 3.5 (Parte 2/3) — Consolidação de Páginas: Conta do Usuário & Vídeos

Este plano foca na implementação das rotas de conta do usuário e na finalização da experiência de vídeo, conectando-as ao backend existente com um design premium.

## 1. Autenticação e Cadastro (`/auth`, `/register`)
- Implementar formulários premium com glassmorphism.
- Conectar ao Supabase Auth para login, cadastro e recuperação de senha.
- Adicionar redirecionamento pós-login para a última página visitada ou `/profile`.

## 2. Perfil do Usuário (`/profile`)
- Expandir a página atual para incluir:
  - Preferências de categorias (multi-select).
  - Preferências de marketplaces.
  - Exibição do "Perfil de Interesse" (`user_interests`).
  - Upload/troca de avatar (via storage).

## 3. Alertas e Notificações (`/alerts`)
- Criar a página de alertas listando:
  - Alertas de preço ativos (com opção de editar/remover).
  - Histórico de notificações in-app.
  - Marcação de notificações como lidas.

## 4. Experiência de Vídeo (`/videos`)
- Refinar o feed vertical:
  - Garantir snap-scroll perfeito.
  - Implementar tracking de eventos (`VIDEO_START`, `VIDEO_COMPLETE`).
  - Adicionar interação de "curtir" (favoritar) diretamente no vídeo.

## 5. Navegação e Consistência
- Atualizar a `Navbar` e o menu móvel.
- Garantir que todas as rotas de conta sejam protegidas por RLS.
- Padronizar o visual "Premium Tech" em todas essas novas telas.

## Detalhes Técnicos
- **Auth:** Utilizar `supabase.auth` diretamente com validação via Zod.
- **Data:** Usar TanStack Query para gerenciar estados de alertas e favoritos.
- **UI:** Reaproveitar componentes do Shadcn com estilos `glass-surface` e animações de Sprint 2.
- **RLS:** Verificar políticas para `price_alerts` e `notifications`.
