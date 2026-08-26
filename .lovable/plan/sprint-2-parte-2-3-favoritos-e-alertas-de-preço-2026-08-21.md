# Sprint 2 (Parte 2/3) — Favoritos e Alertas de Preço

Implementação do sistema de favoritos, alertas de preço e notificações in-app para aumentar o engajamento e retenção dos usuários, utilizando a infraestrutura de dados já estabelecida.

## Mudanças

### Banco de Dados (Supabase)
- Criação das tabelas `favorites`, `price_alerts` e `notifications` com RLS.
- Implementação de trigger no banco de dados que verifica alertas de preço sempre que o histórico de preços (`price_history`) é atualizado.
- Criação de notificações in-app quando um alerta de preço é disparado.

### Backend (Server Functions)
- Função para alternar o status de favorito (toggle) com persistência real.
- Integração com o motor de personalização (favoritar aumenta o peso de interesse).
- Funções para gerenciar alertas de preço e ler notificações.

### Frontend e UI/UX
- Adição do ícone de favorito no `ProductCard` e na página de detalhes com animação otimista.
- Criação da página `/favorites` para listagem dos produtos salvos.
- Implementação do modal "Avise quando baixar" para configuração de alertas.
- Adição do sino de notificações na Navbar com contador em tempo real.

## Detalhes Técnicos

### Esquema de Tabelas
```sql
favorites (id, user_id, product_id, created_at)
price_alerts (id, user_id, product_id, target_price, is_active, created_at, triggered_at)
notifications (id, user_id, type, title, body, product_id, read, created_at)
```

### Regras de Segurança (RLS)
- Usuários autenticados podem gerenciar apenas seus próprios dados.
- O acesso anon é restrito apenas a leituras públicas já existentes (produtos, categorias).

### Motion System
- Micro-animações de toggle (scale + fade) nos favoritos.
- Transições de entrada/saída nos modais e listas seguindo o design system premium.

## QA e Validação
- Teste de toggle de favorito com feedback instantâneo (UI otimista).
- Verificação do disparo de notificações após alteração de preço no Admin.
- Garantia de isolamento de dados entre diferentes usuários autenticados.
