# RUBI Eagles 11× — Sprint 217: classificação do avanço

**Base oficial de cobertura técnica V1:** 36,5/48 = 76,0% após a Sprint 207.
**Critério abordado:** 11.3 — Auditoria administrativa completa: 0,5/1 até uma reauditoria de todas as mutações relevantes.

## Falha e causa
`src/lib/rubi-supplier-csv.functions.ts` usava uma inserção em lote na tabela `hub_products` após verificar o fornecedor e SKUs existentes. A operação não gravava um evento de `admin_audit_log` na mesma transação. A checagem prévia não era serializada para importações concorrentes com SKUs que diferem apenas em maiúsculas/minúsculas.

## Implementação desta sprint
- `rubi_import_supplier_drafts_audited`: Owner no banco; permissão de execução exclusivamente `service_role`, sem `security definer`.
- Trava transacional e validação de fornecedor **ativo**, tamanho do lote, dados/valores e SKUs globalmente únicos, além da constraint existente.
- Inserção de até 50 rascunhos da Store em uma transação, todos **inactive / checkout_verified=false / checkout_url=null**, com evento administrativo por produto.
- No caso de falha em qualquer registro/auditoria: transação inteira cancelada. Nenhuma compra, comissão ou publicação ocorre.
- Teste de contrato obrigatório no CI, com parser de SKU e campos proibidos.

## Régua de pontuação
| Tipo | Regra | Resultado desta sprint |
|---|---|---|
| Upgrade de implementação | Correção de uma lacuna real, submetida a CI + deploy seguro | **Sim, condicionado à aprovação/deploy** |
| Cobertura integral 11.3 | Todas as rotas administrativas críticas precisam de auditoria de identidade, antes/depois, bloqueio de escrita não autorizada e prova de testes | **Não demonstrado por esta correção isolada** |
| Mudança na matriz V1 | Apenas quando um critério completo passa do estado parcial ao aceite | **0 ponto por enquanto; 36,5/48 = 76,0%** |
| Operação comercial homologada | Fornecedor e SKU legítimos, checkout externo e eventual pagamento/estorno confirmado por provedor | **Não homologado: 0 produtos Store e 0 vendas de parceiros no banco consultado** |

A meta seguinte da matriz é 37/48 (77,1%), mas apenas com **fechamento comprovado do 11.3**. Ainda é obrigatório revisar mutações diretas remanescentes em tabelas do catálogo e outros módulos; checkouts Kairos/fornecedores, links afiliados e parceiros permanecem externos.

**Gates:** CI completo verde em ambos pipelines, merge na `main`, migração apenas no Supabase `heartful-helper-box`, consulta de grants/RLS e teste negativo de autorização sem criar dados comerciais fictícios.
