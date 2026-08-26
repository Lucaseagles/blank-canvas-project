# Plano: Sprint 3.5 (Parte 1/3) — Consolidação de Páginas: Descoberta

Este sprint foca em expor todas as funcionalidades de backend já implementadas (Personalization, Search, Price History, Videos) através de rotas públicas reais e funcionais.

## Auditoria de Rotas (Status Atual)
- `/feed`: EXISTE (Funcional, mas precisa de refinamento no mix).
- `/products`: EXISTE SÓ VISUAL (Placeholder).
- `/product/:slug`: EXISTE E FUNCIONAL (Completa).
- `/category/:slug`: EXISTE E FUNCIONAL (Básica).
- `/search`: EXISTE E FUNCIONAL (Básica).
- `/deals`: EXISTE SÓ VISUAL (Placeholder).
- `/trending`: EXISTE SÓ VISUAL (Placeholder).

## Ações Técnicas

### 1. Catalog & Vitrine (`/products`, `/category/:slug`)
- Criar/Atualizar `src/routes/products.tsx` para listar todos os produtos com paginação e filtros.
- Refinar `src/routes/category/$slug.tsx` para garantir consistência visual e dados completos.

### 2. Search Engine (`/search`)
- Melhorar a UI da página de busca e garantir que o `ProductCard` exiba indicadores de vídeo e marketplace.

### 3. Deals & Trending (`/deals`, `/trending`)
- Implementar `src/routes/deals.tsx` filtrando produtos com `discount > 0`.
- Implementar `src/routes/trending.tsx` usando um proxy de eventos de analytics (`PRODUCT_VIEW`, `PRODUCT_CLICK`) das últimas 72h.

### 4. Intelligent Feed & Personalization (`/feed`)
- Refinar `personalization.functions.ts` para garantir que o mix 70/20/10 seja respeitado e que o label `feedContext` seja preciso.
- Adicionar suporte a vídeos intercalados no feed.

### 5. Navegação Global
- Atualizar a `Navbar` e `Footer` em `src/routes/__root.tsx` para garantir que todos esses links estejam acessíveis e funcionais.

## Detalhes Técnicos
- **Backend:** Uso intensivo de `supabaseAdmin` em `createServerFn` para queries de agregação (trending) e filtros complexos.
- **Frontend:** Padronização do `ProductCard` e uso de `useSuspenseQuery` para consistência com o restante do app.
- **Analytics:** Garantir que o `trackEvent` seja chamado corretamente em cada nova interação nas páginas consolidadas.
