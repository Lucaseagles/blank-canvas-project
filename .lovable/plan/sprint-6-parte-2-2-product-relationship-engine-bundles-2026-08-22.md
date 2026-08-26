# Sprint 6 (Parte 2/2) — Product Relationship Engine & Bundles

Implementação do motor de relacionamentos entre produtos (Cross-sell, Upsell, Downsell) e sistema de bundles editoriais, completando a paridade de funcionalidades de e-commerce.

## User Review Required

> [!IMPORTANT]
> A vinculação de produtos será **manual** nesta fase via painel administrativo, conforme especificado no prompt.

- **Downsell Strategy**: O downsell aparecerá discretamente quando um usuário demonstrar "rejeição" (visualização curta ou remoção de favoritos). Você tem preferência por onde esse bloco deve aparecer na página do produto? (Sugestão: logo abaixo do botão de compra ou após as especificações técnicas).

## Proposed Changes

### Database & Schema
- Criar tabela `product_relationships` com tipos `CROSS_SELL`, `UPSELL`, `DOWNSELL`.
- Criar tabelas `bundles` e `bundle_products` para agrupamentos editoriais.
- Habilitar RLS e permissões para `owner`.

### Backend (Server Functions)
- `src/lib/relationships.functions.ts`: Funções para buscar relacionamentos e gerenciar bundles.
- `src/lib/relationships.server.ts`: Consultas SQL para buscar produtos relacionados (cross/up/down) em uma única chamada.

### Frontend & UI
- **Product Page (`/product/:slug`)**:
    - Adicionar seção "Costuma ser comprado com" (Cross-sell).
    - Adicionar seção "Uma versão melhor" (Upsell).
    - Implementar lógica de detecção de rejeição para exibir "Alternativa mais em conta" (Downsell).
- **Admin Dashboard**:
    - Nova rota `/admin/products/relationships` ou aba na edição do produto para gerenciar vínculos.
    - Nova rota `/admin/bundles` para criação e edição de kits.
- **Bundle View**:
    - Nova rota `/bundle/:slug` para exibir os produtos do kit com seus respectivos links de afiliado.

## Technical Details

### Database Migration
```sql
CREATE TYPE public.relationship_type AS ENUM ('CROSS_SELL', 'UPSELL', 'DOWNSELL');

CREATE TABLE public.product_relationships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
    related_product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
    type relationship_type NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(product_id, related_product_id, type)
);

CREATE TABLE public.bundles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    image_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.bundle_products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bundle_id UUID REFERENCES public.bundles(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
    position INTEGER DEFAULT 0
);
```

### UX Strategy
- **Downsell Trigger**: Usaremos o tracking de eventos existente. Se um `view_item` durar menos de 5 segundos OU um `remove_from_favorites` ocorrer, um sinal é enviado ao componente da página para renderizar a seção de Downsell.
- **Bundles**: Serão apresentados como "Curated Collections" para manter o tom premium e tecnológico.
