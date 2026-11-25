# RUBI Eagles — Inventário mestre de produto, operação e lacunas

Data: 2026-11-24
Base técnica observada: main após Sprint 306 / PR #307.
Auditoria paralela: Sprint 307 / PR #308.
Classificação: upgrade de governança e reconciliação; não concede pontos V1.
Pontuação de referência: **36,5/48 = 76,0%**. Gap aritmético: **11,5/48 = 23,96%**.

## 1. Objetivo, limites e regra de verdade

Este documento consolida requisitos históricos, decisões arquiteturais, planos de sprints e lacunas conhecidas. É um inventário mestre para reconciliação, não uma declaração de que todos os itens estão ausentes nem uma certificação de produção.

Estados:
- **Implementação observada:** código/rota/serviço identificado; pode faltar validação operacional.
- **Parcial / depende de evidência:** parte do fluxo existe, mas o aceite integral não está demonstrado.
- **Bloqueado externamente:** depende de API, contrato, credenciais, evento ou relatório do provedor.
- **Não revalidado nesta rodada:** requisito histórico importante que precisa ser confrontado com a main atual.
- **Fora de escopo aprovado:** não implementar sem nova decisão explícita.

A matriz V1 mede 48 critérios selecionados de cobertura técnica, não a porcentagem de todas as funcionalidades funcionando em produção. O registro Sprint 301 declara que não existe scorecard reconciliado atual, critério por critério, em 36,5/48. A matriz detalhada antiga de 31,5/48 não pode ser copiada como se fosse a distribuição atual. Primeiro reconciliar os 48 critérios com todos os PRs posteriores.

## 2. Arquitetura e princípios que não podem regredir

1. RUBI Eagles é um ecossistema comercial coordenado pelo aplicativo; não substitui redes sociais, marketplaces, fornecedores, checkouts, criadores, comunidades ou mídia paga.
2. Quatro motores: **Tráfego, Base, Funil e Oferta**. Ciclo: atrair → identificar origem → organizar base/consentimento → direcionar jornada → apresentar oferta → confirmar venda → pós-venda → recompra → aprendizado.
3. Cinco pilares: **Eclipse (consumidor/base), Store (marca própria/margem), Achadinhos (aquisição orgânica), Partners (rede de distribuição) e Business (lojistas/atacado)**.
4. Três perfis comerciais independentes: consumidor, lojista e parceiro. Shadow Master é governança administrativa privada, não um quarto perfil comercial.
5. Shadow Master permanece exclusivo ao Owner/fundador atual. Não criar segundo Master, nem remover isolamento, nem tornar o painel público para cumprir critério histórico de múltiplos Masters. O critério 11.4 deve ser formalmente revisto se não fizer mais parte do escopo.
6. Marca/nome do produto permanece configurável pelo Owner; não espalhar hardcodes RUBI/Hub Eagles sem revisar a decisão de marca.
7. Separar marketplace afiliado, loja própria/fornecedor, atacado B2B e venda atribuída a parceiro. Não misturar catálogo, pedidos, custos, comissões ou receita desses canais.
8. Nunca equiparar visualização, clique, redirect, pré-checkout, pedido reportado, venda confirmada, liquidação e repasse. Cada evento tem fonte, estado e evidência próprios.
9. BRL-first na operação brasileira; não somar moedas diferentes nem fazer conversão FX implícita.
10. IA recomenda, classifica e auxilia; não altera preço, orçamento, comissão, publicação ou comunicação em massa sem permissão, revisão e auditoria.
11. LGPD: consentimento, minimização, finalidade, retenção, revogação e direitos do titular em rastreamento, perfilamento, push, WhatsApp e campanhas.
12. Não criar endpoint, webhook, payload, integração ou capacidade de provedor por suposição.

## 3. Inventário de funcionalidades por domínio

### A. Identidade, onboarding e perfis

- Supabase Auth, recuperação de conta, sessão e proteção de rotas.
- Onboarding distinto para consumidor, lojista e parceiro, com aprovação e transição de contexto autorizada.
- Consumidor: preferências, nichos, categorias, busca, favoritos, histórico e consentimentos.
- Lojista: dados comerciais, qualificação, aprovação, região, necessidades, acesso a preços e cotações B2B.
- Parceiro: tipo (afiliado, nano/micro, influenciador, expert), nicho, audiência aproximada, canais, experiência, região/idioma, categorias e termos aceitos.
- Proibir autopromoção a lojista aprovado, parceiro aprovado ou Owner; revogação remove acessos e grants.
- Testar troca de contexto e isolamento entre perfis/contas.

**Estado:** implementação de onboarding e perfis observada; jornadas completas autenticadas e negativas precisam de evidência contínua. E2E local recente cobre quatro identidades em ambiente descartável; isso não é teste de produção nem teste humano do aplicativo hospedado.

### B. Consumidor — RUBI Eclipse

- Home/feed de descoberta, busca, categorias, filtros, ordenação e páginas de produto.
- Recomendações por interesses declarados e comportamento consentido: visualizações, buscas, favoritos, compras confirmadas, recência, preço total, relevância e qualidade.
- Histórico de navegação/produtos, favoritos e alertas de preço.
- Cupons e elegibilidade real; não exibir cupom expirado/esgotado ou não aplicável.
- Vídeos, Stories, demonstrações, conteúdo editorial, avaliações e prova social real/moderada.
- Notificações push, canais WhatsApp/Telegram opt-in e preferências/frequência.
- Indicação entre consumidores, regras de elegibilidade e antifraude.
- Reativação, retenção e recompra por coortes 30/60/90 dias, somente a partir de pedidos pagos/entregues válidos.
- Experiência mobile-first, acessibilidade, estados de loading/erro/vazio/sucesso, navegação e performance.

**Estado:** várias rotas e serviços de feed, onboarding, personalização, histórico, favoritos, cupons, notificações e social proof são observados. Lacunas de qualidade dos dados, comportamento real, coortes pagas, retenção e jornada hospedada precisam de revalidação. Não declarar personalização ou retenção eficaz apenas porque existe ranking/código.

### C. Store — produtos próprios / Kairos / fornecedores

- Catálogo de produtos RUBI/marca própria, fornecedores, SKU, preço varejo, custo confidencial, margem, imagens/vídeos, disponibilidade e status.
- Página de produto e página editorial de oferta aprovadas pelo Master.
- Preços e promoções verdadeiros, histórico de preço quando aplicável, regras de desconto e expiração.
- Vitrine premium, busca, categorias, coleções, kits e bundles.
- Página de oferta: promessa comprovável, benefícios, prova, criativo, CTA, preço e condições.
- Checkout externo oficial e validado por host exato; retorno do provedor e pedido conciliados.
- Cancelamento, reembolso, chargeback, entrega, suporte e pós-venda.
- Estoque, frete e disponibilidade somente quando fonte do fornecedor os confirmar.
- Conteúdo e mídia com direitos de uso aprovados.

**Estado:** catálogo, pré-checkout e playbook editorial existem no código. A própria interface e documentação identificaram dependência de integração/checkout/entrega do fornecedor. Não foi provado ciclo pago/liquidado Kairos. Não inventar API. A base de catálogo foi vista vazia em consulta anterior; precisa recontagem no momento da ativação.

### D. Achadinhos Orgânico / aquisição externa

- Feed/vitrine de achadinhos por nicho, categorias e produtos.
- Vídeos curtos originais para TikTok, Reels, Shorts, Kwai, Pinterest e Facebook/Instagram.
- Links afiliados oficiais para Shopee, AliExpress, Mercado Livre, TikTok Shop e outros marketplaces autorizados.
- Página RUBI intermediária, links UTM, origem por canal/campanha/publicação e redirecionamento rastreável.
- Calendário/editorial, biblioteca de criativos, direitos de uso, variações por canal e reaproveitamento de conteúdo.
- Distribuição por canais e comunidades com consentimento.
- SEO de páginas indexáveis e conteúdo de nicho.
- Relatório por canal, campanha, produto, criativo e parceiro; distinguir clique e venda externa reportada.
- Conversão externa e comissão só após relatório oficial/atribuição suportada pelo marketplace.

**Estado:** links UTM, páginas, vídeos e dashboards orgânicos aparecem no código. Distribuição multicanal plenamente executada, conversões afiliadas e atribuição por marketplace não foram comprovadas. Cada marketplace precisa ser homologado separadamente.

### E. Partners — afiliados, criadores e rede

- Candidatura e onboarding por tipo de parceiro; aprovação manual e termos.
- Categorias e acordos diferenciados para afiliados, microfranqueados, experts, nano/micro e influenciadores.
- Grants individuais de produtos, campanhas e revogação.
- Vitrine pública própria por parceiro, com URL estável e somente produtos autorizados.
- Link por parceiro + produto + campanha/publicação; QR code e origem.
- Kit de divulgação: vídeos, criativos, copys, página aprovada, regras e alegações permitidas.
- CRM da rede, convites, onboarding, acompanhamento e metas.
- Painel individual: visualizações, cliques, redirects, checkouts iniciados (se observáveis), pedidos reportados, vendas confirmadas, comissão calculada/elegível/pendente/paga/ajustada.
- Histórico e extrato, pagamentos parciais, comprovantes permitidos e exportação.
- Regras progressivas de comissão por produto e metas somente quando configuradas no acordo; versionamento e snapshot por venda.
- Antifraude, duplicidade, disputa de atribuição, cancelamento, estorno e chargeback.
- Shadow Master: visão global, contratos, grants, vitrines, campanhas, pedidos, conciliação, obrigações e repasses.
- Parceiro A jamais lê dados de B; não expor dados pessoais do comprador além do mínimo.

**Estado:** portal, grants, links, visitas, comissões, relatórios e vitrine pública estão identificados no código/documentação. Confirmação externa de venda, atribuição por provedor, liquidação e repasse real continuam bloqueadores. Não prometer comissão automática sem suporte de sub-affiliate/metadata/relatório oficial.

### F. Business — lojistas / atacado / reposição

- Onboarding e aprovação comercial.
- Catálogo B2B separado, preço por faixa, pedido mínimo, quantidade, custo protegido e margem estimada.
- Cotações, negociação, resposta Master e histórico.
- Carrinho/pedido B2B, pagamento, frete, fornecedor, status e comprovante.
- Kits de abastecimento e recomendações por giro/volume.
- Reposição e lembretes opt-in, follow-up e histórico.
- Conteúdo demonstrativo para lojistas e atendimento consultivo WhatsApp com consentimento.
- Dashboard do lojista com cotações, pedidos, notas, reposições e status.
- Master vê saúde de rede, margem e exceções sem expor custo a perfil indevido.

**Estado:** rota wholesale, regras de preço e cotação/retenção são observadas. Pedido B2B pago, frete auditado e ciclo de reposição real não foram comprovados.

### G. Offer Engine, Movement Engine e criativos

- Playbook de oferta por SKU: produto, público, dor real, promessa comprovável, diferenciais, preço, página, CTA e canais.
- Criar vários movimentos independentes por produto, com público/ângulo/narrativa/evidência e versionamento.
- Variantes de criativo por movimento, formato, mídia, copy, CTA, direitos/licença e revisão.
- Biblioteca reutilizável de criativos e materiais aprovados.
- Editor de páginas/landing pages/VSL e prévia por movimento.
- Aprovação, publicação, pausa, revogação e rollback.
- Experimentos A/B com alocação controlada, amostra, denominador, duração e critérios de parada.
- Métricas por público/movimento/variante: CTR, retenção de vídeo, clique, checkout, conversão e margem; separar observacional de causal.
- IA para ângulos, roteiros, títulos e variações, com verificação factual, compliance e revisão humana.
- VSL e order bump/upsell só se checkout suportar e confirmar.

**Estado:** playbook, movimentos, variantes e comparação descritiva têm código observado. Biblioteca completa de ativos licenciados, testes A/B causais e desempenho por compra paga permanecem parciais ou não provados.

### H. Ofertas complementares e carrinho/pedidos

- Cross-sell e downsell separados e com preço próprio.
- Kits/bundles e relações de produto.
- Order bump no checkout do provedor, com confirmação dos dois itens e valores.
- Upsell pós-compra, aceite, segundo pagamento e vínculo com pedido original.
- Carrinho próprio RUBI separado de marketplaces afiliados e checkout externo.
- Snapshot imutável de produto/preço/quantidade/moeda/fornecedor/origem no pedido.
- Idempotência, concorrência, preço atualizado, produto inativo e revisão do carrinho.
- Eventos append-only para pedido, pagamento, entrega, cancelamento e estorno.
- Nunca marcar pedido como pago por redirect ou retorno do navegador.

**Estado:** cross-sell/downsell e fundação/projeto de carrinho-pedido estão documentados/codificados parcialmente. Bump e upsell efetivamente cobrados pela Kairos não estão provados. A cadeia de migrations e ambiente de teste devem ser reconciliados antes de produção.

### I. Intelligence, analytics e experimentação

