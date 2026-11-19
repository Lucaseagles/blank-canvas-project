# Sprint 276 — integridade cambial e rastreabilidade de conversões

Data: 2026-11-18  
Base planejada: main após a Sprint 274; Sprint 275 permanece independente até CI e revisão  
Projeto Supabase: heartful-helper-box (akfvkjarpgocdsieuvvq)  
Classificação: upgrade-only; sem ganho de cobertura V1

## 1. Objetivo

Preparar o financeiro RUBI para vendas, recebimentos, taxas, comissões e repasses originados em moedas diferentes, sem misturar valores nominais e sem presumir que toda origem usa BRL.

A camada financeira é de controle e conciliação. Não substitui o gateway, o marketplace, o banco nem a contabilidade oficial.

## 2. Estado técnico já existente

A migration Sprint 252 já prevê moeda explícita (char(3)) em contas, eventos, obrigações e lançamentos. A Sprint 273 também determina que o adaptador da venda de parceiro use a moeda comprovada na origem e não presuma BRL.

Lacuna: o modelo atual ainda não registra uma conversão cambial auditável e imutável — par de moedas, taxa aplicada, direção da taxa, fonte, instante de referência, arredondamento e valor convertido. Portanto, a presença de campos currency não autoriza somar moedas diferentes nem gerar total consolidado em BRL.

## 3. Regra de ouro: preservar o valor de origem

- amount / expected_amount e currency permanecem o valor nominal original.
- Não sobrescrever valor original com valor convertido.
- Não converter silenciosamente para BRL.
- Não usar cotação atual para reescrever relatório histórico.
- Não inferir moeda por país, idioma, símbolo monetário, gateway ou localização do usuário.
- Não somar moedas diferentes. Sem conversão válida, exibir subtotais separados por moeda e sinalizar "conversão indisponível".
- Valor bruto, comissão contratual, valor capturado, liquidação do provedor, taxa, recebimento RUBI e repasse ao parceiro continuam sendo grandezas/eventos distintos.

## 4. Contrato proposto para cotações

Uma futura tabela append-only rubi_finance_fx_quotes deve registrar:

- base_currency e quote_currency em ISO 4217;
- rate positivo em NUMERIC de precisão suficiente, definido como unidades da moeda cotada por 1 unidade da moeda base;
- rate_source (provedor/documento/fonte manual autorizada);
- source_reference não secreta;
- observed_at e effective_at separados;
- created_at, ator responsável e método de verificação;
- estado de revisão quando a cotação for inserida manualmente.

Não armazenar credenciais, tokens ou payloads brutos. Uma cotação manual deve ser rotulada como manual e exigir ator e evidência/referência; nunca pode aparecer como cotação automática de provedor.

## 5. Contrato proposto para conversões aplicadas

Uma futura tabela append-only rubi_finance_fx_conversions deve guardar o snapshot da conversão efetivamente usado:

- referência ao objeto financeiro de origem (evento, obrigação ou lançamento);
- valor e moeda de origem copiados como snapshot verificável;
- valor e moeda de destino;
- taxa aplicada e direção explícita (1 base = rate quote);
- referência à cotação usada, quando houver;
- fonte, instante efetivo e instante de registro;
- regra de arredondamento e precisão;
- propósito (por exemplo, relatório gerencial), ator e evidência quando manual.

Uma conversão deve referenciar exatamente um objeto de origem. A chave de idempotência deve impedir duplicar a mesma conversão para o mesmo objeto, moeda de destino e finalidade. Uma correção não edita a conversão anterior: registra nova versão/retificação ligada à anterior, com motivo e auditoria.

A relação polimórfica precisa ser validada por RPC server-side transacional, com autorização Owner, checagem da existência do objeto, igualdade do snapshot com o valor original e bloqueio contra concorrência. Não conceder INSERT/UPDATE/DELETE ao cliente.

## 6. Cálculo e apresentação

