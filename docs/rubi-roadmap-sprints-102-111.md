# RUBI Eagles 11× — roteiro de execução pós-Sprint 99

Data de referência: 2026-11-11. Repositório: `Lucaseagles/blank-canvas-project`. Documento de **planejamento**, não comprovante de funcionalidade concluída.

## Progresso e regra de medição

A última medição comunicada foi **31/48 = 64,6%** (matriz técnica selecionada). É cobertura técnica, não percentual de operações reais. Os PRs #100 (alerta de host do fornecedor) e #101 (resiliência de analytics no checkout) foram integrados à `main`, com dois workflows de CI aprovados em cada alteração. Como reforçam critérios já existentes, não elevam a nota automaticamente.

- Aumento de **0,5 ponto** => 31,5/48 = 65,6%.
- Aumento de **1 ponto** => 32/48 = 66,7%.
- **34/48 = 70,8%**: primeira meta mensurável, +3 pontos comprovados.
- **38,5/48 = 80,2%**: meta intermediária, +7,5 pontos comprovados.
- **43,5/48 = 90,6%**: meta avançada, +12,5 pontos comprovados.
- **48/48 = 100%**: todos os critérios desta baseline, NÃO necessariamente todo o produto operacional.

**Se novos requisitos forem adicionados**, revisar e publicar novo denominador; não reutilizar metas numéricas sem recalcular. Manter três dimensões distintas: (1) cobertura implementada, (2) testes e segurança homologados, (3) operação real e resultados financeiros.

## Limite dos upgrades de estabilização

Encerrar o ciclo de upgrades gerais quando:
1. P0/P1 conhecidos de segurança, saída ao checkout, direitos de acesso e integridade estiverem corrigidos e tiverem testes;
2. TypeScript, ESLint, build e testes de regressão passarem no CI do commit atual;
3. uma matriz de fluxos críticos documentar resultados reais e limitações (sem fingir E2E hospedado);
4. correções remanescentes forem priorizadas por impacto e não bloquearem a próxima entrega funcional.

Não prolongar indefinidamente hardening de código sob a mesma porcentagem. Depois disso, concentrar sprints nos critérios 0 e 0,5, mantendo manutenção corretiva crítica.

## Marcos planejados (não são prazos nem sprints já concluídas)

| Sprint | Entrega principal | Evidência de aceite | Dependência / efeito na nota |
|---|---|---|---|
| 99 | Diagnóstico e checkout resiliente | PRs #100/#101 integrados; CI aprovado | Reforço de requisito existente, sem pontos novos; HTTPS/Kairos pendentes |
| 102 | Fluxos críticos e segurança de pré-checkout | Testes de produto revogado, host inseguro, indicação e queda da telemetria; relatório CI | Hardening, possível meio ponto se fechar critério parcial comprovadamente |
| 103 | Oferta → movimento → variante → página | Testes de versão, aprovação, vínculo e bloqueio de rascunhos/alegações não verificadas | Pode fechar critérios parciais de Offer/Movement |
| 104 | Publicação/distribuição por canal e campanha | URLs públicas válidas, UTM, eventos com denominadores, teste E2E de navegação | HTTPS do domínio RUBI; ganhos somente após aceite |
| 105 | Store/Stories e experiência premium mobile | Primeiro SKU real exibido e mídia autorizada, jornada loja → página → pré-checkout | Produto autorizado e domínio próprio |
| 106 | Complementary Offers + Kairos | Sugestões adequadas na RUBI; bump/upsell configurados e confirmados na Kairos sem duplicidade | Acesso à conta Kairos e capacidade oficial de checkout |
| 107 | Partners e comissão atribuída | Link único, revogação, atribuição preservada e pedido/estorno conciliados | Mecanismo confiável da Kairos; não desbloquear por aproximação |
| 108 | Perfis e Shadow Master | E2E consumidor/lojista/parceiro/Master, isolamento, acesso negado e revisão | Domínio público, contas de teste e dados autorizados |
| 109 | Intelligence + IA assistida | Relatórios distinguem cliques, pedidos pagos, receita e comissões; agente oferece rascunhos com revisão humana | Dados reais e contrato de integração aprovado |
| 110 | Piloto comercial | Compra autorizada (quando possível), retorno, pedido, taxas e estorno conferidos com provedor | SKU/checkout Kairos reais, ambiente publicado |
| 111 | Auditoria de lançamento | Matriz atualizada por evidências, backlog priorizado e decisão explícita de lançamento | Conclusão dos testes e dependências anteriores |

## Contrato comercial preservado

Canais, criativos, Stories e links de parceiros → página de oferta/movimento da RUBI em domínio HTTPS próprio → pré-checkout RUBI → checkout final na Kairos para produtos ali cadastrados → conciliação oficial. O pré-checkout pode convidar o visitante a cadastrar-se, mas **o cadastro é opcional**. A RUBI não coleta dados de cartão; Kairos administra meios de pagamento e bump/upsell/downsell configurados no checkout quando houver suporte. Não inferir que cross-sell no site altera carrinho da Kairos.

Parceiros usam link individual e acesso autorizado; o código mantém bloqueio de redirecionamento para parceiro sem atribuição comprovada. Nenhum clique, cadastro ou checkout aberto é venda paga. O Shadow Master permanece exclusivo e seu acesso é validado no servidor.

## Critérios para subir a porcentagem

Cada aumento exige uma entrada na matriz com: ID do requisito, módulo, status anterior e novo (0 / 0,5 / 1), PR/commit, caminho de código, teste, resultado CI, validação hospedada quando necessária, dependências externas, data e revisão do denominador. Sem isso, manter 64,6% como última medição confiável. Não prometer que determinada sprint necessariamente atingirá 70%, 80% ou 90%.

## Próximos passos operacionais em paralelo

- Identificar domínio RUBI, DNS, certificado, URL pública e acesso mobile.
- Obter na Kairos o primeiro SKU/autorização, link oficial HTTPS, hostname do checkout, preço, custos e termos de repasse.
- Separadamente obter capacidade real de atribuição dos parceiros, confirmação de pedidos e tratamento de estornos.
- Não cadastrar checkout_host fictício, não inventar pedido ou comissão, nem publicar ofertas sem mídia e alegações autorizadas.