- Funil por etapa: impressão, visualização, clique, oferta, redirect, checkout iniciado, pedido reportado, venda confirmada, liquidação, comissão, payout, entrega e recompra.
- Definições e denominadores consistentes por período/coorte.
- Dashboard por produto, canal, campanha, parceiro, público, movimento e variante.
- CTR, retenção de vídeo, custo por aquisição e ROAS somente com custo de mídia real.
- Atribuição first-touch/last-touch conforme política versionada; não sobrescrever origem sem regra.
- Deduplicação e idempotência de eventos de provedor.
- Coortes, recompra e LTV somente com pagamentos liquidados e reversões.
- Alertas de divergência, vendas sem evidência, pedido duplicado, comissão e payout divergentes.
- Exportação e relatórios auditáveis.
- Separar GMV externo, receita própria, recebimento, obrigação de comissão e lucro líquido.

**Estado:** funil de aquisição/pré-checkout e dashboards orgânicos são observados. Métricas de venda paga, LTV, retenção e ROAS real não têm evidência completa.

### J. Shadow Master / Admin Control Center

- Painel central privado, gestão de usuários e perfis, aprovações e revogações.
- Catálogo, fornecedores, SKU, preço, custo, estoque/disponibilidade, categorias, coleções, bundles e marketplace.
- Ofertas, movimentos, variantes, criativos, Stories, vídeos, banners, cupons e páginas.
- Campanhas, canais, calendário, automações, push, Telegram, WhatsApp e notificações.
- Gestão de parceiros, grants, contratos, comissões, vendas, conciliação e payouts.
- Gestão B2B, cotações, pedidos, frete e reposição.
- Configurações e integrações com cofre de credenciais.
- Auditoria global: ator, ação, entidade, versão, antes/depois permitido, data, motivo, evidência.
- Painéis de integridade, launch readiness, migrações, filas, workers e exceções.
- Nenhum caminho de escrita sensível deve contornar Owner/server-side/auditoria atômica.
- Segredos nunca aparecem em logs ou auditoria; registrar apenas metadados seguros.

**Estado:** amplo conjunto de rotas/admin e muitas RPCs auditadas existe. Sprint 307 investiga caminhos legados de vídeo e compliance. A revalidação da main em 2026-11-24 confirmou que os achados específicos do Sprint 226 para CRUD de marketplaces, gravação de credenciais/status em connectors e coleta de métricas Telegram já possuem RPCs atômicas Owner-gated e testes dedicados (marketplace CRUD/trigger, redaction de api_config e Telegram metric + audit). Portanto, esses três itens históricos não devem ser reabertos como pendências sem novo defeito reproduzível. Ainda falta uma varredura completa dos demais DML administrativos e comprovação de rollback/concorrência em banco descartável; não afirmar cobertura administrativa completa.

### K. Integrações e automações

- Kairos: documentação oficial, autenticação, checkout, eventos, pedidos, liquidação, cancelamento, reembolso e relatórios.
- Marketplaces: APIs/relatórios oficiais e suporte real a atribuição de parceiro/sub-affiliate.
- WhatsApp/Telegram: bots/canais, consentimento, templates, limites, entrega e opt-out.
- Push notifications e workers com retries, deduplicação, dead-letter/observabilidade.
- Redes sociais: publicação/agendamento somente via API autorizada, sem scraping ou automação proibida.
- Analytics/ads: integração de custo e conversão, contas autorizadas, limites de orçamento e aprovação humana.
- Storage de mídia: uploads privados, URLs assinadas, direitos e remoção.
- Integrações com fornecedores/logística: disponibilidade, frete, pedido, rastreio e entrega quando APIs existirem.
- Cofre de credenciais, rotação, permissões, health check e revogação.

**Estado:** registry/vault e partes de canais/workers existem. Conectores e execução externa precisam ser validados individualmente; não inferir que botão de conexão equivale a integração funcional.

### L. Segurança, privacidade, compliance e confiabilidade

- RLS e grants mínimos, guards server-side, RPCs com search_path seguro e execução restrita.
- Isolamento entre consumidor, lojista, parceiros, Owner e service_role.
- Testes negativos para acesso indevido e revogação.
- Rate limiting, anti-bot/anti-fraude, validação de URL/host, prevenção de SSRF e phishing.
- Proteção de PII e credenciais, logs sanitizados, retenção e exclusão LGPD.
- Consentimento explícito para rastreamento, marketing, canais e personalização.
- Auditoria atômica de mutação e log na mesma transação; rollback e concorrência testados.
- Idempotência de webhooks, pedidos, payouts e workers.
- Migrações versionadas, manifesto, backup/restore e teste em banco descartável.
- Observabilidade, erros, alertas, filas e runbooks.
- Segurança de dependências e revisão de vulnerabilidades.

**Estado:** controles e testes foram construídos em muitos domínios. Não é prova de cobertura integral. Sprint 307 atual continua investigando lacunas de auditoria; o inventário global deve incluir marketplaces, connectors, Telegram metrics e outros DML.

### M. UX, design, qualidade e lançamento

- Design system premium consistente, responsivo e acessível.
- Jornada mobile-first de cada perfil, tablet e desktop.
- Estados loading/erro/vazio/sucesso, retry, validação e feedback.
- Navegação sem rotas quebradas, deep links e histórico.
- Imagens/vídeos otimizados, lazy loading, performance e Core Web Vitals.
- Acessibilidade: contraste, foco, teclado, leitores de tela e labels.
- QA visual com screenshots reais e revisão de layout.
- Testes unitários, integração, TypeScript, ESLint, build e E2E por perfil/dispositivo.
- Ambiente de homologação seguro e dados de teste isolados.
- Checklist de lançamento, domínio/HTTPS, suporte, política de privacidade, termos, comunicação de preço/frete/garantia e atendimento.
- Teste humano completo pelo usuário após fechar o inventário e alcançar a meta definida, como etapa separada de validação de usabilidade.

**Estado:** CI automatizado e E2E local autenticado estão avançando. QA visual/humano hospedado e validação operacional real continuam separados. Corrigir o texto enganoso de parcelamento "ou 10x" se não houver metadado real de parcelas antes de liberar comercialmente.

## 3.1. Estratégias RUBI 11× — inventário nominal do código atual

A lista abaixo foi lida diretamente de `src/lib/rubi-growth-11x.ts` na `main`. Os estados são classificação do plano/código, não telemetria de execução, vendas ou maturidade comercial.

| ID | Pilar | Estratégia | Estado no código |
|---:|---|---|---|
| 1 | Eclipse | Três entradas comerciais | code-observed |
| 2 | Eclipse | Cadastro do consumidor | code-observed |
| 3 | Eclipse | Preferências e nichos | code-observed |
| 4 | Eclipse | Feed de descoberta | code-observed |
| 5 | Eclipse | Comunidades opt-in | execution-plan |
| 6 | Eclipse | Indicação entre consumidores | code-observed |
| 7 | Eclipse | Reativação e LTV | execution-plan |
| 8 | Store | Catálogo de marca própria | code-observed |
| 9 | Store | Precificação por fornecedor | code-observed |
| 10 | Store | Destaques oficiais RUBI | code-observed |
| 11 | Store | Lançamentos sazonais | execution-plan |
| 12 | Store | Kits e produtos complementares | execution-plan |
| 13 | Store | Vídeos de demonstração própria | execution-plan |
| 14 | Store | Compra com confirmação Kairos | external-blocker |
| 15 | Achadinhos | Vídeos de achadinhos | code-observed |
| 16 | Achadinhos | Afiliados TikTok Shop | external-blocker |
| 17 | Achadinhos | Ofertas Shopee e outros | execution-plan |
| 18 | Achadinhos | Páginas orgânicas de nicho | execution-plan |
| 19 | Achadinhos | Reels e TikTok original | execution-plan |
| 20 | Achadinhos | Shorts e Pinterest | execution-plan |
| 21 | Achadinhos | SEO de categorias e produtos | execution-plan |
| 22 | Partners | Captação de experts | execution-plan |
| 23 | Partners | Captação microinfluenciadores | execution-plan |
| 24 | Partners | Consumidor vira afiliado | execution-plan |
| 25 | Partners | Aprovação e grants | code-observed |
| 26 | Partners | Kit de storytelling | execution-plan |
| 27 | Partners | Link e pré-checkout | external-blocker |
| 28 | Partners | Comissões conciliadas | code-observed |
| 29 | Business | Onboarding de lojistas | code-observed |
| 30 | Business | Catálogo e mínimo B2B | code-observed |
| 31 | Business | Preços progressivos | code-observed |
| 32 | Business | Kits de abastecimento | execution-plan |
| 33 | Business | Reposição recorrente | execution-plan |
| 34 | Business | Conteúdo B2B demonstrativo | execution-plan |
| 35 | Business | Consultoria comercial WhatsApp | execution-plan |

### Metas 11× que não devem ser confundidas com resultados

O mesmo arquivo declara metas-alvo de mês 12: 800 parceiros vendendo; 110 pedidos/mês por vendedor; 1.200 lojistas compradores; 100 unidades por lojista; 2.000 pedidos diretos da Store; 3.600 conversões de marketplace; margens unitárias-alvo de R$24,50 para parceiro RUBI, R$10 no atacado, R$49 na venda direta e R$10 em afiliados. São **metas de planejamento**, não dados reais, garantias, forecast validado ou lucro líquido. Só usar como metas operacionais depois de aprovar custos, margem, capacidade, estoque, canais e evidência de conversão.

## 4. Lacunas V1 de maior evidência / dependência

Os IDs abaixo são alvos herdados da matriz detalhada antiga e do Sprint 301. Precisam ser revalidados contra a main e o score atual; não são afirmação de score individual atualizado.

| Critério | Lacuna/aceite essencial | Dependência |
|---|---|---|
| 01.4 | Coortes pagas e recompra 30/60/90 dias | Pedidos liquidados reais |
| 02.4 | Jornada Story → produto → oferta E2E desktop/mobile | Perfis isolados; E2E hospedado |
| 03.4 | Comissões de marketplace externo conciliadas | Relatórios/atribuição da rede |
| 04.4 | Checkout externo e round-trip conciliados | Kairos/provedor |
| 05.4 | Pedido B2B pago, frete snapshot e auditoria | Fornecedor/pagamento |
| 06.4 | Venda externa atribuída → comissão → reconciliação | Provedor/sub-affiliate |
| 09.3 | Order bump cobrado no checkout | Kairos API/contrato |
| 09.4 | Upsell pós-compra cobrado e vinculado | Kairos API/contrato |
| 10.4 | Compra liquidada, reversões e LTV reproduzível | Dados pagos reais |
| 11.3 | Inventário exaustivo de mutações admin, auditoria atômica, rollback/concorrência | Banco descartável |
| 11.4 | Múltiplos Masters sem hardcode | **Rever escopo: Shadow Master único é decisão aprovada** |
| 12.3 | E2E quatro perfis desktop/mobile, positivo e negativo | Identidades e ambiente seguro |
| 12.4 | Pedido real, payout, reembolso e reconciliação | Provedor e operação autorizada |

## 5. Backlog técnico U1–U8 a reconciliar

- **U1 Integridade administrativa:** mutations sensíveis e audit log atômico; varredura completa de DML.
- **U2 Segurança/permissões:** RLS, grants, guards, perfis, isolamento e revogação.
- **U3 Consistência:** concorrência, locking, optimistic revision, idempotência, rollback.
- **U4 Financeiro:** atribuição, comissão, liquidação, payout, estorno, moeda e reconciliação.
- **U5 Ciclo de vida:** criar → revisar → aprovar → publicar → pausar/revogar → refletir em todos os consumidores.
- **U6 UX/responsividade:** estados, visual, acessibilidade, mobile/desktop, performance.
- **U7 Testes/observabilidade:** TSC, lint, build, regressões, E2E, logs sanitizados, runbooks.
- **U8 Integrações externas:** contrato/API/credenciais, retries, webhook, reconciliação e health.

Cada item precisa ter estado, rota, função, tabela, permissão, teste, evidência, dependência e critério de aceite. Não calcular percentual de upgrades até congelar denominador e itens únicos.

## 6. Dependências externas e decisões que não devem ser inventadas

- Kairos: confirmar API/webhook, checkout, order bump, upsell, status, estorno, liquidação e atribuição. Sem documentação e credenciais, manter bloqueado.
- Marketplaces: validar individualmente se suportam sub-affiliate/identificador e relatório por parceiro. Se não suportarem, não prometer comissão individual.
- Logística/fornecedores: não mostrar estoque, prazo, frete ou entrega sem fonte confiável.
- Redes sociais/Ads: publicação, gastos e métricas dependem de API e autorização das contas.
- Dados comerciais reais: SKU, preço, custo, margem, mídia licenciada e catálogo precisam ser fornecidos/aprovados.
- Produção Supabase: não aplicar migrações, criar branch paga, escrever dados, alterar RLS/grants ou ativar integrações sem autorização específica. Nenhuma compra fictícia.

## 7. Plano de reconciliação recomendado

### Fase 1 — Fechar inventário (sem alterar funcionalidade)
1. Reconciliar os 48 critérios linha por linha com main, PRs merged posteriores ao Sprint 207 e testes existentes.
2. Reconciliar as oito frentes U1–U8 contra Sprint 226 e PRs já integrados; remover duplicidades.
3. Mapear cada requisito: módulo → rota → componente → server function → RPC/tabela → política → teste → evidência.
4. Marcar implementado, parcial, ausente, bloqueado externo, não revalidado ou fora de escopo.
5. Atualizar este documento e anexar links/commits; não aumentar score.

