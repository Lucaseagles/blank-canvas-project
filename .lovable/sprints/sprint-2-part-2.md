# SPRINT 2 (PARTE 2/3) — FAVORITES & PRICE ALERTS

## CONTEXT

Trazido do Sprint 10 do roadmap original (ADR-006), porque a infraestrutura de `price_history` e `analytics_events` já existe desde o Sprint 1 — implementar favoritos e alertas de preço agora tem custo baixo e entrega um loop de engajamento real (motivo para o usuário voltar ao app).

**Importante:** ainda não existe motor de notificação push nem Telegram (Sprints 11 e 12). Os alertas nesta Parte são **in-app apenas** — nunca simular envio de push/e-mail/Telegram que não existe de fato.

## OBJECTIVE

Permitir que o usuário salve produtos como favoritos e configure alertas de queda de preço, com feedback visual imediato e persistência real — usando os componentes e o motion system definidos na Parte 1.

## WHAT MUST BE BUILT

### 1. Favorites
- Ícone de coração no `ProductCard` e em `/product/:slug`, com toggle otimista (UI atualiza antes da confirmação do servidor, revertendo se falhar).
- `/favorites`: listagem real dos produtos favoritados, reaproveitando o grid/card já definido — nunca uma lista genérica.
- Evento `ADD_FAVORITE`/`REMOVE_FAVORITE` já previsto na arquitetura de eventos do Sprint 0 — conectar de fato ao `trackEvent`, alimentando o Personalization Engine (favoritar já tem peso +5 definido em `personalization_weights`).

### 2. Price Alerts
- No `/product/:slug`, opção "Avise quando baixar" — abre um modal simples (reaproveitar componente Modal da Parte 1) perguntando o preço-alvo (ou "qualquer queda").
- Sistema verifica a condição sempre que `price_history` recebe um novo registro (reaproveitar o trigger já existente do Sprint 1 — não duplicar lógica de captura de preço).
- Quando a condição é satisfeita, gerar uma notificação **in-app** (tabela `notifications`), exibida via um sino na navbar com contador de não-lidas.

## DATABASE

```sql
favorites (id, user_id, product_id, created_at)
price_alerts (id, user_id, product_id, target_price, is_active, created_at, triggered_at)
notifications (id, user_id, type, title, body, product_id, read, created_at)
```

## BACKEND

- Trigger/função reaproveitando o mecanismo de `price_history` (Sprint 1): ao inserir novo preço, verificar `price_alerts` ativos daquele produto e, se a condição bater, criar registro em `notifications` e marcar `price_alerts.triggered_at`.
- Endpoint/RPC para toggle de favorito com verificação de RLS (usuário só manipula os próprios favoritos).

## FRONTEND

- Ícone de coração com micro-animação de toggle (scale + fade, seguindo o motion system da Parte 1 — nunca bounce exagerado).
- Sino de notificações na navbar com badge de contador (atualização em tempo real via Supabase Realtime, se já disponível no projeto; caso contrário, poll simples a cada carregamento de página — não implementar infra de realtime nova só para isso neste momento).
- `/favorites` com estado vazio elegante ("Você ainda não salvou nada" + CTA para explorar).

## UX/UI

- Toggle de favorito deve dar feedback instantâneo (sem esperar round-trip do servidor para atualizar o ícone).
- Badge do sino de notificação: contador simples, sem animação contínua (nada de pulsar infinitamente — respeitar a regra de motion da Parte 1).
- Modal de "avise quando baixar" com o mesmo padrão visual dos demais modais já definidos.

## SECURITY

- RLS: usuário só lê/escreve os próprios `favorites`, `price_alerts` e `notifications`.
- `personalization_weights` continua só leitura/escrita por `owner` (nenhuma mudança aqui).

## PERFORMANCE

- `/favorites` paginado como as demais listagens.
- Verificação de `price_alerts` deve ocorrer no banco (trigger/função), nunca em loop no client.

## QA

- Favoritar/desfavoritar reflete instantaneamente na UI e persiste após reload.
- Alterar preço de um produto no admin dispara notificação in-app para quem tiver alerta ativo.
- Usuário não vê favoritos/alertas de outro usuário (testar diretamente via query com outro usuário autenticado).
- Testar em conexão lenta: toggle otimista deve reverter corretamente se a escrita falhar.

## ACCEPTANCE CRITERIA

- [ ] Favoritar/desfavoritar funcional com persistência real e evento de tracking
- [ ] `/favorites` lista produtos reais do usuário, paginado, com estado vazio elegante
- [ ] Alerta de preço configurável por produto
- [ ] Notificação in-app gerada corretamente quando o preço cai
- [ ] Sino de notificação com contador funcional
- [ ] RLS cobrindo `favorites`, `price_alerts`, `notifications`

## DO NOT BREAK

- Tokens e motion system definidos na Parte 1
- Personalization Engine, feed, busca, categoria, admin do Sprint 1

## DO NOT IMPLEMENT

- Push notifications reais (Sprint 11)
- Envio via Telegram (Sprint 12)
- E-mail transacional
- Qualquer simulação de canal de distribuição que ainda não existe de verdade

## FINAL VERIFICATION

Reportar: favoritos e alertas funcionando ponta a ponta, volume de notificações geradas em teste, qualquer edge case encontrado (ex.: produto excluído com alerta ativo), e recomendação para a Parte 3.
