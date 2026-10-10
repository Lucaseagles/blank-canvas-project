# AUDITORIA ADMIN — SPRINT 41

## Parte 1 — Infraestrutura e sincronização

Status da Parte 1: **🟢 concluída no código/base de dados**

### Objetivo
Auditar o Admin Control Center sem duplicar funcionalidades, corrigindo primeiro a infraestrutura de interatividade e a base de sincronização Admin → Supabase → Storefront.

## Regra
AUDITAR → IDENTIFICAR → CORRIGIR → CONECTAR → TESTAR → VALIDAR

## Módulos concluídos nesta sequência

| Módulo | Área | Estado |
|---|---|---|
| #05 | Categorias | 🟢 endurecido e validado no banco |
| #06 | Ofertas | 🟢 código + banco endurecidos; E2E depende de dados reais |
| #07 | Cupons | 🟢 código + banco endurecidos; E2E depende de dados reais |
| #08 | Vídeos | 🟢 código + banco endurecidos; E2E externo pendente |
| #09 | Video Bridge | 🟢 código + banco endurecidos; E2E depende de dados reais |
| #10 | Bundles | 🟢 código + banco endurecidos; E2E depende de dados reais |
| #11 | Recomendações | 🟢 código + banco endurecidos; E2E depende de dados reais |
| #12 | Analytics | 🟢 leitura administrativa protegida por server function; build/E2E pendentes |
| #13 | Campanhas | 🟢 código + banco endurecidos; E2E depende de dados reais |
| #14 | Automações | 🟢 código + banco endurecidos; dispatch externo pendente |
| #15 | Notificações | 🟢 código + banco endurecidos; entrega push real pendente |
| #16 | Telegram | 🟢 Secure Hub + banco + server functions; E2E externo pendente |
| #17 | Usuários | 🟢 código + RPC owner-only; E2E com contas reais pendente |
| #18 | Indicações | 🟢 código + banco + atribuição endurecidos; E2E com duas contas pendente |
| #19 | Social Proof | 🟢 código + banco + acesso público seguro endurecidos; E2E visual pendente |
| #20 | Suporte | 🟢 código + banco + RLS + leituras administrativas protegidas; E2E/build pendentes |

## Descobertas da Parte 1

- O projeto usa **TanStack Start + Vite + React**, portanto não devem ser aplicados patches específicos de Next.js.
- O router já cria um `QueryClient` no contexto do TanStack Router.
- O root anteriormente criava outro `QueryClient`, o que podia separar o cache usado pelas rotas do cache usado pelo `QueryClientProvider`.
- O root foi corrigido para reutilizar `router.options.context.queryClient`, mantendo Router e React Query no mesmo contexto.
- A rota de edição de produto `/admin/products/$id/edit` existe no route tree; não há necessidade de criar uma segunda rota.
- O CRUD de produtos já usa Supabase real e os componentes de bulk/inline edit já existem; a prioridade é corrigir infraestrutura antes de duplicar esses fluxos.
- A publicação `supabase_realtime` estava sem as tabelas críticas auditadas. A Parte 1 adicionou as entidades centrais ao Postgres Changes.

## Realtime habilitado

As seguintes tabelas estão na publicação `supabase_realtime`:

`products`, `marketplaces`, `offer_groups`, `videos`, `bridge_videos`, `campaigns`, `automation_rules`, `home_modules_config`, `banners`, `notifications`, `social_channels`, `support_faq`, `referral_tiers`.

Todas também receberam `REPLICA IDENTITY FULL` para permitir payloads completos em alterações.

## #20 — Suporte

O módulo possui `/admin/support` com Base de Conhecimento, Lacunas e Análises, além de `/admin/support-knowledge`. A base `support_faq` é a fonte compartilhada com o suporte público. O banco foi endurecido com RLS explícito para FAQ/configuração administrativa, limites de tamanho/valores, índices de consultas e unicidade de configuração. Leituras administrativas de conversas/lacunas agora passam por server functions protegidas por `requireOwnerRole`, evitando exposição direta de `user_id`, mensagens e logs para qualquer cliente autenticado. O fluxo público continua podendo consultar apenas o conteúdo ativo destinado ao atendimento.