### Fase 2 — Converter lacunas em sprints
6. Priorizar primeiro os critérios fecháveis sem provedor externo, com maior ganho de ponto por esforço.
7. Fechar Sprint 307 / 11.3 somente após inventário exaustivo e rollback/concurrency real em banco descartável.
8. Fazer E2E autenticado de 12.3 com quatro perfis, positivos/negativos, desktop/mobile e evidências.
9. Revisar métricas/experimentos 08.x/10.3 sem duplicar pontos já concedidos.
10. Abrir trilha externa separada para Kairos, marketplaces, B2B pago, bump/upsell, payout e LTV.

### Fase 3 — Validação operacional e lançamento
11. Configurar SKU/ofertas reais e fontes externas autorizadas.
12. Executar pagamento de sandbox oficial ou piloto real autorizado, conciliar evento, valor, moeda, comissão, liquidação e estorno.
13. Revisar UX, acessibilidade, performance, suporte, termos, LGPD e segurança.
14. Realizar teste humano completo depois do inventário/fechamento técnico, sem confundi-lo com CI.

## 8.1. Delta de evidências verificado em 2026-11-24 (após Sprint 301)

Esta seção registra fatos novos encontrados na main e em PRs posteriores. Ela atualiza o estado das evidências, **não redistribui nem altera automaticamente os 36,5 pontos**.

| Alvo | Evidência atual verificada | O que continua faltando | Decisão de pontuação nesta auditoria |
|---|---|---|---|
| 02.4 — Story E2E | PR #307 (Sprint 306) integrada em 24/11; E2E local autenticado executou Story persistido aprovado → mesma página de produto → seção de pré-checkout, em mobile e desktop. Fixtures e Supabase eram descartáveis. | Ambiente HTTPS de homologação autorizado, evidência hospedada e round-trip do checkout oficial quando aplicável. A fixture usa `checkout.example.test`; não houve pagamento. | **Não pontuar ainda**: G3 hospedado/G5 continuam incompletos conforme contrato do Sprint 301. |
| 12.3 — E2E quatro perfis | PR #305 integrada; harness local autenticado cobre consumidor, lojista aprovado, parceiro aprovado e Master único em mobile/desktop, com bloqueio de não-Owner. PR #307 adiciona a jornada Story e repete os quatro perfis. | Evidência em ambiente de homologação autorizado, revisão do pacote completo e validação de jornadas adicionais do aplicativo. | **Não pontuar ainda**: manter pendente até aceite dos gates de homologação e evidência definidos no Sprint 301. |
| 11.3 — auditoria administrativa | PRs #227–#230 cobrem CRUD Marketplace e métricas Telegram; PRs #287, #295–#297 e #302–#303 ampliam auditoria de produto, coleções, canais, Experience Engine e Social Proof; PR #308 / Sprint 307 adiciona regressão para caminhos legados de vídeo/compliance. | PR #308 ainda é Draft/não integrada no corte desta auditoria. Falta demonstrar inventário exaustivo dos DML administrativos restantes, execução de migrations no banco descartável e rollback/concorrência de forma abrangente. | **Sem novo ponto**: progresso real de hardening, mas o aceite de 11.3 exige prova exaustiva e transacional. |
| 07.4 — biblioteca de ativos | Sprint 207 já elevou o critério para 1,0 na baseline de 36,5/48, condicionado a merge e pipelines, ambos registrados. | Operação comercial ainda exige ativos/licenças reais e prova de uso, mas isso não reabre automaticamente o ponto técnico já contabilizado. | **Manter 1,0 na baseline histórica**, sem somar novamente. |
| 03.4 / 06.4 / 04.4 / 09.3 / 09.4 / 10.4 / 12.4 | PRs recentes reforçam proteção de checkout, atribuição, ledger, pagamentos parciais, conciliação e preparação de carrinho/pedido. | Não foi encontrada evidência de evento oficial de provedor, compra liquidada, order bump/upsell cobrados, comissão externa conciliada, payout e estorno reais. | **Não pontuar por CI ou estrutura**: dependem de prova externa/financeira. |

### Revisão técnica adicional — Sprint 307 / PR #308

A leitura do diff e dos arquivos de implementação confirmou o seguinte escopo:

- O workspace `/admin/videos` mantém criação/edição de vídeo nativo por formulário integrado ao `saveVideo`, que chama a RPC `rubi_manage_video_audited`; upload é limitado a MP4/WebM de até 50 MB, com bucket privado e URL temporária restrita ao Owner.
- A criação de vídeo ponte permanece separada e chama `rubi_manage_bridge_video_audited`, com validação HTTPS e host permitido por plataforma.
- Status e exclusão de vídeo nativo também usam a RPC auditada; a exclusão de vídeo ponte usa a RPC própria.
- O editor legado `NativeVideoForm`, o antigo `VideoForm` e os helpers de escrita direta no cliente foram removidos; a rota antiga de edição redireciona para o workspace auditado.
- O endpoint de gravação de regras de compliance que fazia upsert direto foi removido; a escrita permanece pelo registro de configurações auditadas.

**Risco funcional observado para QA antes do merge:** a rota `/admin/videos/new` agora cria especificamente vídeo ponte; o formulário nativo é aberto pelo botão `New Video` no workspace. Isso é coerente com a separação dos dois tipos, mas precisa ser conferido visualmente e por teste manual para garantir que o usuário Master não interprete as opções como um único fluxo. Também conferir edição de registros legados de vídeo e associação dos produtos.

**Limite de evidência:** o teste novo `rubi-video-atomic-audit.test.mjs` é principalmente um contrato estático/source-level que verifica uso das RPCs, grants, row locks e remoção dos caminhos legados. Os três workflows do PR #308 estão verdes no head `9e15f125...`, mas a leitura desta rodada não encontrou um teste SQL de integração que execute a RPC e provoque falha de auditoria/rollback/conflito em banco descartável. Portanto, manter esse gate em aberto para o critério 11.3; não declarar rollback e concorrência comprovados somente por regex de SQL.

### Estado de integração no corte

- PR #307 (Sprint 306) está integrada na `main`; a sua evidência Story local foi incorporada ao inventário.
- PR #308 (Sprint 307 — caminhos legados de auditoria de vídeo) permanece aberta e Draft; não é parte da `main` no corte.
- PR #309 é este inventário, aberto e Draft; é documentação de governança e não altera código ou banco.
- PRs #305, #301, #302 e #303 estão integradas. A integração desses PRs não implica, por si só, conversão de pontos V1.

### Consequência para a matriz

A baseline 36,5/48 continua sendo o total oficial carregado, mas não há uma fonte autoritativa que distribua esses 36,5 pontos entre as 48 linhas após todas as sprints. A matriz histórica de 31,5/48 é apenas referência. O inventário deve preservar esse limite até existir uma trilha documental completa para cada ponto. Não estimar a distribuição faltante.

## 8. Regra de pontuação e governança

- Baseline de continuidade: 36,5/48 = 76,0%; gap aritmético 11,5 pontos.
- A distribuição atual dos 48 valores ainda precisa de reconciliação. Não atribuir pontuação individual a partir da matriz histórica 31,5/48.
- O documento Sprint 301 registrou 0/11,5 pontos novos prontos para conversão na data daquela auditoria; isso é histórico, não status recalculado após PRs posteriores.
- Sprint 306 / PR #307 foi integrada; isso não significa automaticamente que todo critério relacionado recebeu ponto.
- Sprint 307 / PR #308 é uma investigação específica de caminhos administrativos legados, não o inventário inteiro.
- Classificar toda sprint como **upgrade-only** ou **cobertura (+0,5/+1)**. CI verde, documentação ou número de arquivos não geram ponto.
- Para cada critério: G0 código atual, G1 testes comportamentais, G2 persistência/segurança, G3 jornada real, G4 evidência externa/financeira se exigida, G5 pacote de evidências revisado.
- Pontuar somente após aceite completo. Não alterar a meta para melhorar percentual; qualquer revisão do escopo deve ser versionada e transparente.

## 9. Próximos entregáveis do inventário

1. Matriz reconciliada com 48 linhas, score atual e evidência por critério.
2. Backlog único U1–U8, deduplicado e com estado por item.
3. Mapa funcional completo: rota → função → tabela → permissão → teste.
4. Lista de bloqueadores externos e quem precisa fornecer acesso/documentação.
5. Plano de sprints ordenado por ganho potencial, risco e dependência.
6. Separação explícita entre cobertura técnica, validação E2E, operação comercial e QA humano.


## 10. Matriz V1 nominal de 48 critérios — reconciliação linha a linha

A auditoria desta rodada extraiu as 48 linhas do snapshot histórico Sprint 122 e registrou, separadamente, as evidências posteriores e os gates ainda abertos. A baseline total de 36,5/48 continua preservada, mas **não há distribuição autoritativa atual dos 36,5 pontos por linha**. Por isso, nenhum score individual foi inventado. O ledger também registra a divergência do critério 11.4 com a decisão aprovada de manter um único Shadow Master privado.

- [Abrir ledger de reconciliação dos 48 critérios](sprint-309-v1-48-row-reconciliation.md)
- O ledger contém os 48 IDs, descrições, scores históricos Sprint 122, evidências posteriores conhecidas, bloqueios externos e ordem de revalidação.
- Resultado desta rodada: upgrade-only; 0 ponto novo; 36,5/48 permanece baseline carregada, não scorecard linha a linha reconstituído.


## 11. Auditoria de experimentos, distribuição e privacidade — rodada adicional

**Classificação:** upgrade-only / achado de governança; nenhum ponto V1 concedido.

### Experimentos controlados (08.3 / 08.4 / 10.3)

A leitura da `main` confirma implementação real, não apenas plano:

- `rubi_movement_ab_experiments` mantém experimento, variantes, revisões de produto/movimento e estado.
- A RPC `rubi_configure_movement_ab_audited` exige Owner, variantes revisadas e direitos confirmados, checkout/produto/fornecedor ativos, revisão esperada, serialização por SKU com advisory lock e gravação de auditoria na mesma transação.
- A distribuição pública é estável por visitante/experimento/revisão; a UI registra exposição e intenção, não compra.
- O motor de desempenho evita atribuição quando rótulos de campanha são ambíguos, não converte ausência de tráfego em zero e não declara vencedor A/B a partir de dados observacionais.
- Testes dedicados cobrem alocação, bloqueios, qualidade de atribuição, dados parciais e comparação temporal.

**Limite:** isso comprova fundação técnica e guardrails. Não comprova volume de amostra, significância estatística, experimento comercial concluído, lift causal ou venda paga. Não atribuir ponto adicional sem evidência do critério e da régua.

### Distribuição orgânica (03.3)

A fundação atual cria planos e URLs UTM para Instagram, TikTok, YouTube Shorts, Facebook, Pinterest, WhatsApp e Telegram. O estado `planned` não equivale a publicação. O estado `manually_published` exige referência, mas ainda depende de evidência externa de que o post está público e acessível; não encontramos confirmação automática de entrega/publicação de todos os canais. Tratar como planejamento + registro manual, não como distribuição multicanal automatizada.

### Privacidade e LGPD — novo gate de auditoria

A implementação de `trackEvent` gera/recupera identificadores anônimos persistentes via `localStorage` e grava eventos em `analytics_events`. O componente A/B também mantém identificador aleatório do visitante e marcador de exposição em armazenamento do navegador. Na revisão desta rodada não foi localizado, pelos símbolos/arquivos pesquisados, um gate central explícito de consentimento/opt-out aplicado ao writer canônico `trackEvent` antes de criar identificador ou inserir evento.

Isto **não é conclusão jurídica de não conformidade**: pode existir mecanismo equivalente fora do escopo da busca. É uma lacuna técnica a verificar, porque a arquitetura/documentação do próprio projeto exige respeitar consentimento, opt-out e retenção. Próximo passo: mapear o fluxo de consentimento da interface/termos/preferências, validar por teste que analytics opcional não é iniciado antes do consentimento aplicável e que revogação interrompe novos eventos e respeita retenção/eliminação. Não remover analytics operacional necessário à segurança sem avaliação de finalidade e base legal.

### Arquivos revisados nesta rodada

- `supabase/migrations/20261114090000_rubi_movement_controlled_ab.sql`
- `src/lib/rubi-movement-ab-allocation.ts`
- `src/components/store/RubiMovementABOffer.tsx`
- `src/lib/rubi-movement-ab.functions.ts`
- `src/lib/rubi-movement-performance.ts`
- `src/lib/rubi-movement-distribution.ts`
- `src/lib/rubi-organic-campaigns.ts`
- `src/lib/analytics.ts`
- `src/lib/rubi-ab-exposure.ts`

**Resultado da rodada:** upgrade-only. A/B controlado tem boa fundação técnica, distribuição externa ainda não é automaticamente confirmada, e consentimento/opt-out central de analytics precisa de verificação direcionada antes de qualquer alegação de fechamento de LGPD.


## 12. Auditoria direcionada de consentimento e analytics — evidência de código

**Classificação:** upgrade-only; risco técnico a investigar; não é parecer jurídico e não altera pontuação V1.

### O que está comprovado

