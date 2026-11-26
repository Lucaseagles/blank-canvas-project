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
| 11.3 | Auditoria administrativa completa | 0.5 | PR #308 (HEAD 44566d17) aprovada nos três workflows; PostgreSQL descartável comprovou grants, negação de não-Owner, rollback atômico por falha de auditoria, ciclo native/bridge-video e concorrência com duas sessões. Inventário DML transversal de todas as mutações administrativas ainda pendente; sem ponto adicional nesta rodada. |
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
| 11.3 Auditoria administrativa | PR #308 no HEAD `44566d17b9d714953768e0a07b5fe36b4ef4fb33`; Hub V1 QA, Sprint 33 QA e E2E concluídos com sucesso. O PostgreSQL local descartável comprovou grants das RPCs, negação server-side de não-Owner, rollback atômico quando a auditoria falha, ciclos native-video/bridge-video e concorrência/locking em duas sessões. | A prova cobre os caminhos de vídeo/compliance desta sprint, não todas as mutações Master. Falta concluir o inventário DML transversal (rota → função → RPC/tabela → RLS/GRANT → auditoria → teste) e validar os demais candidatos identificados na seção 22 do inventário. |
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


## Atualização de evidência — 2026-11-25 (PR #308 / Sprint 307)

A rodada final da Sprint 307 foi confirmada no GitHub para o HEAD `44566d17b9d714953768e0a07b5fe36b4ef4fb33`:

- Hub V1 Integration QA: SUCCESS (run 45595135110).
- Sprint 33 QA: SUCCESS (run 45595135246), incluindo TypeScript, ESLint, build e regressão Sprint 307.
- RUBI Local Authenticated E2E — Four Profiles: SUCCESS (run 45595134853), incluindo smoke PostgreSQL descartável, rollback por falha de auditoria, Owner isolation, concorrência em duas sessões e E2E autenticado mobile/desktop.
- Os testes de rollback e concorrência comprovam o escopo de vídeo/bridge-video da Sprint 307; não certificam o inventário global de mutações administrativas.
- Score permanece 36,5/48 (76,0%) como baseline agregada provisória; score por linha continua não reconciliado. Pontos novos convertidos: 0.
- Classificação desta atualização: upgrade-only / atualização de evidência. PR #308 permanece aberta, não Draft, pronta para revisão e não integrada (estado confirmado no GitHub em 2026-11-26).


## Atualização consolidada — 2026-11-26

Esta atualização prevalece sobre o estado de execução descrito nas notas históricas acima. As rodadas antigas foram mantidas para rastreabilidade.

| PR | HEAD validado | Hub V1 | Sprint 33 | E2E quatro perfis | Estado |
|---|---|---|---|---|---|
| #308 / Sprint 307 | `44566d17b9d714953768e0a07b5fe36b4ef4fb33` | SUCCESS | SUCCESS | SUCCESS — 22/22 | Aberta, pronta para revisão, não integrada |
| #310 / Sprint 308 | `17d1473ae7c637a7269fadc9c7da07b74d0a323b` | SUCCESS | SUCCESS | SUCCESS — 22/22 | Aberta, pronta para revisão, não integrada |
| #311 / Sprint 309 | `21c17531694ff005222d47a4476873316a4c75f2` | SUCCESS | SUCCESS | SUCCESS | Aberta, pronta para revisão, não integrada |

### Regras de pontuação após os novos testes
- 11.3: PR #308 cobre vídeo/compliance, grants, Owner isolation, rollback e concorrência. O inventário de todas as mutações administrativas continua incompleto; score adicional = 0 por enquanto.
- 12.3: E2E local em quatro perfis, 11 cenários em mobile/desktop e 22/22 testes aprovados nas PRs #308 e #310. Staging HTTPS/hospedado e evidência independente ainda faltam; score adicional = 0 por enquanto.
- 11.4: manter Shadow Master único e privado. Não implementar múltiplos Masters para cumprir critério conflitante; formalizar revisão da rubrica.
- 36,5/48 é baseline agregada histórica/provisória. Score atual por linha segue não reconciliado; não distribuir os 5 pontos de delta por inferência.

