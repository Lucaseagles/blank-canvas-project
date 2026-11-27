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