- Usar NUMERIC no banco e decimal/money library no servidor; não usar JavaScript number como fonte financeira de verdade.
- Aplicar arredondamento apenas no limite documentado do cálculo; armazenar precisão e regra utilizadas.
- Nunca usar uma taxa sem par, direção, fonte e timestamp.
- Para consolidação gerencial, exibir moeda-alvo, subtotais originais, taxa, fonte e data de cada conversão.
- Uma cotação ausente, vencida segundo a política aprovada, ambígua ou sem evidência não gera valor convertido; o item fica pendente de revisão.
- Não chamar contribuição estimada de lucro líquido contábil.

## 7. Fronteiras de integração por origem

| Origem | Evidência mínima | Tratamento |
|---|---|---|
| Kairos | Referência externa e relatório/evento verificável com moeda | Manual/import-only até documentação oficial, credenciais e assinatura verificadas |
| Marketplace | Relatório/exportação ou API oficial com pedido, moeda e liquidação | Não inferir venda nem recebimento a partir de clique/redirecionamento |
| Fornecedor | Documento/fatura com moeda, valor e vencimento | Obrigação a pagar; pagamento só após evidência externa |
| Venda atribuída a parceiro | Venda confirmada, origem, moeda, base e acordo aplicado | Uma obrigação de comissão; nunca um recebimento automático |
| Repasse de parceiro | Item de repasse e evidência de transferência | Saída alocada à comissão; parcelamentos permanecem independentes |

O adaptador legado de parceiros deve preservar hub_partner_confirmed_sales.id, source + external_order_id, taxa e revisão do acordo, além de identidade estável do payout item. A comissão histórica e o repasse não podem ser importados duas vezes.

## 8. Testes obrigatórios antes de qualquer migration

1. Moeda inválida, ausente ou desconhecida é rejeitada; nenhuma inferência de BRL.
2. Conversão exige moedas distintas válidas, taxa positiva, direção, fonte e timestamp.
3. Conversão inversa usa taxa inversa explícita/registrada; não reutiliza taxa na direção errada.
4. Não agregar BRL, USD e EUR sem conversão individual válida.
5. Precisão, limites NUMERIC e arredondamento em casos de meio centavo e grandes valores.
6. Cotação histórica permanece imutável quando uma cotação nova chega.
7. Reprocessamento idempotente não cria conversões duplicadas.
8. Concorrência não permite duas conversões conflitantes para a mesma finalidade.
9. Snapshot divergente do objeto financeiro é rejeitado.
10. Correção cria retificação auditável, sem UPDATE/DELETE destrutivo.
11. RLS: anon, consumidor, lojista, parceiro A, parceiro B e usuário autenticado comum não leem nem alteram cotações/conversões privadas; somente Owner lê via função autorizada e service role executa escrita.
12. Nenhuma conversão promove evento observado a recebimento liquidado ou comissão prevista a repasse pago.

## 9. Dependências e gates de implantação

Este documento não autoriza migration nem alteração de produção.

Antes de criar/aplicar a extensão cambial, ainda é obrigatório:
- reconciliar o histórico de migrations do repositório com schema_migrations por conteúdo e objetos, não apenas por nome;
- executar as sete migrations pendentes de Sprint 243–253 na ordem aprovada em banco descartável;
- testar migrations, RLS, grants, RPCs, concorrência e rollback/forward-repair;
- revisar a cadeia incluindo a migration Sprint 273 e a Sprint 274;
- obter backup e autorização explícita antes de qualquer deploy;
- verificar objetos, permissões e comportamento no Supabase após implantação.

A extensão cambial deve ser uma migration posterior e aditiva, dependente do núcleo financeiro efetivamente implantado e testado. Não alterar as migrations históricas já versionadas para encaixar a nova funcionalidade.

## 10. Critério de conclusão

Sprint 276 só pode ser considerada tecnicamente implementada quando a migration aditiva, RPCs, testes automatizados e contrato server-side estiverem no mesmo PR e passarem em CI. Até lá, este artefato formaliza o desenho e impede agregações monetárias inseguras.