1. O writer canônico `src/lib/analytics.ts::trackEvent` chama `supabase.auth.getUser()`, exclui contas Owner e então sempre gera/recupera `analytics_anonymous_id` em `localStorage` para visitantes anônimos, gera/recupera `analytics_session_id` em `sessionStorage` e tenta inserir em `analytics_events`. No código inspecionado não existe consulta de consentimento/opt-out antes de criar esses IDs ou executar o insert.
2. Há consentimento separado para WhatsApp: a migração `20260907165701_restore_profile_referral_consent_fields.sql` cria `profiles.whatsapp_opt_in` com default false, timestamp e origem, além da RPC autenticada `set_whatsapp_opt_in`. Isso é consentimento de canal de comunicação, não consentimento geral de analytics.
3. Preferências de categoria do feed são explícitas: `personalization.functions.ts` usa `user_preferences.preferred_categories` e não deriva categorias comportamentais quando não há preferências explícitas. Isso é um guardrail útil de personalização, mas não substitui consentimento/controle da telemetria.
4. O contrato `docs/commerce/rubi-commerce-journey-observability.md` exige transparência, consentimento/base aplicável, retenção, exclusão/anonimização e exportação; é um contrato de design, não evidência de que o ciclo inteiro já esteja implementado.
5. Busca de código no branch `main` não encontrou, pelos símbolos `set_whatsapp_opt_in`, `whatsapp_opt_in`, `CookieConsent`, `PrivacySettings`, `consent banner`, `opt_out` e `analytics consent`, uma interface geral de preferências de analytics ou uma chamada UI da RPC WhatsApp. A busca por texto não é prova absoluta de inexistência; o call graph deve ser conferido antes de remover/alterar comportamento.

### Risco e decisão

O writer canônico atual não diferencia analytics opcional de eventos estritamente necessários para segurança/funcionamento. Não se deve simplesmente bloquear todo `trackEvent` sem classificar os eventos: isso pode afetar segurança, antifraude, auditoria operacional e jornadas essenciais. Também não se deve manter rastreamento opcional sem verificar a transparência e os controles aplicáveis.

### Próxima entrega proposta — Sprint de privacidade, sem mexer em produção

- Inventariar todos os chamadores de `trackEvent` e classificar cada evento: estritamente necessário, analytics de produto, marketing/atribuição ou comunicação.
- Localizar e revisar política de privacidade, termos, onboarding, preferências e consentimento já existentes; confirmar finalidade, base legal, retenção e canal de exercício de direitos com responsável jurídico/privacidade.
- Definir um contrato central de preferências/consentimento versionado e granular quando aplicável, com defaults seguros para analytics não essenciais e registro de alteração/revogação.
- Garantir que a revogação interrompa novos eventos opcionais e que IDs opcionais não sejam criados antes do estado de permissão aplicável.
- Criar fluxo de acesso, exportação, eliminação/anonimização e política de retenção para eventos vinculáveis a usuário ou pseudônimo, preservando registros necessários por obrigação/segurança mediante regra documentada.
- Testar visitante anônimo, usuário autenticado, recusa, aceite, revogação, falha de leitura de preferências, Owner, sessão nova e navegadores com armazenamento indisponível.
- Separar métricas operacionais essenciais de tracking opcional e nunca transformar clique, visita ou evento de intenção em compra confirmada.

**Aceite mínimo:** testes demonstram que nenhum evento opcional é emitido antes da permissão aplicável; revogação bloqueia novos eventos opcionais; eventos essenciais possuem finalidade documentada; não há regressão em checkout autorizado, autenticação, segurança, auditoria e atribuição confirmada.

**Sem alteração de runtime nesta rodada:** não foi editado `analytics.ts`, não foi criada migração, não foi alterado Supabase remoto e nenhum comportamento de produção foi modificado. O achado foi registrado para evitar uma correção precipitada que poderia quebrar a instrumentação necessária.


## 13. Correção de histórico — Marketplace e métricas Telegram já fechados

**Classificação:** upgrade de precisão do inventário; não altera cobertura V1.

A auditoria cruzada desta rodada identificou que a seção histórica da Sprint 226 descreve duas lacunas antigas como se ainda estivessem abertas. Isso está desatualizado para a `main` atual. Não reabrir nem reimplementar esses itens:

### Marketplaces — implementação já presente

- `src/lib/marketplace.functions.ts`: `saveAdminMarketplace` e `deleteAdminMarketplace` passam por `rubi_manage_marketplace_audited`, com middleware Owner e ator autenticado.
- `src/lib/connectors.functions.ts`: credenciais e status de integração também usam a mesma RPC; o sync informa explicitamente `connector_not_implemented` quando não existe conector, sem simular sincronização nem alterar produtos.
- Migrações `20261117120000_rubi_marketplace_atomic_audit.sql` e `20261117160000_rubi_marketplace_trigger_audit_hardening.sql`: CRUD, credenciais e status com auditoria na mesma transação; segredo não é copiado para a trilha; exclusão verifica produtos vinculados sob transação/lock.
- Testes existentes: `rubi-marketplace-atomic-audit.test.mjs` e `rubi-marketplace-trigger-audit.test.mjs`.

### Métricas Telegram — implementação já presente

- `src/lib/admin-metrics.functions.ts::collectTelegramMetric` obtém a contagem real via Telegram API, exige exatamente um canal Telegram ativo e chama `rubi_record_telegram_metric_audited`.
- Migração `20261117143000_rubi_telegram_metric_atomic_audit.sql`: grava métrica e auditoria na mesma transação, valida Owner e canal ativo, usa `FOR SHARE` e concede execução apenas a `service_role`.
- Teste existente `rubi-telegram-metric-atomic-audit.test.mjs` verifica RPC, atomicidade estrutural e remoção do caminho legado.

### CI / evidência de regressão

A documentação `docs/rubi-sprint238-ci-audit-regressions.md` registra que os testes de marketplace e Telegram foram adicionados como etapas explícitas do workflow Hub V1 Integration QA. Assim, a conclusão correta é: os dois achados U1 originais da Sprint 226 já foram implementados e incluídos em CI até a Sprint 238. Não são pendências atuais.

**Limite de evidência:** os testes de atomicidade acima incluem verificações source-level do SQL/RPC; isso não substitui um teste de integração PostgreSQL que force falha real no insert de auditoria, prove rollback, teste concorrência e valide grants no banco descartável. Esse é um gate geral de confiança operacional, não evidência de que marketplace ou Telegram estejam sem implementação.

### Correção da prioridade U1

Remover marketplace CRUD/credenciais/status e Telegram metric da fila de trabalho aberto. Próxima varredura U1 deve procurar caminhos DML administrativos ainda sem RPC atômica e conferir os fluxos que não foram cobertos pelos testes específicos existentes. Nenhum ponto V1 é concedido nesta correção.


## 14. Administração central — auditoria de governança e cobertura do painel

**Prioridade estratégica:** P0. O painel administrativo é o centro de comando do RUBI; deve permitir ao Owner governar catálogo, conteúdo, parceiros, financeiro, integrações, campanhas, segurança, suporte e operação sem depender de caminhos paralelos ou visibilidade enganosa.

### Capacidades já confirmadas em `main`

- `requireOwnerRole` aplica autenticação Supabase no servidor e consulta `has_role(owner)`; não confia em e-mail ou metadata mutável.
- `admin-settings.functions.ts` centraliza 15 fontes de configuração em registry explícito; atualização passa por RPC atômica auditada, com allowlist de campos, comparação optimistic-lock (`expected`), sanitização de segredos e ator derivado de `context.userId`.
- Banners usam RPCs específicas de criação/exclusão com trilha atômica.
- `getAdminAuditLog` oferece paginação e filtros por ação/entidade.
- As funções de leitura e mutação desse núcleo usam middleware Owner.

### Achados concretos no próprio painel de auditoria

1. `src/routes/admin/v1-audit.tsx` mantém `KNOWN_ROUTES` como lista manual. A lista inclui rotas antigas, mas não inclui ao menos rotas administrativas que existem hoje, como `/admin/support`, `/admin/support-knowledge`, `/admin/hub-catalog` e `/admin/finance-migration-readiness`. O contador de destinos administrativos exibido pelo cenário mobile pode, portanto, ficar desatualizado. A verificação do route tree para as rotas listadas não equivale a inventário completo de todas as rotas administrativas.
2. O mesmo painel faz `tableCheck` com SELECT direto pelo cliente autenticado e chama o resultado “Tabela acessível”. Isso mede visibilidade da sessão/RLS, não integridade do schema, disponibilidade para as funções Owner, nem prova de que a tabela está corretamente protegida. O rótulo e a interpretação precisam ser revistos para não gerar falso PASS/FAIL.
3. As verificações de presença de produto/vínculo de vídeo e de usuário autenticado são pré-condições, não execução real da jornada. O painel já marca partes como `NOT MEASURED`, mas a semântica dos status deve permanecer rigorosa e separar presença de dado, autorização, operação persistida e resultado externo.
4. `getAdminSettings` consulta até 100 linhas por fonte e retorna `available:false`/erro por fonte sem abortar toda a tela. É útil para resiliência, mas o painel precisa tornar falhas de fonte visíveis e não confundir lista vazia com configuração ausente.

### Requisitos para o Admin Control Center — sem duplicar sistemas

- **Visão executiva:** saúde de catálogo, conteúdo, pedidos, vendas confirmadas, comissões, repasses, fornecedores, integrações e filas; todo KPI com fonte, período, horário da última atualização e estado de qualidade.
- **Governança:** RBAC server-side, Owner único/privado, histórico imutável por ação, snapshots redigidos, revisão otimista, motivo/ator, exportação controlada e alertas de falha de auditoria.
- **Operação diária:** pendências acionáveis, falhas de webhook/checkout, publicação pendente, estoque/preço inválido, produtos sem fornecedor/checkout válido, reconciliações e jobs em retry; sem apresentar dados fictícios.
- **Catálogo e conteúdo:** produto, fornecedor, categoria, coleção, vídeo, Story, campanha, oferta, cupom, bundles, banners e revisão/publicação com preview do impacto na vitrine.
- **Parceiros e financeiro:** atribuição rastreável, venda paga/estornada, comissão, saldo, lote de payout e conciliação separados por provedor; nenhuma venda ou saldo inferido de clique.
- **Integrações e automações:** credenciais via Vault, teste de conexão, último sucesso/erro, idempotência, fila, retry, pausa e trilha de execução; estado “configurado” distinto de “conector funcional”.
- **Marketing e aprendizagem:** funis, criativos, canais, campanhas, exposição, conversão confirmada, coortes e experimentos com tamanho de amostra e qualidade de atribuição.
- **Suporte e qualidade:** conversas, FAQ, lacunas, incidentes, feedback, acessibilidade, responsividade e evidências E2E por perfil.
- **Experiência administrativa:** navegação responsiva, busca global, filtros salvos, estados de loading/erro/vazio, confirmação para ação destrutiva, undo quando seguro e operações em lote com relatório por item.

### Próximo trabalho técnico recomendado

1. Substituir a lista manual de rotas administrativas por inventário gerado/derivado do route tree, ou por um contrato testado que falhe quando qualquer rota `/admin/*` não estiver catalogada.
2. Reescrever checks de banco para distinguir “SELECT visível para esta sessão”, “tabela/schema esperado”, “RPC Owner operacional” e “RLS/GRANT validado”; não marcar autorização como PASS com uma simples contagem.
3. Criar matriz de controle por domínio: rota → server function → middleware → RPC/tabela → grant/RLS → audit log → teste CI → E2E.
4. Exigir teste negativo dos quatro perfis (consumidor, lojista, parceiro, Shadow Master não-Owner) e sessão anônima para cada ação administrativa crítica; Owner único segue privado.
5. Acrescentar health/status de filas, integrações e webhooks com timestamp e fonte, sem simular atividade externa.

**Classificação:** upgrade-only; nenhum ponto V1 concedido. Esta auditoria identificou melhorias no próprio instrumento de auditoria e no painel central; não é evidência de que o Admin Control Center já cumpra todos os requisitos acima. Nenhuma alteração de runtime ou banco remoto nesta rodada.


## 15. Admin Control Center — achados operacionais de integrações e métricas

**Classificação:** upgrade-only; riscos funcionais/admin confirmados por leitura estática; não altera cobertura V1.

### A. Configuração Telegram não é uma única transação

Em `src/lib/telegram.functions.ts::saveTelegramConfig`, o fluxo atual:
1. insere/atualiza `telegram_config` diretamente;
2. chama depois a RPC `set_integration_secret` para `channel_id`;
3. chama separadamente a RPC para `bot_token`, quando fornecido.

Se a etapa 2 ou 3 falhar, o registro da configuração pode já ter sido alterado, enquanto os segredos permanecem antigos/ausentes. O usuário recebe erro, mas o estado fica parcialmente atualizado. O conjunto também não escreve uma única trilha administrativa atômica de configuração. O fato de os segredos individuais usarem RPC não torna a sequência inteira atômica.

**Correção recomendada:** uma única operação server-side/RPC transacional para atualizar configuração + referências + segredos no Vault e registrar auditoria, ou um fluxo explicitamente compensatório com estado pendente e reconciliação idempotente. Não persistir token em tabela de configuração nem em audit log. Adicionar testes de falha em cada etapa, rollback, rotação de token, remoção/retenção do token existente e concorrência.

### B. Envio Telegram pode gerar falso estado “failed” após envio externo bem-sucedido

Em `sendTelegramManual`, a API Telegram é chamada primeiro. Depois, o código grava `telegram_messages` como `sent`. Se a chamada externa tiver sucesso mas o insert local falhar, o catch grava uma linha `failed` e retorna falha, embora a mensagem possa já estar publicada. Uma repetição do operador pode publicar duplicado. Se a gravação de falha também falhar, esse erro secundário é ignorado.

