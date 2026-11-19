# Sprint 273 — idempotência de origem no financeiro unificado

Data: 2026-11-19  
Projeto Supabase: `heartful-helper-box` (`akfvkjarpgocdsieuvvq`)  
Escopo: inspeção read-only de produção e proteção aditiva preparada no repositório.

## 1. Estado de produção observado

Consulta somente leitura às tabelas legadas:

| Métrica | Linhas |
|---|---:|
| `hub_partner_confirmed_sales` | 0 |
| `hub_partner_commission_payouts` | 0 |
| `hub_partner_commission_payout_items` | 0 |
| Vendas sem referral link válido | 0 |
| Grupos duplicados por `source + external_order_id` | 0 |

O zero atual significa que não há histórico financeiro legado para backfill neste momento. Não significa que o sistema esteja recebendo vendas ou repasses reais; a própria ausência de linhas impede essa conclusão.

## 2. Regra de integração definida

A tabela `hub_partner_confirmed_sales` continua sendo a fonte comercial de verdade para vendas atribuídas a parceiros. O financeiro canônico não deve copiar o valor bruto da venda como dinheiro recebido.

Quando o domínio financeiro estiver implantado e a venda tiver elegibilidade comprovada, o adaptador deverá criar no máximo uma obrigação de comissão:

- `source_kind = partner_sale`
- `source_id = hub_partner_confirmed_sales.id`
- `obligation_type = partner_commission`
- `scope_type = partner`
- `partner_profile_id`: resolvido pelo referral link da venda
- `expected_amount`: `commission_amount` da venda confirmada
- `commission_base`: valor-base aprovado para aquela venda
- `commission_rate`: taxa efetivamente registrada na venda
- `agreement_revision`: revisão do acordo vigente aplicada na venda
- `currency`: moeda confirmada da origem; não presumir BRL se a fonte não a fornecer

A obrigação representa comissão devida/prevista. Não representa transferência ao parceiro.

O pagamento já realizado permanece na tabela legada de lotes/itens até que um adaptador transacional o projete no ledger canônico. Um payout item deve ser a identidade estável da origem de um lançamento `partner_payout`, nunca a própria venda. Isso evita converter o valor bruto ou a comissão calculada em caixa recebido.

## 3. Proteção nova no schema futuro

A migration `20261118070000_rubi_finance_source_idempotency_sprint273.sql` adiciona índices únicos parciais:

1. Obrigações: `source_kind + source_id + obligation_type + scope_type + provider_id`.
2. Lançamentos: `source_kind + source_id + entry_type + direction + provider_id`.

O `provider_id` participa da identidade para evitar colisões quando dois provedores usam o mesmo identificador externo. Para fontes internas sem provedor, o índice usa um namespace nulo estável.

Essas restrições impedem que reprocessamento de uma mesma origem gere obrigações ou lançamentos duplicados. Fontes sem identificador estável não devem ser automaticamente lançadas; devem permanecer em revisão manual/importação até que uma chave determinística seja definida.

A migration é aditiva e não insere, atualiza ou apaga dados. Ela pressupõe as tabelas criadas nas migrations 252/253 e, por isso, depende da validação da cadeia anterior.

## 4. Regras de não duplicação

- Clique, visita, carrinho, pre-checkout e redirecionamento não geram obrigação nem lançamento de caixa.
- Venda confirmada gera no máximo uma obrigação de comissão, não uma entrada de caixa.
- Repasse externo comprovado gera lançamento de saída ligado ao item de repasse de origem.
- Evidência de recebimento externo da RUBI gera entrada de caixa apenas quando o evento/documento for verificável.
- Estorno externo e reversão contábil são eventos diferentes; a reversão do ledger não executa reembolso no provedor.
- Reimportação do mesmo arquivo/evento deve ser deduplicada pela chave do provedor/evento ou checksum.
- Valores e moedas não devem ser agregados sem conversão cambial registrada.

## 5. Segurança e implantação

- Nenhuma migration foi aplicada em produção.
- Nenhum dado financeiro foi alterado.
- O domínio `rubi_finance_*` permanece indisponível em produção até implantação controlada.
- A migration nova não habilita UI, não concede acesso e não implementa adaptador de dados.
- Antes do deploy: executar a cadeia completa em banco descartável, validar índices e constraints, revisar RLS/grants/RPCs, fazer backup e obter autorização explícita.

## 6. Classificação

Sprint 273: upgrade-only — integridade de origem/idempotência e contrato de integração.  
Cobertura V1: sem alteração, baseline 36,5/48 (76,0%).  
Upgrades globais: percentual não calculado sem inventário fechado e denominador verificável.
