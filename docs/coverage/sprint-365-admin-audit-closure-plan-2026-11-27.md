# Sprint 365 — fechamento transversal da auditoria administrativa

**Status:** iniciada após integração das entregas de prontidão da Sprint 364.  
**Branch:** `sprint/365-admin-audit-closure`  
**Base:** `main` em `05246475791c94f8f4557b62af99bf3f353af2e1`.  
**Critério prioritário:** 11.3 — auditoria administrativa completa.  
**Classificação:** cobertura candidata; nenhuma pontuação é concedida por abrir a sprint, inventariar código ou passar CI.

## Por que esta sprint vem agora

A Sprint 364 entregou a jornada E2E local autenticada e os preparativos seguros para staging (PRs #392 e #393 integradas). A execução hospedada ainda depende de configuração externa do GitHub Environment `rubi-staging` — URL HTTPS isolada, fixtures descartáveis e identidades de QA. Portanto, 02.4 fica em estado **pronto para homologação / bloqueado por configuração externa**, sem declarar o critério fechado nem atribuir o ponto potencial.

Para continuar gerando valor sem ficar parado aguardando credenciais de staging, a Sprint 365 prioriza 11.3, uma frente code-closeable com potencial de cobertura maior e dependência principal de inventário transversal + PostgreSQL descartável.

## Integridade do placar

Há referências históricas divergentes entre documentos de reconciliação: 38.0/48 aparece em plano de Sprint 362; mensagens operacionais posteriores citaram 39.0/48. A Sprint 365 não vai propagar uma dessas cifras como oficial sem reconciliar a matriz completa de 48 linhas contra a `main` atual e os merges posteriores. Até essa reconciliação, preservar o último placar oficial já publicado e registrar qualquer número novo como não confirmado.

## Pacotes e gates de aceite

| Pacote | Trabalho | Prova obrigatória | Estado |
|---|---|---|---|
| A — Inventário transversal | Mapear tela/rota → server function → RPC/DML → tabela → trigger/audit → RLS/GRANT → teste | Relatório gerado + revisão manual de exceções | Pendente |
| B — Busca de bypass | Detectar DML sensível fora de RPC auditada e caminhos indiretos | Busca automatizada, classificação e justificativa de cada exceção | Pendente |
| C — Matriz de papéis | Owner permitido; anon e perfis não-Owner negados em todas as famílias sensíveis | Testes negativos e positivos com identidades isoladas | Pendente |
| D — Atomicidade | Falha de audit deve reverter mutação de negócio | PostgreSQL descartável com falha forçada e estado final consultado | Pendente |
| E — Concorrência/idempotência | Requisições simultâneas e retries não podem duplicar efeitos indevidos | Duas sessões/transações concorrentes, ledger e audit conferidos | Pendente |
| F — Privacidade | Nenhum segredo/token/dado sensível em audit ou artefato | Testes de redaction e inspeção do relatório sanitizado | Pendente |
| G — Release | Todos os gates no mesmo HEAD e revisão das 48 linhas | Workflows verdes + relatório final + PR de release para main | Pendente |

## Oportunidade de maior pontuação

O 11.3 foi historicamente parcial (0.5/1.0 em reconciliação anterior), mas essa cifra precisa ser revalidada antes de qualquer conversão. O teto teórico de ganho é até +0.5 se a rubrica atual confirmar que falta somente a metade final; não anunciar esse ganho como conquistado nem como garantido.

A primeira ação é comparar a main atual com o inventário existente da Sprint 362, recuperar os artefatos reais e separar:
1. famílias já cobertas e que precisam apenas de evidência;
2. gaps de autorização/Owner e grants;
3. gaps de atomicidade/rollback;
4. caminhos sem trilha de auditoria;
5. funções ou migrações cuja definição não está versionada.

Não reimplementar famílias já auditadas sem demonstrar uma lacuna real. Não inventar SQL ausente nem alterar Supabase remoto/produção.

## Critério 02.4 herdado da Sprint 364

- PR #392: jornada local autenticada e workflow de staging.
- PR #393: correção do contexto de artefato e documentação de configuração isolada.
- Ambas integradas à `main`.
- O workflow hospedado requer configuração manual do Environment `rubi-staging` e confirmação de staging descartável.
- Enquanto isso não ocorrer, 02.4 permanece sem conversão adicional.

## Política de pontuação

- PR filha, inventário, documentação e CI verde isoladamente: +0.
- Converter somente após todos os gates aplicáveis, artefatos e aceite explícito da rubrica.
- Atualizar a matriz uma única vez no fechamento da Sprint 365.
- Não duplicar pontos de 02.4, 08.3 ou critérios já integralmente pontuados.
- Se o inventário provar que não há gap implementável sem dependência externa, encerrar como upgrade-only e priorizar outro critério com melhor relação ganho/esforço.

## Próxima ação imediata

Gerar o inventário real da `main`, cruzar cada mutação com as migrations e testes já existentes, identificar o menor bypass/gap ainda não fechado e abrir a primeira PR filha apenas quando houver uma mudança funcional comprovável.


## Reconciliação após PR #394 e seleção da próxima entrega — 27/11

### Integração confirmada
- PR #394 foi integrada à `main` por squash no commit `caa569218d943bafffe6529c2edbecf5fc6baf50`.
- No mesmo HEAD `634d93f2309e927987f51e8292ad055a425f436b`, Sprint 33 QA, Hub V1 Integration QA e E2E autenticado dos quatro perfis terminaram SUCCESS.
- A PR #394 entrega scanner heurístico e governança da Sprint 365; não prova inventário SQL/RPC nem converte pontos.

### Candidatos antigos revalidados como já implementados
- Marketplaces: `rubi_manage_marketplace_audited` cobre CRUD, credenciais e status; Owner check, lock, auditoria transacional, redação de credenciais e grants service_role estão na migration `20261117120000_rubi_marketplace_atomic_audit.sql`, com teste e smoke dedicados.
- Métricas Telegram: `rubi_record_telegram_metric_audited` grava métrica e evento de auditoria na mesma transação; Owner, canal ativo, `FOR SHARE`, grants e teste estão versionados na migration `20261117143000_rubi_telegram_metric_atomic_audit.sql`.
- Recálculo manual de tendências: o caminho anteriormente apontado como gap agora usa `rubi_recalculate_trending_audited`; a migration `20261127160000_rubi_manual_trending_atomic_audit.sql`, teste de contrato, smoke PostgreSQL e smoke de concorrência estão na `main`. A operação valida Owner, serializa execução, registra `automation_logs` e `admin_audit_log`, trata falha com rollback dos scores e não expõe SQLERRM bruto.
- Esses três itens não serão reabertos nem contados como novos pontos nesta Sprint.

### Próxima entrega habilitadora
A varredura de aplicação e os smokes específicos ainda não formam um snapshot único do catálogo PostgreSQL. Esta branch adiciona um inventário read-only do schema descartável com:
- tabelas públicas, RLS habilitada/forçada e privilégios de anon/authenticated/service_role;
- policies e expressões USING/WITH CHECK;
- funções públicas, SECURITY DEFINER/INVOKER, configuração e privilégios EXECUTE;
- triggers não internos e suas definições;
- validação JSON e artefato retido por sete dias no workflow E2E.

O relatório não lê linhas de negócio, corpos de funções, credenciais ou segredos. Também declara expressamente que catálogo não prova alcance da aplicação nem completude de auditoria; precisa ser cruzado com scanner de código, migrations e smokes.

### Pontuação e histórico de autoridade
- A release PR #390 registra a conversão aceita de 08.3: 38.5/48 (80.2%) → 39.0/48 (81.3%), ganho confirmado de +0.5.
- PR #394 e esta entrega de catálogo: +0 isoladamente.
- O 11.3 continua candidato a fechamento, sem novo ponto concedido nesta etapa.
- A reconciliação integral das 48 linhas continua obrigatória antes de qualquer conversão adicional.


## Achado de catálogo e correção de isolamento — 27/11

### Evidência real do PostgreSQL descartável
O artefato `rubi-local-admin-audit-catalog` da PR #395 foi baixado e inspecionado. O snapshot registra 136 tabelas, 215 funções e 26 triggers. A revisão das políticas encontrou três políticas legadas permissivas ainda ativas:
- `Anyone can insert user_interests` — INSERT com `WITH CHECK (true)`;
- `Anyone can update their interests` — UPDATE com `USING (true)`;
- `Anyone can insert favorites` — INSERT com `WITH CHECK (true)`.

A migration `20260822043722_afd4e745-502f-4924-b81b-45012b5660b8.sql` havia criado políticas próprias, mas não removido essas permissões antigas. Como políticas permissivas são combinadas por OR, a regra ampla continuava efetiva. O inventário de código confirma que favoritos são escritos por `toggleFavorite` com middleware autenticado e identidade obtida do contexto; `user_interests` é atualizado por função de servidor que valida a identidade opcional e usa service-role. Não há necessidade funcional de escrita anônima direta.

### Correção proposta
A PR filha `sprint/365-user-data-rls-hardening`:
- remove as três políticas permissivas;
- revoga INSERT/UPDATE/DELETE anônimo e público nessas duas tabelas;
- preserva RLS e as políticas autenticadas restritas a `auth.uid() = user_id`;
- adiciona smoke PostgreSQL com perfis consumidor/lojista para provar insert próprio, negar insert cruzado, negar update cruzado e bloquear anon;
- integra o smoke ao E2E local e adiciona testes de contrato ao Hub QA e Sprint 33 QA.

A correção não mexe em dados, não aplica migration no Supabase remoto e não remove o fluxo de favoritos ou personalização autenticada.
- Classificação até os gates: correção de segurança/upgrade; +0 ponto até validação e aceite do critério.