Estado desta entrega: especificação técnica versionada; nenhuma migration criada/aplicada; nenhuma alteração de dados; Supabase de produção inalterado.

Cobertura V1: permanece 36,5/48 (76,0%). Não contabilizar documentação nem upgrade de integridade cambial como critério funcional concluído.


## 11. Bloqueio adicional encontrado: escala monetária do núcleo atual

A revisão direta da migration Sprint 252 encontrou uma restrição que precisa ser resolvida antes de afirmar suporte completo a moedas ISO 4217:

- eventos, obrigações e lançamentos usam NUMERIC(18,2);
- isso representa duas casas decimais fixas, não a escala variável de todas as moedas;
- moedas sem casas fracionárias e moedas com três casas não podem ser representadas corretamente por esse contrato sem uma regra explícita de unidade/escala;
- o CHECK de moeda valida apenas três letras maiúsculas; não valida código ISO 4217 ativo nem a escala monetária.

Consequência: não declarar "suporte a todas as moedas ISO 4217" com o schema atual. Não arredondar nem truncar valores de moedas com escala diferente para fazê-los caber em duas casas.

### Gate de arquitetura antes da migration cambial

A extensão futura deve decidir e testar uma destas abordagens, com compatibilidade histórica:

1. **Valor decimal com escala por moeda:** ampliar colunas monetárias para precisão suficiente (por exemplo NUMERIC(24,8), sujeito a análise de limites), registrar minor_units/scale efetiva por moeda e manter snapshots históricos; ou
2. **Unidades menores inteiras:** armazenar unidades menores em BIGINT e registrar a escala ISO versionada aplicada, exigindo migração/backfill comprovado e adaptação de todos os RPCs e clientes.

Não aplicar alteração em massa de colunas enquanto a cadeia 252/253/273 não estiver reconciliada e implantada. A abordagem escolhida deve cobrir eventos, obrigações, lançamentos, alocações, importação, cálculo de comissão, relatórios e APIs — não apenas as tabelas novas de câmbio.

O código de cálculo futuro deve usar decimal exato (não Number), validar a escala de origem/destino com metadados de moeda versionados e rejeitar moedas/códigos não suportados. A tabela de moedas não deve presumir que qualquer código de três letras é válido.

**Status:** bloqueio documentado; nenhuma alteração de schema ou valor em produção.


## 12. Primeira implementação isolada — aritmética decimal exata

Foi adicionada uma camada pura de cálculo em `src/lib/rubi-finance-fx.ts`, sem acesso a banco, rede, provedor ou relógio do sistema.

Contrato implementado:
- valores de origem/destino trafegam como strings de unidades menores inteiras;
- cálculo usa BigInt e fração decimal exata;
- taxa é explicitamente "unidades maiores de destino por 1 unidade maior de origem";
- arredondamento half-up ocorre uma única vez, na unidade menor de destino;
- escala de moeda vem de um registro explícito fornecido pelo chamador;
- códigos sem exatamente uma definição são rejeitados;
- a função retorna snapshot contendo valor original, moeda original, valor destino, moeda destino, taxa, direção e regra de arredondamento.

Testes adicionados em `src/lib/rubi-finance-fx.test.mjs` e comando `npm run test:rubi-finance-fx`. A suíte cobre escalas 0/2/3, precisão excessiva, moeda desconhecida, taxa inválida, conversão USD/BRL, arredondamento e ausência de parseFloat/toFixed.

Limites importantes:
- o registro de moedas de teste é uma fixture pequena, não um catálogo ISO 4217 oficial;
- o módulo não busca nem valida cotação de mercado;
- não persiste cotações/conversões, não autentica Owner, não acessa Supabase e não alimenta dashboards;
- não altera as colunas NUMERIC(18,2) do schema legado;
- não deve ser conectado ao ledger até que a estratégia de escala/precisão do banco e a origem da cotação sejam aprovadas.

**Validação:** arquivos versionados na branch da PR #276; execução da suíte ainda depende de CI. Não declarar testes aprovados antes do resultado do GitHub Actions.