**Correção recomendada:** outbox local idempotente com chave de operação, estados `pending → sending → sent/unknown/failed`, guardar o message_id externo assim que conhecido e reconciliar respostas ambíguas; não declarar falha certa quando a resposta externa já confirmou sucesso. Interface do Admin deve mostrar “resultado externo confirmado / persistência local pendente” e oferecer reconciliação, não botão cego de reenvio.

### C. Métricas do painel podem ocultar falhas e sugerir precisão maior do que a fonte

- `getAdminMetrics` desestrutura somente `count` de seis consultas paralelas e não verifica os objetos `error`; falhas de leitura podem aparecer como zero, confundindo “zero real” com “consulta falhou”.
- `getAdminIntelligenceData` valida erros em várias consultas, mas usa consultas de eventos para gráficos de produto/marketplace que selecionam eventos `OUTBOUND_CLICK` e metadados crus; isso não equivale, por si só, a ranking agregado por produto ou participação de marketplace. A consulta `marketplaceEvents` não limita o volume na origem, ao contrário de `topEvents` (limit 100), o que pode aumentar custo/volume e enviesar amostra se limite fosse aplicado.
- CTR calculado como `periodClicks / productViews` mistura eventos de clique de saída e visualizações de produto; sem definição comum de unidade, deduplicação, janela e população elegível, o rótulo CTR pode não representar taxa de clique por impressão. Deve ser tratado como razão derivada, não KPI confiável, até definir denominador compatível.

**Correção recomendada:** resultado tipado por métrica `value | status | source | window | updatedAt | error`; nunca converter erro em zero. Agregar no servidor/banco com denominadores explícitos e deduplicação; nomear cada gráfico conforme a consulta realmente calcula; separar clicks, product views, impressions, purchases confirmed e attribution quality. Exibir “sem dados”/“indisponível”/“parcial” separadamente de zero.

### D. Controles positivos já confirmados

- `saveCategory`, `reorderCategories`, `deleteCategory` usam `rubi_manage_category_audited`.
- Operações de grupos de oferta usam `rubi_manage_offer_group_audited`.
- Configuração de prova social usa `rubi_update_admin_setting_audited` com valores esperados.
- Feature flags do Command Center também usam `rubi_update_admin_setting_audited` com optimistic locking.
- Esses exemplos devem ser aproveitados como padrão; não duplicar uma nova trilha de configurações.

### Prioridade administrativa atualizada

1. **P0:** tornar o save de Telegram transacional e o envio manual idempotente/reconciliável; testar falhas parciais.
2. **P0:** corrigir semântica de métricas: erro nunca é zero, CTR com denominador válido e gráficos com agregação real.
3. **P1:** matriz exaustiva de mutações administrativas e testes negativos por perfil.
4. **P1:** route inventory derivado do route tree e health-checks com status/fonte/última execução.
5. **P2:** experiência administrativa mobile, filtros, ações em lote e revisão visual/acessibilidade.

**Sem alteração de runtime nesta rodada:** achados foram documentados antes de implementar para evitar corrigir integração com risco de duplicar envios ou perder segredos. Nenhuma alteração no Supabase remoto.

## 16. Revisão de precisão — Telegram e métricas administrativas (2026-11-24)

**Classificação:** upgrade-only; correção de diagnóstico + refinamento de requisitos P0.

### Correção explícita de diagnóstico anterior

A revisão direta do arquivo atual src/lib/admin_intel.functions.ts mostra que getAdminIntelligenceData **já verifica** erros nas 13 consultas de KPI e nas quatro consultas de gráficos, lançando erro quando alguma falha. Portanto, não é correto afirmar que essa função transforma indiscriminadamente falhas em zero. A lacuna confirmada de erro→zero está em getAdminMetrics, que desestrutura somente count das seis consultas e não verifica error; ali uma falha pode ser exibida como zero. Corrigir esta distinção nos relatórios futuros.

### Achados refinados no dashboard

- getAdminIntelligenceData retorna topProducts: topEvents e marketplaceDist: marketplaceEvents, mas ambas as consultas selecionam os mesmos campos (metadata,event_type), filtram somente OUTBOUND_CLICK e não agregam por produto nem marketplace. A consulta de marketplace não tem limite de origem. Erros são tratados, porém o nome/semântica dos gráficos não corresponde a agregações demonstradas.
- ctr é calculado como OUTBOUND_CLICK / PRODUCT_VIEW. O denominador é visualização de página de produto, não impressão de uma unidade de anúncio/posição; sem coorte, janela e deduplicação compatíveis, não chamar isso de CTR de campanha. Renomear como razão clique/visualização ou criar métrica real com impressões elegíveis.
- getAdminMetrics continua sendo endpoint separado com seis consultas sem tratamento individual de erros e fallback count || 0; corrigir com resultado tipado por métrica e propagação/estado de falha.

### Telegram — UI e fluxo de entrega

- A tela src/routes/admin/telegram.tsx desabilita o botão enquanto a mutation está pendente, o que evita clique duplo simples na mesma instância. Isso é uma proteção útil, mas não cobre retry após timeout, refresh, duas abas, repetição do request ou falha após sucesso remoto.
- sendTelegramManual não persiste um identificador de operação antes da chamada externa nem uma chave idempotente; a linha local sent é inserida só depois do sucesso do Telegram. O tratamento atual pode registrar failed depois de uma entrega externa confirmada se a gravação sent falhar. O risco de falso-failed/duplicação permanece confirmado.
- saveTelegramConfig faz DML em telegram_config antes das duas chamadas set_integration_secret; não há uma transação única entre configuração e segredos. A UI limpa o token após sucesso, mas não há confirmação composta para falhas intermediárias.
- testTelegramConnection chama sendMessage e envia mensagem real de teste ao canal. A UI comunica “Mensagem de teste enviada”; documentar como ação externa com efeito, não como health check sem efeito. Considerar trocar o teste de conexão por método sem publicação (ex. validação de credencial/identidade) e deixar envio de teste explicitamente separado e confirmado.

### Aceite técnico P0 para correção futura

1. Outbox persistida antes do envio, idempotency key gerada pelo servidor e restrição UNIQUE no banco.
2. Estados pending, sending, sent, unknown, failed; registrar chat_id/message_id remoto e timestamps; erro local pós-envio resulta em reconciliação/unknown, não em failed falso.
3. Retry só de itens comprovadamente não entregues; estado unknown exige reconciliação, não reenvio automático.
4. Configuração Telegram salva por RPC transacional única que atualiza estado, referências de segredo/Vault e audit log sem expor segredo; rotação/omissão do token preserva explicitamente o token anterior conforme contrato.
5. Testes reais no Postgres descartável para rollback por falha em cada passo, idempotência concorrente, grants e isolamento Owner; testes de UI para duas abas/retry e confirmação do efeito externo.
6. Métricas administrativas com value/status/source/window/updatedAt/error, unavailable distinto de zero; gráficos com agregação real; CTR somente quando impressões válidas existirem.

Sem mudança de runtime nesta rodada; apenas correção documental e de precisão do diagnóstico. Nenhum dado remoto ou segredo foi acessado/alterado.


## 17. Estado consolidado dos PRs e gate de integração da Sprint 307 (2026-11-24)

### PR #308 — Sprint 307: validação no head atual

Head consultado diretamente: `9e15f125ded8cba2320e86cb1b104c990508edbf`. PR aberto, Draft, base `main`, mergeable true, não integrado.

Os três workflows associados exatamente a esse SHA concluíram com sucesso:
- Hub V1 integration QA — run `45464734972`, job `Install, build, TypeScript and lint`: success.
- Sprint 33 QA — run `45464734712`, job `qa`: success.
- RUBI Local Authenticated E2E — Four Profiles — run `45464734801`, job `authenticated-local`: success.

A discussão do PR registra o artefato sanitizado com 22 cenários esperados, 22 aprovados, zero inesperados, zero skipped e zero flaky. O patch de 11 arquivos remove os helpers de escrita direta legados para vídeos nativos/externos, mantém os fluxos atuais nativo e ponte nas entradas server-side auditadas, remove o endpoint sem callers de upsert direto de compliance e conecta a regressão ao Sprint 33 QA.

### Decisão de integração — ainda não recomendar

Embora a CI esteja verde e o PR seja mergeable, não liberar integração ainda: o próprio escopo de cobertura 11.3 requer inventário exaustivo de mutações administrativas e prova transacional real (rollback quando a auditoria falha, concorrência/locks e grants) em PostgreSQL descartável. O teste específico adicionado nesta sprint é principalmente source-level e não fecha esses dois requisitos. Não confundir sucesso dos três workflows com cobertura integral da governança administrativa.

**Critérios objetivos para mudar a decisão:**
1. Matriz de todas as mutações administrativas: rota/caller, server function, middleware, RPC, tabelas, grants/RLS, audit log e teste CI.
2. Evidência de banco descartável: sucesso e rollback induzido por falha de audit insert; transações concorrentes para mesmo recurso; permissões Owner versus consumer/merchant/partner/non-Owner.
3. Revalidar as três workflows no head final após quaisquer alterações.
4. Confirmar que fluxos nativo e ponte, edição, compliance e redirecionamentos continuam preservados por testes funcionais.

### PR #309 — Inventário mestre

Head atual confirmado na consulta anterior: `2671680903737dff2c872912f70b2255870c3874`; aberto, Draft, não integrado. É uma alteração documental. A consulta de workflows por SHA retornou lista vazia; não declarar QA verde. O conteúdo precisa continuar acompanhando a evidência, mas não substitui testes de implementação.

### Política de decisão

A integração só será recomendada quando os gates específicos do escopo forem satisfeitos. Não é necessário esperar 100% da matriz V1 para integrar toda sprint; porém não se deve integrar um PR cujo próprio critério de aceite ainda não esteja demonstrado. Nenhum merge foi executado nesta rodada.


## 18. Auditoria do próprio mecanismo de auditoria administrativa (2026-11-24)

**Classificação:** upgrade-only; achado P0 de confiabilidade do Admin Control Center. Não concede ponto V1.

### 18.1 runAdminAudit mistura leitura GET com mutação e pode declarar conclusão sem trilha

Arquivo: src/lib/admin-audit.functions.ts.

- A função está declarada como createServerFn({ method: "GET" }), mas depois executa INSERT em admin_audit_log. Leitura/consulta que produz gravação não deve usar GET: clientes, caches e retries podem tratar GET como operação sem efeito.
- A gravação do resultado é um INSERT direto, fora de RPC transacional auditada.
- logError é retornado em auditLogWritten / auditLogError, mas a execução retorna normalmente mesmo se o log falhar. O painel pode apresentar auditoria executada sem trilha persistida, e a falha pode passar despercebida se a UI não der destaque explícito.
- A verificação das tabelas e a gravação do evento não são atômicas. O registro deve indicar execução incompleta se não puder ser persistido; não afirmar sucesso auditável.

**Correção proposta:** separar GET puro de leitura/health check de um POST explícito para iniciar auditoria. Persistir início/fim e resultado por RPC transacional auditada, com identificador da execução e estado started/completed/partial/failed; se a trilha obrigatória falhar, devolver erro/estado explícito e nunca sucesso silencioso. Não inserir snapshots com dados sensíveis.

### 18.2 Registro de 24 tabelas não é inventário completo do aplicativo

AUDIT_REGISTRY contém 24 definições estáticas. A verificação tableHealth executa SELECT count(*) e classifica:
- erro de leitura como bug (para itens required) ou unavailable;
- zero linhas como no_data;
- uma ou mais linhas como functional.

Isso mede acessibilidade de leitura e existência de registros, não integridade funcional. Uma tabela populada pode ter todas as mutações bloqueadas, RLS/grants errados, RPC ausente, audit log quebrado ou UI indisponível. Uma tabela vazia pode ser perfeitamente saudável. As 24 entradas não são prova de cobertura de todas as rotas, tabelas, views, RPCs, Storage ou filas.

**Correção proposta:** renomear a dimensão para readability/dataPresence e introduzir checks independentes por contrato: (1) rota/tela existe; (2) server function/caller existe; (3) middleware/role exigida; (4) RPC/tabela/view/fila esperada; (5) RLS e grants por papel; (6) audit log atômico; (7) teste unitário/SQL/CI; (8) E2E persistido; (9) integração externa confirmada quando aplicável.

Cada check deve usar estados pass, fail, no_data, not_applicable, not_measured, unavailable e conter evidência, data, origem e escopo. Não resumir presença de linha como funcional.

### 18.3 Integridade dos logs existentes tem limite declarado corretamente

getRubiMasterAuditIntegrityAdmin percorre os eventos acessíveis, falha se a paginação exceder limite e declara explicitamente: “Integridade dos registros existentes, sem garantia de cobertura de todas as mutações.” Esse disclaimer é correto e deve ser preservado. Ele verifica a consistência do que foi gravado; não pode provar que todas as ações administrativas produziram log.

### 18.4 Aceite para encerrar este achado

