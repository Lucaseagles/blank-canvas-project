# RUBI Eagles 11× — Sprint 163: auditoria atômica de movimentos

## [UPGRADE] Correção operacional
Unificamos criação, edição e arquivamento de movimentos comerciais em uma RPC transacional protegida. Se o registro de auditoria falhar, a transação é revertida; nenhum movimento é considerado salvo/arquivado sem rastro. Edição exige versão correta para evitar sobrescritas e arquivamento respeita restrições de integridade do banco.

## [COBERTURA] Critério 11.3
A Sprint 162 passou a auditar aprovações/revogações de Stories, e a 163 adiciona criação, edição e arquivamento de movimentos. Ainda não fecha integralmente 11.3: é preciso mapear e garantir também os atos relevantes em fornecedores, preços, ofertas, links comerciais, grants e permissões. Sem aumento automático do total 34/48=70,8%.

## Gates
1. CI TypeScript, testes, lint e build aprovados no PR.
2. Merge na main.
3. Aplicação da migração no Supabase correto e checagem de privilégios.
4. Teste transacional com movimento real autorizado: criação, edição concorrente, arquivamento, registro de ator, reversão caso auditoria falhe. Não fabricar dados de produção.
5. Reauditoria 11.3 apenas após cobertura de todas as mudanças críticas definidas na matriz.

Meta seguinte: 36/48=75%, faltando 2 pontos técnicos comprovados.
