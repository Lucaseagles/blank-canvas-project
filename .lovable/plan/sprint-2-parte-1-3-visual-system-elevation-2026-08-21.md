# Sprint 2 (Parte 1/3) — Visual System Elevation

Formalizar e elevar o visual premium em um sistema de design explícito, garantindo performance e acessibilidade global.

## Technical Details

### 1. Design Tokens & oklch (src/styles.css)
- Centralizar a paleta premium (azul profundo/slate) em tokens semânticos: `--surface-base`, `--surface-elevated`, `--surface-glass`, `--accent-primary`, etc.
- Implementar 4 níveis de elevação (`elevation-0` a `elevation-3`) combinando sombras e ajustes de luminosidade oklch.
- Garantir contraste WCAG AA (4.5:1) em todos os temas.

### 2. Glassmorphism Seguro
- Padronizar `backdrop-filter: blur(12px)` e limitar a 2 camadas simultâneas.
- Adicionar fallback sólido via `@supports (not (backdrop-filter: blur(1px)))`.
- Remover glassmorphism de listas longas para manter 60fps no scroll.

### 3. Motion System (Performance & Acessibilidade)
- Respeitar `prefers-reduced-motion` globalmente.
- Animar exclusivamente `transform` e `opacity` para aceleração por GPU.
- Padronizar durações (120-200ms para micro-interações, 250-400ms para transições) e curvas de easing.
- Implementar `IntersectionObserver` para animações "reveal" disparadas uma única vez.

### 4. Refinamento de Componentes
- **Navbar**: Transição suave de transparência para glass ao rolar via throttle.
- **Hero**: Efeito de fundo otimizado (CSS puro, sem WebGL pesado).
- **ProductCard**: Micro-interações de hover (escala 1.03) e skeletons de shimmer suave.
- **Admin**: Alinhar visual do dashboard com a estética premium do site público, mantendo alta densidade de dados.

### 5. Padronização de Estados
- Unificar telas de erro, loading e estados vazios com a nova linguagem visual.

## User Review Required

> [!IMPORTANT]
> A implementação de `prefers-reduced-motion` pode desativar algumas animações decorativas para usuários que têm essa preferência no sistema operacional. Isso é intencional para acessibilidade.

- A paleta de cores azul/slate profundo atende às suas expectativas de "Premium"?
- Você prefere animações mais rápidas e secas (120ms) ou mais fluidas e cinematográficas (400ms)?
