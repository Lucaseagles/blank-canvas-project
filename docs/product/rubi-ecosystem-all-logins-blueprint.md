# RUBI Eagles — Blueprint de experiência para todos os logins

Status: diretriz de produto e arquitetura; não representa funcionalidades já entregues.
Objetivo: fazer consumidor, parceiro, lojista/comerciante e operador logístico obterem valor real em uma única rede comercial, preservando o Shadow Master como controle central.

## Princípio central

A RUBI não deve ser apenas um catálogo com quatro tipos de conta. Deve ser uma rede de comércio com jornadas próprias, benefícios claros, ferramentas de execução e dados confiáveis. Cada login precisa saber:
- o que pode fazer agora;
- o que precisa concluir para desbloquear a próxima capacidade;
- qual resultado a plataforma efetivamente confirmou;
- qual é o próximo passo útil;
- onde pedir ajuda ou resolver um problema.

A experiência deve ser mobile-first, acessível, rápida, transparente e consistente. Evitar dashboards cheios de métricas sem ação.

## 1. Consumidor — descobrir, comprar e confiar

A loja de varejo já possui catálogo, busca, filtros, ordenação, ranking por interesse e componentes de Stories. Evoluir sem duplicar o que existe:
- onboarding opcional e progressivo de interesses, faixa de preço, necessidades, categorias e preferências de conteúdo;
- feed personalizado que explique por que um produto foi recomendado;
- comparar produtos, salvar favoritos, listas e alertas de preço/disponibilidade quando houver fonte confiável;
- páginas de produto com preço, disponibilidade, vendedor/fornecedor, política de entrega, prazo estimado e checkout responsável claramente identificados;
- histórico de pedidos com estados recebidos do provedor, sem inferir envio ou entrega;
- central de ajuda, cancelamento/devolução e acompanhamento de ocorrências;
- recomendações patrocinadas identificadas e separadas da relevância orgânica;
- programa opcional de indicação, com regras simples, sem pressão para recrutar pessoas;
- notificações configuráveis, com frequência controlada e opção de sair.

Resultado esperado: consumidor encontra produto adequado, entende a oferta, compra com confiança e consegue acompanhar o pedido.

## 2. Parceiro — uma operação comercial própria, apoiada pela RUBI

O portal atual já reúne links de referência, visitas, resumo de vendas, estado de comissão, notificações financeiras, kit criativo e painel financeiro. A evolução deve conectar essas ferramentas em uma jornada única:
- onboarding que identifica perfil, nicho, experiência, canais, região, idioma, formatos de conteúdo e objetivos;
- trilhas de aprendizagem práticas: conteúdo, demonstração, divulgação responsável, atendimento, leitura de métricas e conformidade;
- recomendação explicável de produtos e campanhas adequados ao público, sempre sujeita à aprovação do Shadow Master;
- vitrine própria com seleção apenas de produtos autorizados, organização, coleções, destaques e preview;
- links separados por produto, canal e campanha, QR Codes e identificação de origem;
- biblioteca de criativos autorizados, roteiros, descrições, vídeos, calendário e sugestões de publicação;
- planejamento de campanhas com metas de atividade e qualidade, não promessas de renda;
- grupos de colaboração opt-in por nicho ou campanha, com regras anti-spam, moderação e sem remuneração por recrutamento;
- cockpit de métricas: visualizações, cliques, redirecionamentos, checkouts reportados, pedidos confirmados e conversões, sempre com denominadores e períodos coerentes;
- painel financeiro com comissão estimada, em validação, elegível, paga e revertida; cada estado explicado e ligado à evidência;
- reputação baseada em qualidade, cumprimento de regras, atendimento e histórico verificável, não apenas volume bruto.

A monetização do parceiro vem de venda atribuída e confirmada segundo contrato. Clique, visita, cadastro, promessa de ganho ou convite de outro parceiro não são venda nem comissão.

## 3. Lojista/comerciante — abastecer e operar melhor

A área de atacado já consulta catálogo B2B, mínimos, faixas de preço e monta cotações. Próximos blocos:
- onboarding comercial e validação de elegibilidade;
- perfil da loja, segmentos, região atendida e preferências de abastecimento;
- catálogo B2B com disponibilidade e prazo apenas quando informados por fornecedor;
- carrinho de cotação, comparação de faixas e histórico de cotações;
- pedidos, documentos, pagamentos externos, status e ocorrências;
- reposição sugerida a partir de histórico real, sem inventar estoque;
- gestão de catálogo próprio e vitrine do lojista quando autorizada;
- ferramentas de promoção, kits, precificação e conteúdo para atrair clientes;
- painel de margem com custo, preço, taxas e frete claramente separados, sem prometer margem líquida quando faltarem custos;
- conexão com logística e suporte para divergência, avaria, atraso e devolução.

Resultado esperado: lojista compra melhor, controla pedidos e vende com mais previsibilidade.

## 4. Logística — execução rastreável