### Nova lacuna de privacidade identificada
A inspeção inicial da main encontrou gravação de `SESSION_START` no shell, `POPUP_TIMING_TRIGGER` e eventos comportamentais/personalização sem uma verificação comum de preferência global de analytics. Há opt-out de social proof e preferências de categorias, mas não foi localizado controle global de analytics nesta varredura. As políticas SQL encontradas protegem atribuição de usuário em eventos anônimos/autenticados, mas não substituem consentimento.

Também não foi localizada, nesta varredura inicial, uma política explícita de retenção, exportação e exclusão seletiva de `analytics_events`. Isso permanece hipótese de auditoria a confirmar em todas as migrations, RPCs, workers e política publicada.

**Próximo gate:** inventariar todos os escritores e dependências; mapear finalidade/base legal, transparência, opt-in/opt-out, retenção, exportação, anonimização/exclusão e efeitos em personalização/atribuição. Não implementar toggle isolado nem alterar RLS/tracking até fechar o mapa e os testes de regressão.

### Decisão
- Classificação: **upgrade-only / reconciliação documental**.
- Nenhum ponto V1 convertido nesta atualização.
- Nenhuma migration aplicada ao Supabase remoto; nenhum dado real alterado.
- Nenhuma das PRs #308, #310, #311 foi integrada neste corte; main preservada.


### Detalhamento da varredura de writers — 2026-11-26

A busca por gravações diretas e RPCs encontrou pelo menos estes caminhos ativos no código da main:

| Origem | Evento / operação | Identidade | Observação de auditoria |
|---|---|---|---|
| `src/routes/__root.tsx` | `SESSION_START` via `track_event` | anonymous ID + session ID persistidos no navegador | Disparado no shell sem consultar preferência global de analytics. |
| `src/components/PopupTimingController.tsx` | `POPUP_TIMING_TRIGGER` via `track_event` | session ID + anonymous ID | Registra gatilhos de entrada, produto, retorno, intenção de saída e tempo de navegação; sem verificação global de consentimento. |
| `src/lib/analytics.ts` | eventos de descoberta e `OUTBOUND_CLICK` | user ID autenticado ou anonymous ID | Escritor canônico client-side; exclui Owner, mas não consulta opt-in/opt-out global. |
| `src/lib/personalization.functions.ts` | view/click/favorite/video_start/video_complete | user ID validado por `verifyOptionalUser` | Grava evento e altera `user_interests`; isso afeta perfil comportamental e gamificação. Precisa de finalidade/consentimento próprios, não apenas toggle de analytics. |
| `src/lib/social-cross-promo.functions.ts` | `FOLLOW_CLICK` | usuário autenticado | Server function grava via service-role; precisa verificar consentimento e minimização para telemetria de intenção. |

A migration `20260908013417` marca um overload legado de `track_event` como SECURITY INVOKER quando presente e concede INSERT em `analytics_events` a anon/authenticated; `service_role` mantém privilégios amplos. A migration `20260826215127` restringe INSERT anônimo a `user_id IS NULL`, e a migration `20260822043757` cria política de INSERT autenticado com `auth.uid() = user_id`. Uma migration anterior concedeu SELECT/INSERT/UPDATE/DELETE a authenticated, mas os GRANTs não provam por si só que as operações de leitura/alteração sejam autorizadas por RLS; é necessário inspecionar o estado final completo de políticas e grants no schema efetivamente aplicado.

A coluna `user_id` foi criada com `ON DELETE SET NULL` em `analytics_events`. Isso pode preservar registros desvinculados quando a conta é apagada, mas não resolve a anonimização de `anonymous_id`, session IDs, metadata ou outros identificadores. Não foi encontrada nesta busca uma política de retenção temporal nem fluxo explícito de exportação/exclusão seletiva de analytics. Tratar como pendência de verificação, não como prova de inexistência.

**Próximo passo técnico obrigatório:** obter inventário final de políticas/RLS/grants e definição real da função track_event em uma instalação local descartável; listar todos os escritores por chamada; testar com usuário autenticado, anônimo, opt-out, revogação e falha do writer. Separar telemetria estritamente necessária à segurança/estabilidade de analytics opcional para marketing/personalização. Não apagar eventos nem mudar grants remotamente durante a auditoria.


### Verificação somente leitura no Supabase conectado — 2026-11-26

Projeto consultado: `heartful-helper-box` / `akfvkjarpgocdsieuvvq`, estado ACTIVE_HEALTHY, PostgreSQL 17.6. A consulta foi estritamente SELECT a catálogos de metadados e privilégios; nenhum dado de usuário foi consultado ou alterado.

