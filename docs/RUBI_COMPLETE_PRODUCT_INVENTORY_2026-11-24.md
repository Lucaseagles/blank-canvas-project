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
