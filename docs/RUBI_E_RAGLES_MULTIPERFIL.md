# HUB EAGLES — Fundação multicomercial (especificação de implementação)

Marca oficial: **Hub Eagles**. Nome editável somente pelo owner no Admin; preservar nome configurável, sem hardcode futuro. A vitrine própria é uma **seção de catálogo**, nunca um quarto tipo de login.

## Perfis comerciais (independentes dos papéis administrativos)
1. **Quero comprar para mim** — consumidor: ofertas de marketplaces por afiliado, produtos da marca, vídeos, cupons, canais oficiais, recomendações e algoritmo por relevância, preço total, qualidade e interesses.
2. **Tenho uma loja ou comércio** — lojista: catálogo B2B, produtos da marca/Kairos elegíveis, custo unitário por faixa, pedido mínimo, preço por volume, margem de revenda estimada, disponibilidade, frete e fornecedor. Margem comercial pequena, mas configurável pelo owner; nunca revelar custo confidencial sem autorização.
3. **Quero divulgar e ganhar comissões** — parceiro/microinfluenciador/afiliado: somente produtos elegíveis da operação própria (Kairos, após confirmação contratual), campanhas, links únicos, criativos, cliques, pedidos atribuídos, comissões pendentes/aprovadas/pagas e regras antifraude. **Não** habilitar campanhas de afiliado sobre produtos externos de marketplace sem contrato específico.

## Operação comercial
- **Produtos externos:** links afiliados de marketplaces; compra e logística externas; comissões dependem da plataforma.
- **Produtos próprios da marca:** fornecidos por parceiro logístico, inicialmente Kairos sujeito a documentação e contrato. Preço de venda definido pela operação, distinguindo receita, custo de mercadoria, frete, tributos, taxas, comissões e lucro.
- **Atacado:** preço e regras próprias por quantidade/cliente elegível; aprovação comercial antes de liberar tabelas restritas.
- **Divulgação:** páginas de achadinhos são um pilar, ao lado de microinfluenciadores, campanhas, tráfego pago, social, canais e outras estratégias.
- **Algoritmos por perfil:** consumidor = descoberta/relevância/preço final; lojista = margem/giro/volume/estoque/logística; parceiro = conversão provável, comissão, disponibilidade e conformidade. Ranking auditável; não inventar métricas nem simular vendas reais.

## Implementação incremental obrigatória
1. Auditar autenticação e perfis atuais. Preservar Supabase Auth, user_roles, RLS, triggers e guards. Criar perfis comerciais e relações muitos-para-muitos por usuário com onboarding, solicitações e aprovação owner; usuário não se autopromove a owner/lojista aprovado/parceiro autorizado.
2. Criar onboarding premium mobile-first e redirecionamento por perfil, com troca de contexto autorizada.
3. Criar fontes comerciais do catálogo: marketplace afiliado vs marca própria, fornecedor, custos protegidos, regras de varejo/atacado, estoque, logística, condições, campanhas e elegibilidade.
4. Criar vitrines e feeds por perfil sem duplicar catálogo; seção **Produtos da Hub Eagles** em consumidor e lojista; parceiro acessa apenas produtos próprios elegíveis.
5. Criar pedidos e cotações B2B, cálculo de frete e margem, tracking de fornecedor; não assumir checkout/API Kairos disponível.
6. Criar painel de parceiros: convites, aprovação, links atribuídos, conversões confirmadas, comissão, estornos, relatórios, antifraude e pagamentos.
7. Painel owner: identidade visual/nome, perfis, aprovação, fornecedores, preços, campanhas, margens, comissões, algoritmos por público e auditoria.
8. Verificar documentação e credenciais oficiais da Kairos antes de qualquer integração. Não inventar endpoints ou disponibilidade.
9. Executar TypeScript, ESLint, build, RLS e E2E por papel, dispositivo, compra e permissão antes de declarar pronto.

## Estado real
- Commit inicial cria identidade configurável, server functions e editor admin. A migração precisa ser aplicada ao banco; verificar que o nome propaga a cabeçalho, metadados e demais páginas.
- **Não implementados nesta etapa:** onboarding multirrole, catálogos B2B, API Kairos, pedidos, afiliados com comissionamento e algoritmos segmentados. Este documento preserva requisitos para os próximos sprints.