**Políticas RLS efetivamente presentes em `public.analytics_events`:**
- SELECT: `Admin view analytics`, role authenticated, predicate `has_role(auth.uid(),'owner')`.
- INSERT: `Users can insert their own events`, authenticated, `auth.uid() = user_id`.
- INSERT: `Anonymous events must be unattributed`, anon, `user_id IS NULL`.
- Não há política SELECT para o próprio usuário comum, nem UPDATE/DELETE para usuário comum.
- RLS está habilitada. O catálogo efetivo não contém a política histórica ampla `Anyone can insert analytics_events`; a policy final é restrita por role e identidade.

**Privilégios de tabela efetivos:** `anon` e `authenticated` ainda aparecem com SELECT/INSERT/UPDATE/DELETE e outros privilégios de tabela no catálogo de grants. RLS limita as linhas/ações efetivamente autorizadas; ainda assim, os grants amplos para anon são excesso de privilégio e merecem redução explícita, testada em instalação local antes de qualquer migration.

**RPC `track_event`:** duas assinaturas coexistem no projeto conectado, ambas SECURITY INVOKER e ambas executáveis por anon/authenticated/service_role. A função não bypassa RLS; a proteção depende das políticas e grants da tabela. As assinaturas aceitam IDs de sessão/anônimo e metadados fornecidos pelo cliente, portanto payloads continuam observações não confiáveis e devem ser minimizados/validados.

**Impacto funcional a corrigir/testar:** o código client-side em `src/routes/history.tsx`, `src/components/product/ContinueBrowsing.tsx` e `src/components/profile/ProfileStorefront.tsx` consulta eventos do próprio usuário diretamente. A policy SELECT efetiva só permite Owner. Isso sugere que histórico/atividade do usuário comum não consegue ler esses eventos via Data API, mesmo quando o SELECT é filtrado por `auth.uid()`. Antes de abrir uma policy própria, verificar se os componentes têm tratamento de erro/empty state e se o desenho de privacidade permite histórico pessoal. A policy correta, caso confirmada, deve permitir apenas `auth.uid() = user_id`, nunca acesso entre usuários.

**Outro bloqueio de transparência:** `src/components/layout/Footer.tsx` mostra links “Política de Privacidade”, “Termos de Serviço” e “Configurações de Cookies”, mas os três usam `href="#"`. Não são destinos funcionais nem um mecanismo de consentimento. Não foi localizada uma rota de política publicada nesta varredura.

**Conclusão atualizada:** a auditoria saiu da hipótese baseada apenas em migrations e confirmou o estado efetivo de RLS/grants/RPC no Supabase conectado. Ainda não foi executada alteração alguma. Próxima implementação deve ser isolada em branch/PR: correção de leitura pessoal apenas se testes confirmarem, redução least-privilege dos grants, e centro de privacidade com categorias e persistência server-side depois de fechar base legal/finalidades. Não aplicar alterações diretamente ao projeto conectado.


## Estado de revisão confirmado — 2026-11-26 (consulta GitHub)

Esta seção substitui qualquer status operacional anterior que tenha ficado desatualizado. O conteúdo histórico acima foi preservado para rastreabilidade.

| PR | Estado atual consultado | Mergeable | Revisões humanas registradas | Decisão |
|---|---|---|---|---|
| #308 / Sprint 307 | Aberta, pronta para revisão, não Draft | true | Nenhuma | Testes técnicos verdes; aguarda revisão |
| #309 / inventário mestre | Aberta, pronta para revisão, não Draft | true | Nenhuma | PR documental; check `qa` SUCCESS no HEAD `43d5e262657c27d1fdc6cfb9bc952f9ed901d2bc` |
| #310 / Sprint 308 | Aberta, pronta para revisão, não Draft | true | Nenhuma | Testes técnicos verdes; aguarda revisão |
| #311 / Sprint 309 | Aberta, pronta para revisão, não Draft | true | Nenhuma | Testes técnicos verdes; aguarda revisão |
| #312 / analytics privacy | Aberta, pronta para revisão, não Draft | true | Nenhuma | Hub V1, Sprint 33 e E2E quatro perfis SUCCESS no HEAD `bf4fc9414c61ab6c321ef405ab4254122f43896b`; aguarda revisão |

