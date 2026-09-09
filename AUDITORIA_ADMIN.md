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

## Próxima parte

**Próximo passo:** seguir para o módulo **#21 Integrações**, mantendo a regra AUDITAR → IDENTIFICAR → CORRIGIR → CONECTAR → TESTAR → VALIDAR e sem criar sistemas duplicados.
