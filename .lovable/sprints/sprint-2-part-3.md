# SPRINT 2 (PARTE 3/3) — FEED EXPLORATION MIX & AUDITORIA FINAL

## CONTEXT
O `/feed` hoje ordena por `recommendation_score` puro (relevância). Isso tende a prender o usuário sempre nas mesmas categorias, sem espaço para descoberta — o problema clássico de "bolha de filtro". Esta parte completa o Feed Algorithm original (mix configurável 70/20/10) e fecha o Sprint 2 com uma auditoria conjunta (visual + funcional) das três partes.

## OBJECTIVE
Introduzir um mix configurável entre relevância, conteúdo relacionado e descoberta no `/feed`, com mecanismo de anti-repetição, e consolidar a validação final de todo o Sprint 2.

## WHAT MUST BE BUILT

### 1. Feed Mix configurável
- Tabela de configuração com os três percentuais (relevante / relacionado / descoberta), editável futuramente pelo admin — não hardcoded no código.
- **Relevante**: o `recommendation_score` já existente (Sprint 1) — produtos das categorias de maior interesse do usuário.
- **Relacionado**: produtos de categorias adjacentes às de maior interesse (ex.: usuário forte em "Eletrônicos" → mostrar também "Games", se houver relação de categoria pai/irmã).
- **Descoberta**: produtos de categorias fora do interesse conhecido do usuário, priorizando os de maior `quality_score`/novidade — nunca aleatório puro sem nenhum critério de qualidade.

### 2. Anti-repetição
- Registrar os últimos N produtos já mostrados ao usuário (por sessão ou por período curto, ex.: últimas 24h) e aplicar penalidade no score para evitar repetir o mesmo item ou saturar uma única categoria em sequência.

### 3. Transparência do mix (leve, sem virar ruído visual)
- Rótulos discretos no feed diferenciando os blocos (ex.: um pequeno label "Baseado no que você gosta" vs. "Para você descobrir") — usando a tipografia/tokens da Parte 1, nunca como banner chamativo.

## DATABASE
```sql
feed_mix_config (id, relevant_pct, related_pct, discovery_pct, updated_at)
recently_shown (id, user_id, product_id, shown_at)
```

## BACKEND
- Evoluir a função `getRecommendationsForUser`/`get_personalized_recommendations` (Sprint 1) para compor o feed final combinando os três blocos conforme `feed_mix_config`, aplicando a penalidade de `recently_shown`.
- Não recriar a função do zero — estender a já existente para preservar o que funciona.

## UX/UI
- Rótulos de seção discretos, mesma família tipográfica/tokens da Parte 1 (sem novo componente visual paralelo).
- Nenhuma mudança de layout do ProductCard — só a composição da lista muda.

## QA
- Rodar o feed várias vezes para o mesmo usuário e confirmar que a proporção relevante/relacionado/descoberta se mantém próxima da configurada ao longo de várias cargas.
- Confirmar que um produto já visto recentemente não reaparece imediatamente na próxima carga.

## ACCEPTANCE CRITERIA
- [ ] `feed_mix_config` criada e consumida pela função de recomendação
- [ ] Mix 70/20/10 (ou o valor configurado) perceptível em múltiplas cargas do feed
- [ ] Penalidade de repetição funcionando (`recently_shown`)
- [ ] Rótulos discretos de contexto no feed, sem poluição visual
- [ ] Nenhuma regressão de performance ou visual em relação às Partes 1 e 2