### Limites da evidência
- O check `qa` da PR #309 passou com TypeScript, ESLint, build e regressão documental. Como o diff é somente Markdown, não houve execução dos workflows E2E/Hub V1 neste HEAD; os testes citados para #308, #310, #311 e #312 pertencem aos respectivos commits, não ao commit documental #309.
- `mergeable=true` é estado de merge calculado pelo GitHub, não substitui aprovação humana nem confirma que todas as regras de proteção foram satisfeitas.
- Nenhuma dessas PRs foi integrada nesta consulta. A branch `main` permaneceu inalterada.

**Classificação:** upgrade-only / atualização de governança. Nenhum ponto V1 adicional reivindicado.


## Estado operacional atualizado — 2026-11-26

Esta seção prevalece sobre as tabelas de estado anteriores, que registram o corte histórico de 2026-11-25/26 antes das integrações finais.

### PRs integradas na main

HEAD atual da main: `766f0f7b064f96916060779d5eb5a8bb87b57463`.

| PR | Escopo | Merge commit | Estado |
|---|---|---|---|
| #313 | Smart Collection — gravações server-only | `fc25a5240e4b1e41f464b6ba8842c813e56698d2` | Integrada |
| #311 | Campanhas orgânicas — unicidade transacional | `994c33110b568fb832ba5734269258c4ae25486b` | Integrada |
| #312 | Privacidade de analytics e privilégios mínimos | `8435e7f0b7cc0b968dfb7b218e67de260f2b74b9` | Integrada |
| #310 | Strategy Orchestration — pausa auditada | `766f0f7b064f96916060779d5eb5a8bb87b57463` | Integrada |

Para a #310, os três workflows obrigatórios passaram no HEAD validado: Hub V1 95/95, Sprint 33 15/15 e E2E quatro perfis 34/34, sem falhas.

### PRs abertas

- #308 / Sprint 307: aberta; ainda não integrada.
- #309 / inventário e reconciliação: esta própria PR; aberta, somente documental. A branch foi sincronizada com a main pelo merge commit `4b6b581e29c0f9770f9e9ad1aecc7bdf85ef8d10`; a validação do novo HEAD é necessária antes de qualquer merge.

### Score e classificação

- Classificação: upgrade-only / governança e atualização documental.
- Nenhum ponto novo convertido.
- Baseline agregada 36,5/48 (76,0%) continua apenas como referência provisória, sem distribuição autoritativa por linha.
- Não somar evidência de PRs integradas como pontos automáticos; cada critério exige correspondência explícita com a rubrica e prova integral.


## Estado consolidado pós-integrações — 2026-11-26

Esta seção é o estado operacional vigente e **prevalece sobre todas as tabelas de status anteriores**. As notas antigas foram preservadas como histórico dos respectivos cortes.

### Main e integrações

HEAD atual da main: `4859840370e9cca46670cb6581c3587c8a7ae369`.

| PR | Escopo | Estado |
|---|---|---|
| #313 | Smart Collection — gravações server-only | Integrada |
| #312 | Privacidade de analytics e least privilege | Integrada |
| #311 | Unicidade transacional de campanhas orgânicas | Integrada |
| #310 | Strategy Orchestration — ciclo auditado | Integrada |
| #309 | Inventário mestre / reconciliação documental | Integrada |
| #308 | Vídeo/compliance — bypass legado, rollback e concorrência | Integrada |
| #306 | Readiness Story → oferta, com E2E local atualizado | Integrada |
| #286 | Scorecard geral atualizado | Integrada |
| #71 | Especificação Movement Engine reconciliada com implementação atual | Integrada |
| #68 | Blueprint Offer Engine reconciliado com pré-checkout atual | Integrada |

PR #304 foi encerrada como supersedida por #310. PRs #4 e #6–#11 foram encerradas como já incorporadas à main: comparação GitHub mostrou zero commits exclusivos e as rotas/funções/migrations correspondentes continuam presentes. A fila consultada ficou com **zero PRs abertas**.

### CI pós-integração

