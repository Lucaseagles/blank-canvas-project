# Sprint 4 (Parte 2/2) — Reaplicação do Visual Premium

Audit visual de todas as rotas após a recuperação do sistema de design (Sprint 4 Parte 1) para garantir consistência premium absoluta.

## Objetivos
- Confirmar que todas as 30+ rotas (públicas, conta e admin) estão usando os tokens oklch, tipografia Inter e efeitos glass.
- Corrigir qualquer "renderização crua" (estilos padrão de navegador).
- Garantir performance e fallbacks seguros para `backdrop-filter`.

## Varredura e Correções

### 1. Rotas Públicas
- **Home (`/`)**: Já verificada na Parte 1.
- **Feed (`/feed`)**: Atualizar skeleton, badges e cards para usar os novos tokens.
- **Catálogo (`/products`)**: Refinar paginação e filtros.
- **Trending (`/trending`)** & **Deals (`/deals`)**: Garantir que as badges e cabeçalhos usem a tipografia Inter e cores oklch.
- **Busca (`/search`)**: Estilizar o input de busca e resultados.
- **Vídeos (`/videos`)**: Refinar a interface de snap-scroll e badges de produto.

### 2. Rotas de Conta
- **Auth (`/auth` & `/register`)**: Padronizar as sombras e o glass dos formulários.
- **Perfil (`/profile`)**: Refinar o visual do "Discovery IQ" e tabs.
- **Favoritos (`/favorites`)** & **Alertas (`/alerts`)**: Padronizar as listas e estados vazios.

### 3. Dashboard Admin (`/admin/*`)
- Varredura das 16 rotas administrativas.
- Garantir que o "Command Center" e todas as tabelas/formulários administrativos sigam o tema dark premium.

## Detalhes Técnicos
- Uso exclusivo de tokens `var(--color-*)` do Tailwind v4.
- Animações via `reveal-on-scroll` em todas as páginas.
- Fallback para `backdrop-filter` via `bg-glass-fallback`.
- Verificação de contraste e acessibilidade.

## QA & Validação
- Captura de screenshots de todas as rotas via Playwright.
- Teste de performance (Lighthouse/Mobile throttling).
- Confirmação de 100% de cobertura visual premium.