- GET sem efeitos colaterais; POST explícito para execução.
- Execução com ID, estados e timestamps persistidos por caminho transacional.
- Falha forçada na gravação de auditoria resulta em estado/erro inequívoco, nunca sucesso silencioso.
- Teste de repetição/retry e concorrência de execuções.
- Matriz completa gerada a partir de rotas + server functions + mutações/RPCs + objetos de banco, com exceções justificadas.
- Testes negativos anônimo/consumer/merchant/partner/non-Owner para endpoints administrativos; Owner positivo.
- UI separa readable, has_data, authorized, mutation_verified, audit_verified e e2e_verified.

**Nenhuma alteração de runtime ou banco remoto nesta rodada.** Este registro documenta o achado para correção numa sprint dedicada, evitando introduzir uma mudança de semântica no painel sem testes e sem atualizar seus consumidores.


## 19. Flywheel comercial — aquisição, identidade, distribuição e monetização conectadas

**Classificação:** upgrade-only / consolidação estratégica e critérios de aceitação; não concede ponto V1 nem declara os fluxos implementados. Nenhum runtime, schema ou dado remoto é alterado por esta seção.

### 19.1 Princípio operacional

Os cinco pilares são ativos comerciais distintos, conectados pelos quatro motores Tráfego, Base, Funil e Oferta. Cada pilar mantém público, permissões, catálogo e proposta de valor próprios; o ecossistema compartilha sinais autorizados, identidade resolvida, origem, catálogo elegível, mensuração e aprendizado.

- **Eclipse:** aquisição, onboarding, preferências, relacionamento, retenção e indicação do consumidor.
- **Achadinhos:** descoberta editorial e aquisição por conteúdo/ofertas externas; encaminha tráfego qualificado sem mascarar publicidade ou origem.
- **Store:** marca própria e produtos autorizados de fornecedores; concentra oferta, margem, página, checkout, pós-venda e recompra.
- **Partners:** rede de afiliados, experts, criadores e influenciadores; distribui produtos autorizados em vitrines e links atribuíveis.
- **Business:** lojistas, atacado, cotação, abastecimento, reposição e futura esteira de serviços digitais.

O ciclo completo é: **conteúdo/anúncio/parceiro → visita identificada → experiência anônima útil → cadastro opcional → perfil e preferências → recomendação contextual → oferta elegível → checkout → evidência de pedido/pagamento → comissão e conciliação → entrega/suporte → recompra/indicação → aprendizado por coorte**.

O aplicativo coordena o ciclo, mas não substitui redes sociais, mídia paga, marketplaces, fornecedores, logística ou processadores de pagamento. O algoritmo recomenda e organiza; não é fonte de verdade financeira.

### 19.2 Entrada anônima e conversão em conta sem fricção indevida

A jornada deve reconhecer que uma pessoa pode chegar sem login, sem cadastro e sem conhecer a RUBI:

1. Criar referência pseudônima de sessão/visita e registrar origem, campanha, parceiro, publicação e produto, quando presentes.
2. Permitir explorar a oferta e entender produto, preço, condições, fornecedor, entrega e destino do checkout antes de exigir cadastro, salvo etapa realmente necessária.
3. Apresentar convite contextual para criar conta quando houver benefício concreto (salvar favoritos, acompanhar pedido, manter preferências, receber alertas opt-in ou acessar histórico).
4. Ao cadastrar, associar a sessão anônima à conta somente por mecanismo seguro, com política explícita de retenção e consentimento; não fundir dispositivos ou pessoas por inferência.
5. Explicar por que a recomendação ou convite aparece, permitir dispensar e controlar preferências/canais.

O cadastro não pode ser condição escondida para visualizar informação essencial, nem pode transformar um visitante em assinante, afiliado ou destinatário de marketing sem ação afirmativa.

### 19.3 Atribuição de parceiro: duas dimensões que não podem ser confundidas

A RUBI deve distinguir:

- **Origem de aquisição do consumidor:** quem trouxe a pessoa para o ecossistema (first eligible touch, parceiro/campanha e janela de atribuição).
- **Atribuição comercial do item/pedido:** qual link, vitrine, campanha e parceiro efetivamente originou a intenção de compra de cada item.

Um consumidor adquirido por parceiro A pode, em outro momento, chegar organicamente ou por parceiro B. A regra comercial precisa definir se a comissão é de aquisição, de venda por item, recorrente por janela ou combinação contratual. Não conceder comissão vitalícia nem trocar o dono da aquisição silenciosamente. Preservar first-touch, last eligible touch e origem do item em campos distintos; aplicar regra versionada e visível no acordo.

**Regra proposta para a vitrine individual:**
- Parceiro aprovado recebe uma vitrine/URL estável e só pode conectar produtos para os quais tenha grant ativo.
- Cada produto conectado gera referência individual parceiro + produto + campanha/publicação; link/QR leva à página de oferta da RUBI Store ou à página autorizada do marketplace.
- O visitante pode explorar a página do produto e seguir para o checkout oficial; o token de atribuição deve sobreviver à navegação e ao cadastro por mecanismo server-side, sem depender apenas de parâmetro editável no navegador.
- Se a compra contiver vários itens, atribuir comissão por linha elegível, não automaticamente sobre todo o carrinho. Itens sem grant, fora da campanha ou de outro canal seguem regra própria.
- A dashboard do parceiro e o Shadow Master consomem o mesmo registro canônico de venda/linha atribuída, com estados pendente, não verificada, confirmada, revertida e paga; nunca criar dois créditos para o mesmo pedido.
- Alteração de grant, percentual ou contrato não reescreve vendas passadas: guardar snapshot de regra, produto, parceiro, base de cálculo e percentual no momento aplicável.
- Disputa entre primeiro toque, último toque, cupom, link direto e múltiplos parceiros deve ir para regra determinística e fila de revisão; não pagar duas comissões integrais pelo mesmo item sem contrato explícito.

A janela de atribuição, prioridade entre sinais, elegibilidade de recompra e política de conflito são decisões comerciais que precisam ser configuradas e aceitas antes da ativação. Se o provedor não devolver identificador verificável, a venda permanece não verificada; clique, cadastro e redirect não autorizam pagamento de comissão.

### 19.4 Checkout e economia unitária por canal

A experiência de checkout deve preservar a origem sem simular que a RUBI processou o pagamento. A página mostra produto, vendedor/fornecedor, preço e moeda, frete/entrega quando confirmados, condições, política de troca e destino externo. O retorno só muda o estado mediante evidência verificável.

Separar no financeiro:
- venda própria RUBI e receita efetivamente recebida;
- venda de fornecedor e margem contratual;
- GMV/valor de pedido externo;
- comissão de marketplace recebida pela RUBI;
- comissão de parceiro devida, retida, paga ou revertida;
- custo de produto, frete, taxas, mídia, reembolso e chargeback;
- contribuição líquida por SKU, canal e campanha.

A ambição de margem de 50% ou 100% é uma hipótese comercial, não um valor garantido. O painel deve calcular margem de contribuição real após custo do produto, taxas, impostos, frete subsidiado, mídia, comissão, devoluções e perdas. Percentuais de comissão precisam caber na margem e no contrato de cada SKU. Não prometer comissão ou lucro sobre preço bruto sem base de cálculo definida.

### 19.5 Recomendação e distribuição sem canibalizar confiança

O feed pode combinar conteúdo orgânico, produtos de marketplace e ofertas da Store, mas deve:
- ordenar por adequação ao interesse declarado, qualidade, disponibilidade, preço total, confiança e desempenho comprovado;
- identificar claramente conteúdo patrocinado, publicidade e links afiliados;
- aplicar limites de frequência por usuário, sessão, campanha e SKU para evitar saturação;
- manter diversidade e utilidade editorial, sem transformar toda interação em anúncio;
- usar experimentos controlados e coortes para verificar se a exposição à Store aumenta contribuição e recompra sem piorar retenção, reclamações ou confiança;
- evitar alegações falsas, urgência artificial, prova social fabricada e escassez sem fonte;
- permitir controles de personalização e comunicação, inclusive opt-out.

A oportunidade de recomendar produto próprio deve ser contextual e competitiva em valor total; não deve ocultar alternativas relevantes nem apresentar produto próprio como resultado orgânico quando for promoção.

### 19.6 Evolução do consumidor para afiliado ou parceiro

O convite para indicação/afiliado pode surgir após sinais de interesse e uso, mas a elegibilidade deve ser explicável e configurável. Requisitos mínimos:
- convite não invasivo, dispensável, com limite de frequência e opção de não voltar a exibir;
- adesão voluntária, termos, identificação do programa e explicação de comissão;
- qualificação e aprovação antes de conceder grants, links ou acesso a dados;
- trilha de onboarding, material autorizado, metas e regras transparentes;
- possibilidade de revogar acesso e encerrar participação;
- distinguir indicação casual, afiliado, expert, criador e parceiro comercial; não promover automaticamente um consumidor a parceiro.

A progressão por metas não deve alterar comissão retroativamente e precisa de regra versionada, antifraude, cancelamentos e chargebacks.

### 19.7 Business: jornada B2B própria, não uma cópia do varejo

O lojista precisa de catálogo B2B, mínimo por SKU, preço progressivo, cotação, negociação, disponibilidade, frete, pedido, faturamento e reposição, com separação entre preço de varejo e custo confidencial. A expansão futura de sites, aplicativos, landing pages, anúncios e consultoria deve ser uma esteira de serviços contratáveis, com escopo, preço, capacidade, prazo, suporte e aceite próprios; não prometer desenvolvimento personalizado como benefício ilimitado de um plano.

### 19.8 Métricas que provam ou refutam o flywheel

Medir por coorte, canal, campanha, parceiro, SKU e perfil:
- visitante anônimo → cadastro concluído → ativação útil;
- origem preservada e qualidade da atribuição;
- visualização → intenção → redirect → pedido reportado → pagamento confirmado → liquidação;
- margem de contribuição após todos os custos;
- comissão elegível → retida → paga/revertida;
- recompra, indicação, retenção e LTV somente sobre pedidos válidos e reversões;
- lojista qualificado → cotação → pedido pago → reposição;
- exposição promocional versus retenção, descadastro, reclamação e frequência.

Cada indicador precisa declarar fonte, denominador, janela, deduplicação, atualização e qualidade. Estado desconhecido não é zero. Resultado estimado não é venda confirmada.

### 19.9 Gates antes de ativar a bola de neve

1. Identidade anônima/autenticada e consentimento testados sem fusão indevida de usuários.
2. Link/vitrine de parceiro, grants, token de visita e atribuição preservados entre navegação, cadastro e checkout.
3. Regra comercial aprovada para first-touch, last eligible touch, atribuição por item, janela, conflito e recompra.
4. Venda externa conciliada por sinal oficial ou revisão autorizada; comissão idempotente, reversível e auditável.
5. Isolamento: parceiro vê somente sua vitrine, clientes/indicadores permitidos e extrato; lojista vê somente dados B2B autorizados; Owner mantém visão global privada.
6. LGPD, transparência de publicidade/afiliado, opt-in, opt-out, retenção e direitos do titular validados.
7. Limites de frequência, qualidade editorial, antifraude, suporte, logística e capacidade de atendimento operacionais.
8. Experimentos demonstram contribuição incremental sem deteriorar confiança ou retenção.
9. Shadow Master consegue pausar campanha, produto, parceiro, automação ou integração e reconciliar exceções com trilha de auditoria.

**Decisão:** este flywheel passa a ser requisito de arquitetura e de aceite para a evolução integrada dos cinco pilares. É um plano de ativação por etapas, não uma afirmação de que todos os mecanismos já existem ou estão prontos para produção. Nenhuma alteração de runtime, migration, política RLS, segredo ou banco remoto foi executada nesta atualização documental.


## 20. Contratos operacionais do algoritmo e do ciclo de vida do consumidor

Esta seção detalha como os requisitos do flywheel devem se comportar quando forem implementados. Não cria uma promessa de IA autônoma nem autoriza rastreamento oculto.

### 20.1 Máquina de estados da pessoa e da conta

Manter estados distintos, sem tratar cada visita como uma pessoa nova:

- `anonymous_session`: sessão pseudônima com identificador próprio e prazo de retenção definido.
- `known_visitor`: visitante com preferência/canal identificável por ação explícita, sem conta autenticada.
- `registered_consumer`: conta criada e identidade autenticada.
- `active_consumer`: consumidor que concluiu uma ação útil definida (por exemplo, preferência salva, favorito, pedido ou acompanhamento), não apenas abriu o app.
- `referral_candidate`: consumidor que atende critérios configuráveis para receber convite de indicação; ainda não é afiliado.
- `affiliate_applicant`: pessoa que aceitou se candidatar e iniciou onboarding.
- `approved_partner`: candidatura aprovada, termos aceitos e grants ativos; só então recebe vitrine/link comercial.
- `suspended_or_revoked`: acesso comercial suspenso/revogado, com links e grants tratados conforme política e histórico preservado para auditoria.

As transições precisam ser explícitas, idempotentes e auditáveis. Não inferir que duas sessões/dispositivos pertencem à mesma pessoa sem autenticação ou mecanismo permitido. Uma conta pode ser consumidor e também parceiro aprovado, mas os papéis e permissões não se confundem; não criar contas duplicadas para representar a evolução.

### 20.2 Contrato mínimo de evento e atribuição

