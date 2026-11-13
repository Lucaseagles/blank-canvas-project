# RUBI Eagles 11× — Sprint 169 | Híbrido: Store comercial com auditoria transacional

## [UPGRADE] Entrega
- Criação e edição de produto (SKU, fornecedor, preço de varejo, custo, preço B2B, publicação, URL e marcação de checkout validado) agora passam por uma transação PostgreSQL que inclui o registro identificado no histórico Master.
- Revisão otimista evita sobrescrever uma versão editada por outro administrador; o formulário envia a revisão carregada.
- Revisão de checkout HTTPS contra o host do fornecedor acontece no servidor e também no banco no momento da gravação, com lock no registro do fornecedor. Alterações comerciais exigem despublicar e validar novamente o checkout.
- Registro da auditoria preserva valores operacionais essenciais, sem copiar URL do checkout nem dados editoriais completos.

## [CORREÇÃO + TESTES]
- Problema anterior: `saveHubProductAdmin` fazia `upsert` com `service_role`, mas não gravava auditoria na mesma transação.
- Migração `supabase/migrations/20261113100000_rubi_hub_product_atomic_audit.sql` acrescenta `hub_products.revision` e RPC privada `rubi_save_hub_product_audited` (somente service role).
- `src/lib/hub-catalog.functions.ts` mantém checks do produto, fornecedor e host e usa RPC com ator do contexto autenticado.
- `src/routes/admin/hub-catalog.tsx` envia revisão para resolver conflitos.
- `src/lib/rubi-hub-product-atomic-audit.test.mjs` verifica atomicidade, perfis, privacidade, URL de checkout e concorrência.

## [COBERTURA]
O critério `11.3 — Auditoria administrativa completa` continua **0,5/1** até que também exista cobertura comprovada para alteração de fornecedores, preços atacadistas, configurações administrativas e grants importantes. Esta sprint reforça segurança comercial, mas não altera o total de **35/48 = 72,9%**.

**Meta principal:** 36/48=75%; fechar somente após reauditoria dos caminhos críticos definidos, não por quantidade de PRs.

## Gates
1. CI TypeScript, lint, build e testes verdes em ambos workflows.
2. Merge no main.
3. Aplicar migração no Supabase correto, verificar permissões `anon`/`authenticated` bloqueadas e `service_role` autorizada.
4. Validar migração, edição concorrente e rollback de auditoria em ambiente apropriado, sem inventar produtos ou transações reais no banco comercial.
5. Preservar link de checkout oficial, atribuição de parceiros e nenhuma venda declarada por clique.

## Limite
Sem SKU real e sem checkout externo homologado, a Sprint 169 não comprova venda, cobrança nem E2E no domínio publicado.