### Dados atuais do suporte

- `support_faq`: 8 registros
- `support_chat_log`: 6 registros
- `support_conversations`: 20 registros
- `support_ai_config`: 5 chaves configuradas

### Pendências honestas

- Não declarar build/CI como aprovado sem uma execução nova.
- E2E visual e de atendimento ainda precisa ser exercitado com usuário real: abrir suporte → perguntar → verificar resposta → registrar conversa/log → refletir em Lacunas/Análises.
- O envio/handoff externo para WhatsApp deve ser validado separadamente quando exercitado.

## Segurança — pendência explícita

As tabelas `integration_platforms`, `integration_credentials` e `integration_credential_fields` estão com RLS habilitado, porém sem policies. **Não** foi criado acesso genérico para `authenticated`. Antes de liberar `/admin/integrations`, a autorização de owner/admin deve ser implementada seguindo o padrão existente de `private.has_role(...)` e com mínimo privilégio.

## Critério para marcar módulo como ✅

Só marcar como concluído quando rota, ações, persistência real, autorização/RLS, loading, erro, vazio, responsividade, sincronização com storefront e build estiverem validados.

## Retomada da auditoria estrutural — 2026-10-10

### Correções adicionais feitas após a Parte 1

- A gestão administrativa de vídeos agora usa consultas server-side protegidas por `requireOwnerRole` para listar vídeos e carregar produtos/categorias/campanhas.
- A lista de campanhas do formulário de vídeo agora é obtida da tabela `campaigns`; foi removida a campanha fixa de demonstração.
- A consulta pública de vídeos força `status = published` e não aceita consulta de rascunhos/agendamentos por parâmetros públicos.
- Associações de produtos inativos são removidas da resposta do feed público.
- Publicar/despublicar usa uma mutação de status dedicada para não apagar campos do vídeo quando a interface envia apenas ID e status.
- O Admin de vídeos apresenta estados de erro e vazio em desktop e mobile; o feed público distingue falha de carregamento de catálogo realmente vazio.

### Commits desta retomada

- `cd4a3d0ad6b9540ab6c1dcc24832315c3aa92567` — separar consultas públicas/admin e obter opções reais.
- `6b5c48875608919298cfa5b543239caf1ac09a68` — filtrar produtos inativos no feed.
- `7be1cc9b430e48ae0c44f9beca22634bedcb772d` — remover campanha fixa e carregar opções reais no Admin.
- `9f3cce5dbde66f28c3c3009bf011f9dc7a7ee53f` — estados de erro/vazio no Admin.
- `4b196cf9489a2cf9fdfd2182e1d95a13ff54f99e` — mutação segura de status.
- `7fb15a5a1bf32567c12d79df79a3c80f5ad12a92` — usar mutação de status sem sobrescrever campos.
- `77ff0a493d096d08100b2791ced6dfb1bc78c08d` — erro explícito no feed público.
- `be0c60dca436d54db45eebe83b26acb13b73287e` — tipagem da mutação de status sem campos desnecessários.
- `d0c4412c140cff80d72865d7f9ff7bc3f9b087e5` — homepage usa vídeo publicado real em vez de campanha e métricas fixas.

### Products — publicação administrativa (retomada)

- `src/routes/admin/products.tsx`: o botão publicar/despublicar passou a usar `setSellerProductStatus`, função server-side com `requireOwnerRole` e auditoria, em vez de atualização direta no navegador.
- `src/lib/video.functions.ts`: a associação pública com vídeos agora reconhece produtos `active` **ou** `published`, conforme a política de leitura pública de `products` confirmada no banco.
- Commits: `ca1af8fbb4cb0b2ad1aab189a86a76feb7aa56a2`, `279ae0b5cc6c08cb6988b4f3035652a3ebc63438`, `103cba6555c605795148549c652a479ed280564f`.
- **Não validado integralmente:** edição inline, operações em lote, duplicação, importação, exportação, consistência de status nos demais consumidores e testes automatizados.