Eventos de aquisição e venda devem carregar, quando aplicável: `event_id` idempotente, `occurred_at`, `received_at`, `anonymous_session_id` ou `user_id`, `source`, `medium`, `campaign_id`, `partner_id`, `product_id`, `content_id`, `click_id`, `order_id`, `order_line_id`, `provider`, `evidence_reference`, `consent_context` e versão da regra de atribuição. Campos ausentes permanecem desconhecidos; não preencher por adivinhação.

A origem da aquisição da conta deve ser congelada como snapshot da regra aplicável no cadastro, sem impedir que cada pedido/linha tenha atribuição comercial própria. A política comercial precisa definir, por canal e contrato, janela, prioridade de sinais, recompra, cupom, conflito, deduplicação e exceções. Mudança futura de política vale para eventos futuros, salvo ajuste formal e auditado.

### 20.3 Decisão de recomendação: elegibilidade antes de ranking

A recomendação deve seguir esta ordem, para não deixar o ranking promover algo que não pode ser vendido:

1. **Elegibilidade:** produto ativo, grant/canal autorizado, disponibilidade e preço atual confirmados, destino de checkout válido, região/condições compatíveis e direitos de mídia válidos.
2. **Segurança e confiança:** retirar produto suspenso, oferta expirada, alegação não aprovada, conteúdo denunciado ou item com divergência crítica.
3. **Adequação:** combinar categoria/interesse declarado, contexto da página, busca, favoritos e comportamento permitido/consentido.
4. **Valor total:** considerar preço, frete, prazo e condições somente quando os dados forem confiáveis; não comparar preço nominal de canais com custos diferentes.
5. **Diversidade e frequência:** limitar repetição por SKU, marca, campanha e anunciante; evitar que a Store domine o feed por regra oculta.
6. **Ordenação e experimento:** aplicar ranking explicável e experimentos controlados, com grupo de comparação e critérios de parada.
7. **Explicação e controle:** identificar publicidade/afiliado, informar motivo contextual quando útil e oferecer controles de personalização e opt-out.

Se não houver dados suficientes para comparar, usar ordenação editorial simples e segura; não inventar score de qualidade, conversão ou margem.

### 20.4 Convite para afiliado sem dark pattern

O convite deve usar sinais de uso úteis e configuráveis (ex.: consumo recorrente de conteúdo, compartilhamento voluntário ou interesse declarado), mas nunca inferir renda, vulnerabilidade ou atributos sensíveis. Deve respeitar limite de frequência, ser dispensável e não bloquear a experiência. O convite não altera comissão, não cria link e não libera produto. A pessoa só entra no programa após ação afirmativa, termos aceitos, análise e aprovação.

### 20.5 Vitrine do parceiro e integridade financeira

A conexão de produto na vitrine exige grant ativo, SKU elegível, percentual/base de comissão versionados, campanha válida e destino de compra homologado. O sistema deve rejeitar conexão inválida no servidor, mesmo que a interface permita tentativa.

Para cada linha de pedido elegível, gerar no máximo um crédito de comissão por regra/beneficiário; guardar origem, regra, base, percentual, moeda, evidência e estado. Estorno/chargeback gera lançamento compensatório, nunca edição silenciosa do evento original. Dashboard do parceiro e Shadow Master leem o mesmo ledger canônico, com visões e permissões diferentes. O parceiro não pode alterar origem, pedido, base de cálculo, comissão ou estado financeiro.

### 20.6 Observabilidade e critérios de sucesso do flywheel

O painel deve expor, por coorte e canal, perdas entre etapas e qualidade dos dados: sessões anônimas elegíveis, cadastros atribuídos, ativação útil, convites exibidos/dispensados/aceitos, candidaturas, aprovações, vitrines com grants válidos, cliques, redirects, pedidos reportados, pagamentos verificados, comissões calculadas, reversões e recompra.

Cada taxa declara numerador, denominador, janela, fonte, deduplicação e última atualização. Mostrar estados `unknown`, `stale`, `partial` e `error` quando apropriado; falha de consulta não pode aparecer como zero. Crescimento só é considerado saudável se contribuição líquida e recompra melhorarem sem piorar reclamações, cancelamentos, opt-out, retenção ou frequência excessiva.

### 20.7 Ordem segura de implementação

- **P0 — verdade e segurança:** identidade/consentimento, origem preservada, isolamento de parceiros, grants, ledger idempotente, confirmação de pagamento e reversões.
- **P1 — conversão e experiência:** vitrine individual, páginas de oferta, feed com elegibilidade, convites controlados, painel de atribuição e reconciliação.
- **P2 — otimização:** ranking personalizado, testes de incremento, progressão de metas, campanhas multicanal e automações de recompra.
- **P3 — expansão B2B:** reposição inteligente, CRM comercial, serviços digitais e automações de lojistas.

A ordem evita escalar aquisição antes de conseguir provar quem trouxe a venda, qual margem sobrou e qual comissão é devida.

**Classificação:** complemento de especificação / upgrade-only. Não concede ponto V1. Requer mapeamento posterior contra implementação, schema, RLS/GRANT, testes e evidência de provedor antes de qualquer ativação em produção.


## 21. Auditoria de implementação — vitrine, atribuição e entrada anônima

Leitura estática da `main` em 2026-11-24, sem executar alterações no runtime:

### 21.1 O que já existe no código

- `/loja/$storeCode` apresenta vitrine pública de parceiro aprovado, com produtos ligados a referral links ativos, grants ativos, produto/fornecedor ativos e checkout aprovado.
- `RubiPartnerStorefrontManager` expõe ao parceiro aprovado o endereço público da vitrine e ação de copiar/visualizar.
- `getPublicRubiPartnerStorefront` não entrega checkout URL nem identificadores internos de perfil/grant ao navegador; cada produto expõe seu referral code próprio.
- `/r/$code` recebe a indicação e encaminha para o pre-checkout. `resolvePartnerReferral` valida parceiro aprovado, grant, produto, checkout e, quando presente, vínculo da publicação/campanha.
- `hub_partner_referral_visits` registra visita com token de navegação; repetição com o mesmo token usa upsert idempotente. A etapa de pre-checkout é registrada separadamente e só para visita validada recente.
- Portal e extrato do parceiro consultam vendas confirmadas vinculadas aos links do próprio parceiro; o status financeiro soma repasses por venda e expõe pendências/sobrepagamentos.
- O analytics já distingue identificador anônimo persistente, sessão e usuário autenticado; o funil Master agrega eventos sem retornar identificadores crus.
- O pre-checkout tem recomendação de produtos relacionados e convite de cadastro para visitante sem login, com ação dispensável e telemetria.

### 21.2 Limite crítico: vitrine pronta não significa checkout de parceiro liberado

`getRubiCheckoutReadiness` valida produto, link, parceiro e grant. Para pedido com `partnerCode`, entretanto, retorna explicitamente `ready: false` até existir link oficial do provedor que preserve atribuição. O componente de pre-checkout não substitui isso por checkout direto do SKU — proteção correta contra perder a atribuição.

Portanto, o caminho público vitrine → link de indicação → pre-checkout está codificado, mas **a conversão com checkout de parceiro ainda está bloqueada por integração/evidência externa**. Não declarar que todo parceiro já consegue cobrar pelo próprio checkout nem que cadastro via parceiro garante comissão em compras futuras.

### 21.3 Duas experiências que precisam continuar distintas

- **Convite de cadastro:** hoje o pre-checkout pode exibir convite ao visitante anônimo após atraso curto, com controle por sessão e opção de dispensar. Seu objetivo é conversão para conta.
- **Convite para virar afiliado/parceiro:** é outro fluxo. A estratégia de convidar consumidores ativos após critérios de uso (por exemplo, percentual de jornada) precisa de regra própria, frequência, candidatura, termos, análise e aprovação. Não foi comprovado pelo convite de cadastro descrito acima.

Também não confundir o programa de indicação entre consumidores (`referrals/referral_events`) com a atribuição comercial por produto (`hub_partner_referral_links/hub_partner_confirmed_sales`). São mecanismos distintos e não devem ser fundidos em uma única comissão ou origem.

### 21.4 Gates de produto e testes para completar a experiência desejada

1. Decidir formalmente a política de aquisição de conta versus atribuição de venda por SKU: first-touch, last eligible touch, janela, recompra, cupom, concorrência entre parceiros e troca de dispositivo.
2. Homologar o provedor para checkout de parceiro com identificador verificável que sobreviva ao pagamento; validar webhook/relatório, assinatura, deduplicação, estorno e conciliação.
3. Definir se uma compra posterior de qualquer produto da Store gera comissão de aquisição, comissão por item ou nenhuma comissão. Não presumir comissão global/vitalícia pelo simples cadastro via parceiro.
4. Implementar o convite de afiliado como jornada separada do convite de cadastro, usando critérios transparentes e opt-out; provar que não aparece excessivamente nem libera acesso automaticamente.
5. Testar ponta a ponta: visitante anônimo → vitrine de parceiro → produto → cadastro → login → retorno à oferta → checkout → evidência de pagamento → ledger → dashboard do parceiro e Shadow Master.
6. Testar negativas: link/grant revogado, parceiro suspenso, produto inativo, checkout alterado, token reutilizado, visita expirada, publicação incompatível, pedido duplicado, cancelamento e chargeback.
7. Definir se a atribuição pode persistir entre dispositivos somente após login e consentimento/base legal aplicável; não usar fingerprinting oculto.

**Conclusão desta auditoria:** a infraestrutura de vitrine, referral por produto, visita e dashboard financeiro já tem componentes concretos. O elo mais importante ainda não fechado é o checkout externo de parceiro com atribuição verificável; a aquisição por parceiro e a comissão sobre compras futuras também precisam de uma política explícita. Classificação upgrade-only; nenhum ponto V1 concedido e nenhuma alteração de runtime/schema/banco remoto.


## 22. Inventário de mutações administrativas e próximos gates de governança

Leitura estática da `main` em 2026-11-25, após a rodada aprovada da Sprint 307. Esta seção é uma triagem de risco e desenho de trabalho futuro; não é certificação de todos os caminhos nem altera o escopo da Sprint 307.

### 22.1 Caminhos já protegidos — preservar o padrão

- `setSellerProductStatus`: Owner middleware, cliente autenticado para preservar `auth.uid()`, trigger de auditoria na mesma transação e compare-and-set para impedir sobrescrita por aba obsoleta.
- `saveSocialChannel` / `deleteSocialChannel`: Owner middleware e RPCs `rubi_manage_social_channel_audited`.
- Configurações e banners no módulo `admin-settings.functions.ts`: Owner middleware e RPCs auditados dedicados.
- `saveComplianceRule`: Owner middleware está presente; porém a implementação observada faz upsert direto com `supabaseAdmin`, apesar de existir allowlist de `compliance_rules` no contrato central de configurações auditadas. Confirmar se há trigger de auditoria equivalente antes de classificar como lacuna definitiva.

### 22.2 Escritas administrativas com evidência de auditoria ainda insuficiente

1. **Níveis de indicação — `ReferralTiersAdmin`**
   - O componente executa INSERT/UPDATE direto pelo cliente Supabase.
   - A rota fica dentro do layout administrativo, cuja verificação Owner ocorre no cliente; adicionalmente, a migration `20260907165700_restore_referral_tiers.sql` define RLS com política `Owners can manage referral tiers` usando `user_roles` e `auth.uid()`. Portanto, não classificar como escrita pública/desprotegida.
   - Na migration examinada, não foi localizada trilha transacional de auditoria para INSERT/UPDATE/desativação. Migrar para server functions Owner + RPC/trigger auditado ou demonstrar formalmente o mecanismo equivalente. Preservar leitura pública somente dos níveis ativos.

2. **Identidade da marca — `updateBrandIdentity`**
   - Já exige `requireOwnerRole`, mas grava por upsert direto usando `supabaseAdmin`.
   - Confirmar trigger/audit log no banco. Se não houver, migrar para mutação auditada atômica, sem mudar o comportamento público de leitura do nome.

3. **Telegram — `saveTelegramConfig` e envio**
   - A configuração da tabela e os segredos são gravados em operações separadas. Uma falha após atualizar `telegram_config` pode deixar configuração e segredo divergentes.
   - `testTelegramConnection` envia uma mensagem real; a interface/contrato deve deixar explícito que é teste com efeito externo, ou criar health check sem envio.
   - `sendTelegramManual` chama o provedor antes de persistir a mensagem. Se a persistência falhar após o envio externo, a resposta pode indicar falha e uma repetição pode duplicar a mensagem.
   - Próximo desenho: outbox/idempotency key, estados `pending/sending/sent/unknown/failed`, guardar identificador do provedor, reconciliar estado `unknown` antes de repetir, e tratar configuração/segredos com compensação ou operação atômica compatível com o Vault. Não prometer exactly-once no Telegram sem suporte do provedor.

4. **Orquestração de estratégia — `pauseStrategyOrchestration`**
   - A operação exige Owner e valida status elegível, mas faz UPDATE direto com service client, enquanto criar/gerar/aprovar usam RPCs.
   - Uniformizar pausa com RPC auditado e compare-and-set; testar duas pausas concorrentes, transição inválida e falha de auditoria.

5. **Compliance**
   - `saveComplianceRule` está protegida por Owner, mas a gravação direta não demonstra atomicidade com auditoria no código da função.
   - `validateAffiliateLink` é endpoint sem middleware Owner e usa cliente administrativo para gravar violações. Isso pode ser intencional por ser validação chamada no fluxo de produto; precisa de limites de taxa, validação de existência/estado do marketplace e proteção contra spam de logs. Não transformar endpoint público de validação em endpoint de leitura/gestão de regras.