A logística deve ser uma capacidade própria, não um status decorativo:
- cadastro e aprovação de operador, área atendida, capacidade e documentos;
- filas de coleta/entrega por região, janela e prioridade;
- atribuição de rota com aceite explícito e possibilidade de reatribuição auditada;
- eventos de coleta, trânsito, tentativa, entrega e ocorrência com data, ator e evidência;
- prova de entrega com controles de privacidade;
- SLA calculado somente com timestamps confiáveis;
- gestão de exceções, devoluções, avarias e comunicação com lojista/consumidor;
- remuneração do operador baseada em serviço concluído e validado, com regras transparentes;
- painel de capacidade, produtividade, atrasos e qualidade, evitando ranking injusto por fatores fora do controle do operador.

Não marcar entregue por clique do entregador sem evidência definida pelo contrato operacional.

## 5. Shadow Master — governança da rede

O Shadow Master precisa enxergar o ecossistema sem misturar responsabilidades:
- pessoas, papéis, permissões, aprovações e trilha de auditoria;
- catálogo, fornecedores, estoque informado, preço, disponibilidade e checkout aprovado;
- parceiros, contratos, grants, vitrines, campanhas e qualidade;
- lojistas, cotações, pedidos e ocorrências;
- operadores logísticos, rotas, SLA e provas;
- pagamentos externos, recebimentos liquidados, obrigações, comissões, estornos e repasses;
- funis e saúde operacional por login, região, produto e período.

Acesso Master permanece restrito ao único titular autorizado até decisão explícita de ampliar a governança. Métricas agregadas não podem expor dados pessoais ou financeiros de outro usuário.

## 6. Inteligência compartilhada — quatro motores

1. **Matching:** conecta consumidor a produtos relevantes, parceiro a campanhas compatíveis, lojista a abastecimento adequado e pedido a operador apto. Toda recomendação deve ter motivo legível e opção de correção.
2. **Growth:** oferece próximos passos, conteúdo e campanhas conforme estágio real de cada conta. Não usa pressão enganosa, falsa escassez ou promessa de renda.
3. **Operations:** identifica atrasos, falhas, pedidos sem evidência, checkout indisponível e divergências antes de virarem problemas maiores.
4. **Trust & Finance:** verifica origem, autorização, evento externo, contrato e dinheiro. Nunca transforma clique em venda, venda em recebimento ou obrigação em repasse pago sem evidência.

## 7. Regras de integridade e proteção

- Separar evento de marketing, evento de pedido, pagamento, liquidação, entrega, comissão e repasse.
- Preservar identificadores externos, provedor, moeda, timestamps, origem e idempotência.
- Não somar moedas diferentes nem converter sem taxa, data, fonte e regra explícitas.
- Nunca expor dados pessoais do comprador em dashboards de parceiros.
- Parceiro só vê seus próprios links, pedidos atribuídos e valores.
- Lojista só vê suas próprias operações e permissões.
- Operador logístico só vê entregas atribuídas a ele e dados mínimos necessários.
- Conteúdo patrocinado deve ser identificado; publicidade deve respeitar regras aplicáveis.
- Proibir promessa de lucro garantido, incentivo a endividamento, recrutamento remunerado em cadeia e práticas que reproduzam mecânicas de apostas.
- Controles de denúncia, bloqueio, suporte e recurso precisam existir para todos os logins.

## 8. Sequência recomendada de execução

A sequência deve respeitar dependências e evidência; não significa que tudo será desenvolvido em uma sprint:
- **Fundação:** estabilizar e validar a vitrine de parceiro (Sprint 278), sem merge antes de CI verde.
- **Parceiros:** editor da vitrine e seleção de produtos autorizados; depois cockpit de links/campanhas; depois grupos e aprendizagem; então integração de eventos externos e comissão.
- **Consumidor:** auditar jornada completa catálogo → produto → checkout → pedido → pós-venda; fechar lacunas de confiança antes de adicionar gamificação.
- **Lojista:** auditar cotação → pedido → pagamento → fornecedor → recebimento; evoluir histórico e gestão de ocorrências.
- **Logística:** mapear schema e jornada real existente antes de implementar novos status ou telas.
- **Shadow Master:** consolidar operações e exceções com drill-down e trilha de auditoria.
- **Inteligência:** ativar recomendações somente depois de dados de qualidade e mecanismos de explicação/feedback.

## 9. Método de entrega e cobertura

Cada sprint deve declarar:
- objetivo e login beneficiado;
- funcionalidades existentes reutilizadas;
- critérios de aceite observáveis;
- riscos de autorização, privacidade, finanças e operação;
- testes unitários, integração e browser quando aplicáveis;
- evidência da CI e homologação;
- classificação upgrade-only ou cobertura V1;
- atualização de percentual somente quando critério da matriz for comprovadamente satisfeito.

Nenhum ganho de cobertura é contado apenas por documentação, protótipo ou componente isolado. Nenhuma alteração de produção ocorre sem revisão da migration, backup quando aplicável, autorização e plano de reversão.
