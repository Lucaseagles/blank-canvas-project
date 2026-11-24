# Sprint 309 — reconciliação linha a linha da matriz V1 (48 critérios)

**Data:** 2026-11-24  
**Base:** `main` após Sprint 306 / PR #307. PR #308 e PR #309 permanecem abertos e não integrados no corte desta revisão.  
**Classificação:** upgrade de governança / inventário; **não concede pontos**.

## Resultado executivo

A baseline formal carregada é **36,5/48 = 76,0%**, com gap aritmético de **11,5 pontos**. O repositório, porém, não contém a distribuição autoritativa desses 36,5 pontos por critério. O documento Sprint 122 traz 48 linhas e total histórico 31,5/48; Sprint 135 registra 32/48; Sprint 207 estabelece 36,5/48, mas não publica uma redistribuição completa e consistente das 48 linhas. O Sprint 301 já documenta explicitamente essa limitação.

**Regra aplicada nesta reconciliação:** preservar o valor histórico da Sprint 122 apenas como referência; mostrar o estado da evidência posterior onde há prova; deixar score atual por linha como “não reconciliado” até localizar o delta integral de +5 pontos e validar os critérios que tiveram mudança de escopo. Não distribuir os 5 pontos por inferência.

## Matriz nominal — 48 critérios

A coluna “score Sprint 122” é a avaliação revisada histórica, não o score atual de 2026-11-24. A última coluna registra a evidência posterior conhecida e o próximo gate, sem conceder ponto.