### 22.3 Escritas que não devem ser confundidas com mutação Master

- `getAbVariant` cria uma atribuição A/B para o próprio usuário; é uma escrita de execução/telemetria, não uma alteração administrativa de experimento. Exigir autenticação/ownership do usuário, unicidade por experimento+usuário e comportamento idempotente sob concorrência.
- `trackFollowIntent`, `markRubiPartnerPrecheckoutViewed` e `markMyPartnerFinancialNotificationRead` registram ações do usuário ou atualizam um recurso estritamente escopado ao perfil autenticado. Validar isolamento e abuso, mas não classificá-los automaticamente como bypass Master.
- A presença de `requireOwnerRole` protege a entrada server-side, mas não substitui teste de RLS/GRANT, auditoria transacional e idempotência.

### 22.4 Plano de execução recomendado para sprints futuras

- **P0 — inventário verificável:** gerar matriz route → server function → middleware → tabela/RPC → RLS/GRANT → trigger/audit → teste negativo/positivo. Incluir toda mutação, não apenas componentes dentro de `/admin`.
- **P1 — integridade financeira e integrações:** fechar outbox/reconciliação do Telegram e demais provedores; preservar idempotência, evidência externa e ledger.
- **P1 — governança Master:** fechar Referral Tiers, Brand Identity, Compliance e Strategy Orchestration com trilha auditável e provas de rollback.
- **P2 — experimentação segura:** garantir unicidade/idempotência das atribuições A/B, denominadores de exposição e isolamento de coortes.
- **P2 — observabilidade:** painel separar `authorized`, `readable`, `has_data`, `mutation_verified`, `audit_verified` e `e2e_verified`; falha de consulta não pode aparecer como zero.

### 22.5 Aceite mínimo antes de marcar cobertura

Para cada mutação administrativa: Owner permitido; anon/consumer/merchant/partner/non-owner negados; validação de payload; escopo do registro; rollback quando auditoria falha; concorrência; repetição idempotente; evento de auditoria com ator/ação/entidade/diff seguro; ausência de segredo/PII indevido no log; E2E da jornada real.

**Classificação:** triagem de correções e upgrades para próximas sprints. Não concede ponto V1. A leitura estática não prova ausência de trigger quando não localizado em uma busca parcial; cada candidato precisa de inspeção de migrations/schema e teste no PostgreSQL descartável. Nenhuma alteração de runtime, migration, política RLS, segredo ou banco remoto foi feita nesta seção.


## 23. Próxima sequência de sprints — metas mensuráveis, sem desviar sprint ativa

A prioridade é fechar fundações transversais antes de multiplicar funcionalidades.

### Sprint futura A — Master Governance Hardening (coverage + correções)
**Meta:** 100% das mutações Owner identificadas e classificadas; 0 mutações administrativas sem gate server-side; evidência transacional para todas as operações críticas selecionadas.
- Resolver e comprovar Referral Tiers, Brand Identity, Compliance Rules e pausa de orquestração.
- Matriz de testes positiva Owner e negativa para anon, consumidor, lojista, parceiro e usuário autenticado não-Owner.
- Rollback, concorrência, repetição, auditoria e diff seguro.
- Aceite: matriz route/function/RPC/DB/audit/test integral, testes PostgreSQL descartáveis e E2E, sem alteração remota direta.

### Sprint futura B — Integration Reliability (upgrade + coverage)
**Meta:** nenhuma operação externa crítica fica sem estado reconciliável.
- Outbox e estados/reconciliação de Telegram; idempotência e deduplicação.
- Confirmar webhook/report, assinatura e política de repetição; nunca repetir automaticamente um envio cujo resultado seja desconhecido sem reconciliar.
- Aceite: testes falha antes/depois da chamada externa, retry, concorrência e reconciliação; observabilidade de estado.

### Sprint futura C — Commercial Attribution & Partner Checkout (coverage + upgrade)
**Meta:** pedido pago reconciliado, atribuição explicável e comissão calculada a partir do ledger canônico.
- Formalizar janela, origem, conflito entre touchpoints, compra futura, reativação, cupom, estorno/chargeback e comissão por produto vs portfólio.
- Homologar checkout externo com evidência verificável, assinatura, deduplicação e reconciliação.
- Aceite: percurso anônimo → vitrine → cadastro/login → checkout → evento confirmado → ledger → dashboard Partner e Master; testes negativos e estorno.

### Sprint futura D — Consumer Retention & Stories Engine (coverage + upgrade)
**Meta:** testar uma jornada completa de descoberta/retorno com controle do usuário e métricas de cohort.
- Feed com elegibilidade primeiro (estado, autorização, preço/estoque, checkout, conteúdo e região), depois relevância, diversidade e frequência.
- Stories e vídeos como descoberta demonstrável, produto contextual, favoritos/listas, alertas e pós-compra; convite afiliado separado, opt-in, frequência limitada e sem desbloqueio automático.
- Aceite: eventos instrumentados; métricas D30/D60/D90, recompra, opt-out, reclamações e conversão; A/B com denominadores válidos; teste de controles e personalização.

### Sprint futura E — Store Conversion & Margin Engine (coverage + upgrade)
**Meta:** experimento de oferta com margem de contribuição rastreada, não apenas receita bruta.
- Criativo, página, movimento, kits, order bump, upsell, preço, logística, devolução e custo de comissão/fee.
- Aceite: métricas por produto/canal/cohort, testes de variantes, atribuição e cálculo de margem de contribuição reconciliável.

### Sprint futura F — Business Expansion (coverage + upgrade)
**Meta:** ciclo B2B demonstrável para lojista, com preço por volume e recompra.
- Catálogo autorizado, preço de atacado, disponibilidade, pedidos, reposição, CRM e ferramentas digitais, segregando acesso e dados de consumidor.
- Aceite: journey E2E lojista, isolamento, preço, pedido, reconciliação e experiência móvel.

### Regras de execução
- Sprints A/B são fundação prioritária; C é bloqueada por dependências do provedor/contrato de checkout; D/E/F avançam após gates de dados, atribuição e integridade.
- Nenhuma sprint entra na main sem aprovação explícita; nenhuma integração de código altera score sem evidência.
- Esta sequência é proposta e priorização, não cronograma nem afirmação de que recursos estão implementados. Revalidar dependências, branch/base, cobertura e testes ao iniciar cada sprint.


## 24. Atualização de evidência — Sprint 307 (2026-11-25)

A PR #308 / Sprint 307 teve o HEAD `44566d17b9d714953768e0a07b5fe36b4ef4fb33` validado com três workflows aprovados:

- Hub V1 Integration QA — SUCCESS (run 45595135110).
- Sprint 33 QA — SUCCESS (run 45595135246), incluindo TypeScript, ESLint, build e regressão da Sprint 307.
- RUBI Local Authenticated E2E — Four Profiles — SUCCESS (run 45595134853), incluindo PostgreSQL descartável, grants das RPCs, negação de não-Owner, rollback atômico por falha de auditoria, ciclos native/bridge-video, concorrência em duas sessões e E2E autenticado mobile/desktop.

Esta evidência fecha os gates de teste específicos da Sprint 307 para vídeo/bridge-video e a remoção do endpoint legado sem chamadas de compliance. Ela **não** conclui o inventário transversal de todas as mutações Master, não prova staging hospedado nem checkout/pagamento externo. PR #308 permanece Draft e não integrada no momento deste registro.

A leitura estática da `main` usada na seção 22 continua sendo a base atual enquanto a PR #308 não for integrada. Os candidatos Referral Tiers, Brand Identity e pausa de Strategy Orchestration permanecem no backlog de governança; o endpoint `saveComplianceRule` só deixa de existir na branch da Sprint 307, não na `main` até a integração.

**Classificação:** upgrade-only / atualização de evidência. Baseline V1 permanece 36,5/48 (76,0%) provisória; score por linha não reconciliado; pontos novos convertidos: 0.


## 25. Sprint 308 — descoberta técnica da governança administrativa (2026-11-25)

A inspeção da `main` confirmou três superfícies administrativas que merecem tratamento separado, sem presumir que o middleware Owner isoladamente equivale a auditoria atômica:

### 25.1 Referral Tiers
- Arquivo: `src/admin/referral/ReferralTiersAdmin.tsx`.
- O componente executa leitura, INSERT, UPDATE e desativação diretamente pelo cliente Supabase em `referral_tiers`.
- O payload de edição inclui nome/chave, mínimo de indicações, descrição, ícone, cor, status e ordem. A criação e edição precisam manter constraints do schema e evitar colisão de `tier_key`.
- Próximo gate: revisar a migração canônica `20260907165700_restore_referral_tiers.sql`, políticas/RLS e todos os consumidores de tiers; desenhar operações server-side/atômicas de create, update e deactivate com audit log sanitizado. Não converter para RPC genérica sem cobrir criação e a chave de identidade.

### 25.2 Brand Identity
- Arquivo: `src/lib/brand-identity.functions.ts`.
- `updateBrandIdentity` já usa `createServerFn` e `requireOwnerRole`, mas executa upsert direto via `supabaseAdmin` sem registro de auditoria atômico.
- A tabela usa chave primária booleana singleton (`id = true`), portanto não é compatível com a RPC genérica atual, que recebe UUID e pressupõe coluna `id` UUID.
- Próximo gate: RPC dedicada, verificação de Owner no servidor/DB, auditoria sem conteúdo sensível e prova de rollback se a auditoria falhar.

### 25.3 Strategy Orchestration
- Arquivo: `src/lib/strategy-orchestrator.functions.ts`.
- A pausa é protegida por `requireOwnerRole`, mas faz UPDATE direto em `strategy_orchestrations` para status `ready/approved`.
- Aprovação e criação já usam RPCs existentes; a pausa é o caminho inconsistente.
- Próximo gate: inspecionar as funções SQL existentes e o modelo de auditoria antes de adicionar uma RPC dedicada ou extensão revisada. Preservar a transição condicional e tornar o resultado explícito quando o registro já não estiver em estado pausável.

### 25.4 Limite da RPC genérica atual
A allowlist de `rubi_update_admin_setting_audited` contém 15 fontes e recebe `p_id uuid`; não inclui `referral_tiers`, `brand_identity` nem `strategy_orchestrations`. Não ampliar essa função com nomes de tabela/campos arbitrários. Cada nova fonte exige migração revisada, constraints explícitas, autorização server-side e testes de rollback/concorrência adequados.

### 25.5 Decisão e classificação
- A descoberta foi feita por leitura estática da `main`; nenhum código de produto, migration, RLS, grant ou dado foi alterado nesta etapa.
- Ordem recomendada: Strategy Orchestration (menor superfície e RPCs existentes), Brand Identity (singleton simples), Referral Tiers (CRUD completo e maior superfície).
- Classificação: upgrade-only / descoberta técnica. Pontos V1 adicionados: 0. O critério 11.3 permanece sem pontuação adicional até inventário transversal e evidência de todos os caminhos administrativos.


### 25.6 Revisão aprofundada de RLS e superfície de mutação

A leitura das migrations canônicas refinou o risco e evita classificar ausência de auditoria como ausência de autorização:

- `referral_tiers`: RLS está habilitada; leitura pública somente de tiers ativos; política `FOR ALL` permite escrita apenas quando `auth.uid()` possui role `owner`. O problema confirmado é o CRUD direto no componente cliente, sem auditoria atômica; não foi demonstrado bypass de RLS. A migração futura deve preservar leitura pública de tiers ativos e política Owner, movendo mutações para operações auditadas.
- `brand_identity`: RLS habilitada e privilégios revogados de `anon` e `authenticated`; escrita ocorre pelo servidor com `requireOwnerRole` e cliente administrativo. O problema confirmado é ausência de registro de auditoria atômico, não exposição direta ao cliente. A RPC dedicada deve manter o singleton `id=true` e não conceder DML aos papéis públicos.
- `strategy_orchestrations`: a superfície administrativa inclui mais do que pausa. Criação (`create_strategy_orchestration`), geração de plano (UPDATE de `plan/status` em `generate_strategy_orchestration_plan`), aprovação (`approve_strategy_orchestration`) e pausa (`pauseStrategyOrchestration`, UPDATE via servidor) alteram estado e não inserem `admin_audit_log` nas implementações/migrations inspecionadas. As RPCs de criação/geração/aprovação já verificam Owner em SQL; a pausa usa middleware Owner no servidor e UPDATE direto. A correção deve auditar as quatro transições e manter validação de estado/locking.
- O padrão de auditoria de vídeo mostra o modelo desejado: validação Owner, lock da linha, mutação e insert em `admin_audit_log` na mesma transação; falha do insert deve reverter a mutação. O payload de auditoria deve ser mínimo e sanitizado.

**Revisão de escopo Sprint 308:** Strategy Orchestration passa a ser uma frente de auditoria das quatro mutações, não apenas da pausa. A prioridade permanece: (1) Strategy Orchestration, (2) Brand Identity, (3) Referral Tiers. Para cada frente, exigir testes de Owner/não-Owner, estado inválido/conflito concorrente, rollback quando auditoria falha, e confirmação de que nenhuma credencial ou dado privado é escrito no log. Nenhuma mudança de código ou banco foi feita nesta revisão documental.