- PR #308 / HEAD `a878cbe4a4f584d959b73ce142f54f156573ce6a`: Hub V1 SUCCESS (95/95 etapas); Sprint 33 SUCCESS (16/16); E2E SUCCESS (22/22 testes, 11 cenários mobile/desktop, zero unexpected/skipped/flaky). O smoke de vídeo/compliance passou com Owner/non-Owner, grants, rollback por falha de auditoria e concorrência.
- PR #310: Hub V1, Sprint 33 e E2E aprovados no HEAD validado; ciclo Strategy Orchestration auditado, rollback e concorrência cobertos.
- PR #306, #309, #286, #71 e #68: Sprint 33 QA passou em cada HEAD documental atualizado.
- Main no HEAD `4859840370e9cca46670cb6581c3587c8a7ae369`: Sprint 33 QA SUCCESS (16/16 etapas).

As execuções PostgreSQL/E2E mencionadas usaram Supabase local descartável. **Nenhuma migration foi aplicada ao Supabase remoto** nesta sequência.

### Decisão da matriz V1

- Baseline agregada preservada: **36,5/48 = 76,0%**, com gap aritmético de 11,5 pontos.
- Score atual por linha: **continua não reconciliado**. Não redistribuir os cinco pontos de diferença entre 31,5/48 (Sprint 122) e 36,5/48 (Sprint 207) por inferência.
- Pontos novos prontos para conversão: **0/11,5** nesta rodada.
- Classificação: **upgrade-only / hardening / atualização de evidência**.

### Critérios com evidência melhorada, mas sem conversão

| Critério | Evidência atual na main | Por que não soma ponto nesta rodada |
|---|---|---|
| 02.4 — Jornada Story E2E | E2E local persistido: Story → mesmo produto → pré-checkout interno, 22/22 testes e 11 cenários mobile/desktop. | Ainda falta staging HTTPS autorizado, evidência hospedada e round-trip de provedor quando aplicável. Host de teste é sintético; nenhum pagamento ocorreu. |
| 11.3 — Auditoria administrativa completa | PRs #308, #310, #312 e #313 ampliam auditoria, grants mínimos, rollback e concorrência em caminhos específicos. | Ainda falta inventário DML transversal e exaustivo de todas as mutações Master, com rota → server function → RPC/tabela → grants/RLS → log → teste negativo/rollback. |
| 12.3 — E2E quatro perfis | Quatro perfis isolados, mobile/desktop, jornadas persistidas e negação de não-Owner aprovadas no Supabase local descartável. | Staging hospedado e revisão independente do pacote de evidências continuam pendentes. |
| 07.4 — Biblioteca de ativos licenciados | Já incluído como 1,0 na baseline histórica de 36,5/48. | Não recontar. Ativos/licenças reais e uso comercial não reabrem automaticamente o ponto técnico. |
| 11.4 — Múltiplos Masters | A arquitetura atual preserva um Shadow Master único e privado. | Conflito de escopo: não criar Masters adicionais para satisfazer rubrica obsoleta. Formalizar exclusão/ajuste da régua sem alterar pontuação silenciosamente. |

### Gaps ainda dependentes de evidência externa/financeira

- 01.4 / 10.4: compra paga, reversão e coortes/LTV reais.
- 03.4 / 06.4: venda externa atribuída e comissão confirmada por fonte oficial.
- 04.4: checkout oficial, webhook/retorno confiável, idempotência e reconciliação.
- 05.4: pedido B2B pago, frete e auditoria de ponta a ponta.
- 09.3 / 09.4: bump e upsell efetivamente cobrados e confirmados pelo provedor.
- 12.4: pedido pago, repasse, estorno e conciliação completos.

Clique, interesse, redirect, fixture local, pré-checkout e linha interna de pedido não substituem essas provas.

### Próxima onda de cobertura (não apenas upgrades)

1. Fechar o inventário DML de 11.3 em todos os módulos e validar cada caminho no PostgreSQL descartável.
2. Reauditar 08.2/08.3/08.4/10.3: separar validação de público, comparação descritiva, teste A/B causal e retenção real.
3. Reauditar 03.3: distinguir plano de distribuição, publicação manual declarada e publicação/entrega confirmada pelo canal.
4. Reauditar 01.3 com preferências, consentimento e finalidade de personalização.
5. Preparar staging HTTPS autorizado e checkout de teste oficial; sem isso, manter os gates externos bloqueados.

**Conclusão:** a main ficou mais segura e as evidências locais ficaram substancialmente melhores, mas a pontuação permanece 36,5/48 como baseline agregada provisória. Nenhum ponto novo foi convertido e não há data de 100% defensável antes da reconciliação por linha e das provas externas.