| ID | Critério | Score Sprint 122 | Evidência posterior / próximo gate |
|---|---|---:|---|
| 01.1 | Cadastro dos três públicos | 1.0 | Revalidar contra a main atual e evidência pós-Sprint 122; não atribuir automaticamente o valor histórico. |
| 01.2 | Feed de descoberta | 1.0 | Revalidar contra a main atual e evidência pós-Sprint 122; não atribuir automaticamente o valor histórico. |
| 01.3 | Personalização por audiência | 0.5 | Revalidar contra a main atual e evidência pós-Sprint 122; não atribuir automaticamente o valor histórico. |
| 01.4 | Coortes e recompra pagas | 0.0 | Depende de evidência comercial externa/financeira ou de pedido pago; código, clique e pré-checkout não bastam. |
| 02.1 | Histórico de produtos e vídeos | 1.0 | Revalidar contra a main atual e evidência pós-Sprint 122; não atribuir automaticamente o valor histórico. |
| 02.2 | Narrativa e vídeos da marca | 1.0 | Revalidar contra a main atual e evidência pós-Sprint 122; não atribuir automaticamente o valor histórico. |
| 02.3 | Movimentos Story versionados | 0.5 | Revalidar contra a main atual e evidência pós-Sprint 122; não atribuir automaticamente o valor histórico. |
| 02.4 | Jornada Story E2E | 0.0 | E2E local persistido Story → produto correspondente → pré-checkout interno passou em mobile/desktop (22/22 no PR #307); falta staging HTTPS e checkout externo. |
| 03.1 | Vitrine e vídeos | 1.0 | Revalidar contra a main atual e evidência pós-Sprint 122; não atribuir automaticamente o valor histórico. |
| 03.2 | UTM e roteamento | 1.0 | Revalidar contra a main atual e evidência pós-Sprint 122; não atribuir automaticamente o valor histórico. |
| 03.3 | Distribuição multicanal confirmada | 0.5 | Revalidar contra a main atual e evidência pós-Sprint 122; não atribuir automaticamente o valor histórico. |
| 03.4 | Comissões externas conciliadas | 0.0 | Depende de evidência comercial externa/financeira ou de pedido pago; código, clique e pré-checkout não bastam. |
| 04.1 | Catálogo de produtos e fornecedores | 1.0 | Revalidar contra a main atual e evidência pós-Sprint 122; não atribuir automaticamente o valor histórico. |
| 04.2 | Pré-checkout validado | 1.0 | Revalidar contra a main atual e evidência pós-Sprint 122; não atribuir automaticamente o valor histórico. |
| 04.3 | Landing editorial aprovada | 1.0 | Revalidar contra a main atual e evidência pós-Sprint 122; não atribuir automaticamente o valor histórico. |
| 04.4 | Checkout/host externo preparado e conciliado | 0.5 | Depende de evidência comercial externa/financeira ou de pedido pago; código, clique e pré-checkout não bastam. |
| 05.1 | Preços/quantidades no atacado | 1.0 | Revalidar contra a main atual e evidência pós-Sprint 122; não atribuir automaticamente o valor histórico. |
| 05.2 | Cotações e respostas | 1.0 | Revalidar contra a main atual e evidência pós-Sprint 122; não atribuir automaticamente o valor histórico. |
| 05.3 | Requisição de reposição | 1.0 | Revalidar contra a main atual e evidência pós-Sprint 122; não atribuir automaticamente o valor histórico. |
| 05.4 | Pedido B2B pago e frete auditado | 0.0 | Depende de evidência comercial externa/financeira ou de pedido pago; código, clique e pré-checkout não bastam. |
| 06.1 | Grants aprovados | 1.0 | Revalidar contra a main atual e evidência pós-Sprint 122; não atribuir automaticamente o valor histórico. |
| 06.2 | Links e visitas individuais | 1.0 | Revalidar contra a main atual e evidência pós-Sprint 122; não atribuir automaticamente o valor histórico. |
| 06.3 | Comissões e relatórios | 1.0 | Revalidar contra a main atual e evidência pós-Sprint 122; não atribuir automaticamente o valor histórico. |
| 06.4 | Compra externa atribuída e conciliada | 0.0 | Depende de evidência comercial externa/financeira ou de pedido pago; código, clique e pré-checkout não bastam. |
| 07.1 | Playbook de ofertas | 1.0 | Revalidar contra a main atual e evidência pós-Sprint 122; não atribuir automaticamente o valor histórico. |
| 07.2 | Publicação e revogação segura | 1.0 | Revalidar contra a main atual e evidência pós-Sprint 122; não atribuir automaticamente o valor histórico. |
| 07.3 | Variantes persistidas e comparáveis | 1.0 | Revalidar contra a main atual e evidência pós-Sprint 122; não atribuir automaticamente o valor histórico. |
| 07.4 | Biblioteca de ativos reutilizáveis e licenciados | 0.0 | Valor histórico evoluiu até 1,0 na Sprint 207; não somar novamente. Licenças/ativos reais e uso comercial ainda não comprovados. |
| 08.1 | Múltiplos movimentos por SKU | 1.0 | Revalidar contra a main atual e evidência pós-Sprint 122; não atribuir automaticamente o valor histórico. |
| 08.2 | Público/ângulo validado | 0.5 | Revalidar contra a main atual e evidência pós-Sprint 122; não atribuir automaticamente o valor histórico. |
| 08.3 | Criativos/páginas e experimento A/B | 0.5 | Revalidar contra a main atual e evidência pós-Sprint 122; não atribuir automaticamente o valor histórico. |
| 08.4 | Desempenho por público e movimento | 0.5 | Revalidar contra a main atual e evidência pós-Sprint 122; não atribuir automaticamente o valor histórico. |
| 09.1 | Admin tipos de ofertas complementares | 1.0 | Revalidar contra a main atual e evidência pós-Sprint 122; não atribuir automaticamente o valor histórico. |
| 09.2 | Cross-sell e downsell separados | 1.0 | Revalidar contra a main atual e evidência pós-Sprint 122; não atribuir automaticamente o valor histórico. |
| 09.3 | Bump cobrado no checkout Kairos | 0.0 | Depende de evidência comercial externa/financeira ou de pedido pago; código, clique e pré-checkout não bastam. |
| 09.4 | Upsell pós-compra confirmado | 0.0 | Depende de evidência comercial externa/financeira ou de pedido pago; código, clique e pré-checkout não bastam. |
| 10.1 | Eventos de aquisição e pré-checkout | 1.0 | Revalidar contra a main atual e evidência pós-Sprint 122; não atribuir automaticamente o valor histórico. |
| 10.2 | Painel orgânico canal/campanha | 1.0 | Revalidar contra a main atual e evidência pós-Sprint 122; não atribuir automaticamente o valor histórico. |
| 10.3 | Comparação e retenção por variante | 0.5 | Revalidar contra a main atual e evidência pós-Sprint 122; não atribuir automaticamente o valor histórico. |
| 10.4 | Compra paga e LTV reais | 0.0 | Depende de evidência comercial externa/financeira ou de pedido pago; código, clique e pré-checkout não bastam. |
| 11.1 | Proteção server-side do Master | 1.0 | Revalidar contra a main atual e evidência pós-Sprint 122; não atribuir automaticamente o valor histórico. |
| 11.2 | Gestão administrativa de catálogo | 1.0 | Revalidar contra a main atual e evidência pós-Sprint 122; não atribuir automaticamente o valor histórico. |
| 11.3 | Auditoria administrativa completa | 0.5 | PR #308 testa remoção de bypass legado e workflows verdes; inventário DML exaustivo, execução SQL/rollback/concorrência em DB descartável ainda pendentes. |
| 11.4 | Múltiplos masters sem hardcode | 0.0 | Conflito de escopo: arquitetura aprovada mantém um Shadow Master privado. Não criar Masters adicionais; revisar formalmente a rubrica antes de pontuar. |
| 12.1 | CI TypeScript lint build testes | 1.0 | Revalidar contra a main atual e evidência pós-Sprint 122; não atribuir automaticamente o valor histórico. |
| 12.2 | Migrações e RLS protegidas | 1.0 | Revalidar contra a main atual e evidência pós-Sprint 122; não atribuir automaticamente o valor histórico. |
| 12.3 | E2E mobile/desktop dos quatro perfis | 0.0 | E2E local autenticado de quatro perfis em mobile/desktop passou; staging hospedado e pacote de evidências/revisão independente pendentes. |
| 12.4 | Pedido real, repasse e estorno | 0.0 | Depende de evidência comercial externa/financeira ou de pedido pago; código, clique e pré-checkout não bastam. |

## Evidências posteriores já confirmadas

| Critério | Evidência atual | Gate que ainda impede conversão adicional |
|---|---|---|
| 02.4 Story E2E | PR #307 integrada; E2E local persistido com Story publicada → mesma página de produto → pré-checkout interno em mobile e desktop. Workflow E2E do PR #308 reportou 22/22, sem unexpected/skipped/flaky. | HTTPS staging autorizado, evidência hospedada e round-trip do provedor. O host `checkout.example.test` é sintético; não houve pagamento. |
| 07.4 Biblioteca licenciada | Sprint 207 elevou formalmente o critério a 1,0 e a baseline a 36,5/48. | Não pontuar novamente. Operação ainda depende de ativos/licenças reais e revisão de uso comercial. |
| 11.3 Auditoria administrativa | PR #308 no head `9e15f125ded8cba2320e86cb1b104c990508edbf`; Hub V1 QA, Sprint 33 QA e E2E concluídos com sucesso. O E2E executa migrações em Supabase local descartável; teste específico novo cobre remoção de caminhos legados de vídeo/compliance. | O teste novo é majoritariamente source-level. Ainda falta executar as RPCs relevantes em banco descartável, provocar falha de auditoria para provar rollback, concorrência/locking e terminar inventário exaustivo de DML administrativo. |
| 12.3 Quatro perfis | E2E local autenticado cobre consumidor, lojista aprovado, parceiro aprovado e Shadow Master em mobile/desktop, inclusive negação de não-Owner. | Não confundir ambiente descartável com staging hospedado; falta revisão independente do pacote completo. |
| 11.4 Masters delegáveis | A documentação histórica pontuou a capacidade técnica de delegação. | Decisão de produto atual é manter um Shadow Master privado e único. Não implementar segundo Master para satisfazer requisito obsoleto; formalizar exclusão/ajuste de escopo e tratar qualquer efeito na régua sem alterar a pontuação silenciosamente. |

## Carteira de critérios que exigem prova externa ou financeira

Estes são os principais candidatos de maior dependência. A lista não presume que sejam os únicos pontos restantes:

- **01.4 / 10.4:** eventos pagos liquidados, reversões e coortes/LTV reproduzíveis.
- **03.4 / 06.4:** venda externa atribuída e comissão confirmada por relatório oficial do marketplace/rede.
- **04.4:** checkout oficial, webhook/evento do provedor, reconciliação e falhas/idempotência.
- **05.4:** pedido B2B pago, snapshot de frete, transições e auditoria.
- **09.3 / 09.4:** order bump e upsell efetivamente cobrados e confirmados no provedor.
- **12.4:** pedido pago, comissão/payout, estorno e conciliação completos.

Nenhuma destas provas pode ser substituída por clique, redirect, pré-checkout, fixture local, webhook inventado ou linha interna de pedido.

## Próxima varredura — critérios de implementação sem bloqueio externo

1. **11.3:** concluir mapa de mutações DML por rota → server function → RPC/tabela → política → log de auditoria; executar rollback e concorrência em DB descartável.
2. **08.2 / 08.3 / 08.4 / 10.3:** confrontar variantes, distribuição, denominadores, amostragem, retenção e experimentos contra código e testes atuais; distinguir comparação descritiva de A/B causal.
3. **03.3:** confirmar quais conectores/canais publicam de fato e quais apenas registram intenção/fila; exigir idempotência, retry e confirmação de entrega.
4. **01.3:** revalidar ranking e personalização contra preferências/consentimento, explicabilidade e jornada observável; não duplicar o ponto histórico.
5. **12.1 / 12.2:** manter CI/migrações como evidência de regressão e segurança; não atribuir ponto extra por repetição de pipelines.

## Divergência de escopo que precisa ser resolvida antes de fechar os 100%

O critério **11.4 — múltiplos Masters** conflita com a decisão arquitetural mais recente: Shadow Master deve permanecer privado e exclusivo ao Owner. O inventário atual já determina que não se deve criar outro Master. A pontuação histórica 36,5/48 pode conter crédito técnico por delegação, mas isso não significa que o requisito continue válido. A decisão correta é versionar a rubrica: marcar 11.4 como **fora do escopo aprovado** e documentar como o denominador V1 será tratado, sem fingir que a funcionalidade está faltando e sem elevar o percentual por exclusão silenciosa.

## Decisão de score

- Baseline carregada: **36,5/48 (76,0%)** — mantida apenas como total de referência.
- Score atual por linha: **não reconciliado** — não inventar redistribuição.
- Pontos novos prontos para conversão nesta rodada: **0**.
- Classificação: **upgrade-only**.
- PR #308 e PR #309 não são integradas neste corte.
- Nenhuma alteração foi feita no Supabase remoto, nenhum staging pago foi criado e nenhuma compra fictícia foi executada.

## Fontes internas

- `docs/rubi-coverage-v1-reassessment.md` — matriz nominal histórica de 48 linhas / 31,5 pontos.
- `docs/rubi-coverage-v1-sprint135-addendum.md` — progressão para 32/48.
- `docs/rubi-coverage-v1-sprint207-license-review.md` — 07.4 e baseline 36,5/48.
- `docs/coverage/sprint-301-v1-evidence-gap-register.md` — confirma que a distribuição atual dos 36,5 pontos não está disponível.
- `docs/coverage/sprint-306-story-journey-e2e-readiness.md` — gates de Story, quatro perfis e checkout externo.
- PR #308 — Sprint 307, auditoria de caminhos legados de vídeo/compliance.
