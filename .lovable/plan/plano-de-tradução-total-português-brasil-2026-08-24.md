# Plano de Tradução Total — Português (Brasil)

Tradução completa de toda a interface do usuário para Português (Brasil), mantendo a terminologia técnica "Premium Intelligence" em locais estratégicos para preservar a identidade tecnológica da marca.

## Alterações de Conteúdo

### Componentes Globais
- **Navbar.tsx**: "Search products..." -> "Buscar produtos...", "Commander/Operator" -> "Comandante/Operador", "Saved Signals" -> "Sinais Salvos", "Command Center" -> "Centro de Comando".
- **Footer.tsx**: Descrição da plataforma, nomes das seções (Plataforma, Suporte), links de suporte.
- **ProductCard.tsx**: "Acquire Now" -> "Adquirir Agora", "Watch" -> "Assistir", "reviews" -> "avaliações".

### Páginas Públicas
- **Home (index.tsx)**: Hero section ("FUTURE OFFERS TODAY" -> "O FUTURO DAS OFERTAS, HOJE."), CTAs, Badges de confiança.
- **Feed (feed.tsx)**: Cabeçalho, descrições de inteligência, mensagens de carregamento.
- **Trending (trending.tsx)**: Descrições de algoritmos e sinais de alta velocidade.
- **Search (search.tsx)**: Interface de busca global, placeholders.
- **Videos (videos.tsx)**: Interface de Video Commerce imersivo.
- **Product Details ($slug.tsx)**: Descrições técnicas, botões de ação, modais de alerta de preço.
- **Category ($slug.tsx)**: Classificação de setor, descrições de análise heurística.

### Páginas de Usuário
- **Auth/Register (auth.tsx, register.tsx)**: Formulários de login, "Identity Check", "New Operator", etiquetas de campos.
- **Profile (profile.tsx)**: Dashboard de Gamificação (Neural XP), protocolos de descoberta, preferências de rede.
- **Alerts (alerts.tsx)**: Monitores ativos, histórico de sinais.
- **Favorites (favorites.tsx)**: Vault criptografado, sinais salvos.

## Detalhes Técnicos
- Substituição de strings literais nos arquivos TSX.
- Manutenção da formatação de moeda (R$ e separadores brasileiros).
- Preservação da voz de marca "Tecnológica e Premium".
- Atualização dos metadados de SEO (títulos e descrições) nas rotas.
