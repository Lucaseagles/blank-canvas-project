# RUBI 11× — Sprint 122: auditoria de cobertura e marcos para sair dos 64,6%

Atualização: 2026-11-12. Base: main após merge do PR #121 (commit `4d2b99259afab504a9668a51d10f6927e2fa0fbd`). Este documento define **como reauditar**; não atribui pontos sem revisar os 48 critérios individualmente.

## Estado verificável

- **Última medição formal comunicada:** 31/48 = **64,6%** da matriz técnica selecionada; não é percentual de uso, homologação comercial ou faturamento.
- PR #121 integrado após os dois CIs verdes, corrigindo TS18048, com código do painel de times. Integração do código não implica que dados reais existam ou que vendas tenham sido conciliadas.
- No Supabase `heartful-helper-box` em 2026-11-12: `rubi_creator_teams`, `rubi_creator_prospects`, `rubi_creator_team_members`, `hub_partner_referral_visits` e `hub_partner_confirmed_sales` estavam com **0 linhas**. Não fabricar exemplos ou taxas.
- Sem confirmação de HTTPS público RUBI, SKU/host real Kairos, atribuição Kairos e checkout/pedidos pagos. Continuam como bloqueios de homologação e receita.

## Pontuação histórica por módulo (não reavaliada)

| Módulo | Pontos / 4 | Última nota | Evidência recente a revisar |
|---|---:|---:|---|
| Eclipse / Consumidor | 2,5 | 62,5% | ranking por preferências e feed de movimentos aprovados (#105/#106) |
| Story / Marca Própria | 2,5 | 62,5% | Story e jornada comercial; faltam testes hospedados |
| Achadinhos Orgânico | 2,5 | 62,5% | recomendações de categorias, métricas sem transação |
| Store / Kairos | 3,5 | 87,5% | pré-checkout, prova social real (#109); pagamento externo ainda não validado |
| RUBI Business | 3,0 | 75,0% | cotações, reposição, painel de etapas (#112); pedido pago ainda pendente |
| RUBI Partners | 3,0 | 75,0% | CRM, times, metas e associação (#114/#118/#120/#121); checkout atribuível ainda bloqueado |
| Offer Engine | 2,5 | 62,5% | playbooks e variantes; rever biblioteca de mídia/direitos |
| Movement Engine | 2,5 | 62,5% | comparativo observacional (#104), anúncios assistidos (#113), aprovação de plano (#117); teste A/B/resultado real parcial |
| Complementary Offers | 2,0 | 50,0% | bump/upsell Kairos ainda não confirmado |
| Intelligence | 2,5 | 62,5% | medidas de três funis (#111/#112), grupos por time (#121); compras e LTV reais ausentes |
| Shadow Master / Segurança | 2,5 | 62,5% | central de decisões (#116), aprovação/registro (#117), RLS; testes E2E ainda pendentes |
| Qualidade / Operação | 2,0 | 50,0% | CIs verdes #121; E2E público e transação real pendentes |
| **Total** | **31/48** | **64,6%** | **nota histórica, não nova auditoria** |

## Regras para mudar a porcentagem

Um critério pode ganhar 0,5 ponto quando a lacuna era ausência de implementação e agora há componente + segurança + teste aprovado, mas seu aceite integral ainda não foi demonstrado; pode ganhar 1 ponto somente quando o requisito efetivo estiver coberto conforme seu contrato. CI verde sozinho não pontua. Cada alteração deve registrar:

1. ID do critério e **nota anterior → nova** (0 / 0,5 / 1);
2. evidência de código, migração aplicada, CI e teste específico;
3. prova de uso no ambiente publicado quando exigível;
4. dependências externas e impacto da mudança do escopo;
5. revisão assinada no histórico, com resultado reproduzível.

Métricas distintas: **A) cobertura de implementação**, **B) homologação de segurança/E2E**, **C) operação comercial e resultados**. A mesma porcentagem não representa as três.

### Escada matemática (somente se os mesmos 48 critérios permanecerem)

| Ganho de pontos comprovados | Total | Percentual |
|---:|---:|---:|
| 0 | 31,0/48 | 64,6% |
| +0,5 | 31,5/48 | 65,6% |
| +1,0 | 32,0/48 | 66,7% |
| +1,5 | 32,5/48 | 67,7% |
| +2,0 | 33,0/48 | 68,8% |
| +2,5 | 33,5/48 | 69,8% |
| **+3,0** | **34,0/48** | **70,8%** |
| +7,5 | 38,5/48 | 80,2% |

**Não afirmar que +3 pontos virão automaticamente das próximas três sprints.** Pode haver requisitos já inteiramente pontuados apesar dos PRs recentes; recalcular antes de divulgar nova nota.

## Novo escopo e denominador

As três estratégias de aquisição (agente vendedor com IA, resposta direta, times de influenciadores) criam requisitos antes não incluídos completamente nos 48 critérios. Propor matriz **v2** com ao menos quatro eixos adicionais: campanhas pagas/orçamento/autorizações, IA e criativos com direitos, times/qualificação/atribuição e prova social/comentários e controle. Não atribuir automaticamente 16 pontos novos nem fixar um denominador de 64 até mapear critérios sem duplicidade com a v1.

Se novos critérios forem adotados, publicar em paralelo `v1 em base fixa (48)` e `v2 em base ampliada`. A nova porcentagem pode cair inicialmente porque o denominador cresce; isso é transparência, não perda de código.

## Próximos sprints e pontos de decisão

| Sprint | Próximo feito e teste de aceite | Efeito possível na nota |
|---|---|---|
| **122 — reauditoria (agora)** | Revisar os 48 IDs contra a `main` após PR #121, registrar PR, testes, RLS e pendências por critério; definir v2 com novos requisitos | **Primeira oportunidade de sair de 64,6%** se evidências existentes comprovarem ganho sem dupla contagem |
| **123 — times e campanhas** | Preservar histórico de participação, vincular campanha/variante/produto aos times, impedir reatribuição retroativa, testes de revogação e volume | Pode elevar critérios parciais de Partners/Intelligence, condicionado a QA |
| **124 — funis operacionais** | Publicação e distribuição por público/canal com rastreabilidade e denominadores; revisar consentimento, privacidade e análise A/B | Pode elevar Movement/Intelligence/Offer se os critérios forem realmente concluídos |
| **125 — conversão e retenção** | Reviews reais e moderados (#108), tratamento de UI, relação com produtos e segurança, acompanhamento de cotações/recompras | Ganho possível de v2, não necessariamente da matriz v1 |
| **126 — piloto HTTPS** | URL RUBI publicada, QA desktop/mobile por 4 papéis, um SKU real, página e checkout Kairos oficial revisados | Pode elevar Qualidade/Store conforme critério |
| **127 — atribuição e conciliação** | Vendas reais, comissões, estornos, custos, retornos/repasse Kairos, teste de ponta a ponta | Libera critérios comerciais de Store/Partners/Intelligence, com dados reais |
| **128 — IA e mídia paga operacional** | Integração autorizada, criativos revisados, aprovação, controle de gasto e rastreamento de campanha | Pontuação de matriz v2 após evidência |
| **129 — revisão final de lançamento** | Regressão multi-perfil, segurança e margens; decisão go/no-go; comparar cobertura v1/v2, E2E e comercial | Meta de 80%+ só se comprovada |

São **marcos de trabalho, não datas garantidas**. Para superar 64,6% não precisamos esperar a Kairos se a reauditoria identificar critérios técnicos já concluídos; para 100% da operação comercial, sim, precisamos validar pagamentos reais.

## Bloqueios e responsabilidade

- **RUBI:** auditoria dos critérios, testes, correções, CI, RLS, provas reais, gestão de perfis, UX.
- **Dependências externas:** domínio RUBI HTTPS publicado, autorização e primeiro SKU/checkout Kairos, API ou método seguro de conciliação e atribuição, contas de anúncios e direitos/licenças de criativos.
- **Não remover proteção** de parceiro para forçar venda sem atribuição; não estimar faturamento como ocorrido.

## Próximo relatório esperado

Publicar `docs/rubi-coverage-v1-reassessment.md` com **48 linhas de critérios**, pontuação v1 anterior/atual e links de evidências. Só depois disso substituir 64,6% por novo número auditado. Abrir matriz v2 separadamente, para não esconder a expansão de escopo.