### Products — edição rápida e ações em lote

- `src/lib/admin-product-operations.functions.ts`: funções novas com `requireOwnerRole`, validação Zod, alteração de preço/categoria e status em lote.
- `src/admin/products/ProductInlineEdit.tsx`: usa função protegida para preço e categoria, em vez de mutação direta.
- `src/admin/products/ProductBulkActions.tsx`: publicar, despublicar e arquivar usam função protegida, com confirmação e checagem de quantidade atualizada. Exclusão permanente em lote retirada da interface por segurança.
- Commits: `17ad0235c4a482feff8ac982f894e120121d9ec9`, `4c525bf0722ec8fdb697bd1886f27e8ebcaba318`, `5bbf1f678d4a3201f84f98258a839dd388b05323`, `53c0e0565daec437c7d5c65423251d73f60a3fca`.
- **Ainda pendente:** testes TypeScript/ESLint/build, verificação E2E, revisão de importação/duplicação/exportação, validação completa de integridade de publicação e consistência de visibilidade pública.

### Categories — auditoria de visibilidade e hierarquia

- `src/lib/supabase/categories.ts`: consulta por slug exige categoria ativa, breadcrumb interrompe ao encontrar categoria inativa e contagem de subcategorias considera produtos `active` ou `published`.
- `src/lib/admin_intel.functions.ts`: escrita protegida impede categoria ativa com pai inativo e impede desativar pai que ainda possui filhos ativos.
- `src/routes/admin/categories.tsx`: bloqueio preventivo na interface e invalidação de consultas de categorias relacionadas.
- Commits: `599a7849899b8a1e65369941e48536aaa6118ecc`, `4e909af4867dcd135327e348130dd3cafa6204ef`, `97449187e5113bc96cbbacecd2a433db65f7269a`.
- **Pendente:** validar o RPC `get_categories_with_counts` e seus consumidores, testar ordenação/drag-and-drop, executar TypeScript/ESLint/build e testes E2E de ativação/desativação.

### Offers — auditoria da vitrine pública

- Confirmada no banco a presença de `offer_groups.is_featured_on_hub`, `featured_priority`, `featured_starts_at` e `featured_ends_at`.
- Corrigida a rota pública `/offers`: se não há grupo destacado válido, a vitrine fica vazia em vez de exibir produtos de todos os grupos; respeita o período de destaque e os status públicos `active`/`published`.
- Commits: `412cfddbd32b3b8d7bedd58f567498bd79002eb9`, `6ebf9b10c5a8cb43f0f97672ef33372380ffbb1b`.
- **Pendente:** revisar `OfferFeaturedControl` e permissões de edição de destaque, verificar RLS e ordenação efetiva por prioridade, testar integração com produtos, TypeScript/ESLint/build e E2E. Não declarar Offers concluído.

### Pendências que continuam abertas

- Executar TypeScript, ESLint e build no ambiente do projeto. A tentativa de clonar o repositório neste ambiente não pôde concluir porque a rede para github.com não está disponível; não declarar build aprovado.
- Testar o fluxo real de vídeo com usuário proprietário e visitante: criar/editar, associar produto ativo, publicar, conferir em `/videos`, despublicar e confirmar que o item deixa de aparecer sem perder seus metadados.
- Continuar a matriz de catálogo público: Products → Categories → Offers → Coupons → Videos → Video Bridge → Marketplaces → Collections → Banners.
- Confirmar por código e teste quais módulos estratégicos realmente alimentam seus consumidores, sem confundir métricas administrativas com execução de motor.
- Não declarar a integração de marketplace operacional enquanto o conector específico não existir.

## Próxima parte

Continuar a matriz de catálogo público a partir de **Products → Categories → Offers → Coupons → Videos → Video Bridge → Marketplaces → Collections → Banners**, corrigindo cada lacuna e validando o reflexo público antes de marcar o módulo como concluído. Depois, retomar **Engagement Intelligence → Trust & Quality → validação global**.
