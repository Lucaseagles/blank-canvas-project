# AUDITORIA ADMIN — SPRINT 41

## Parte 1 — Infraestrutura e sincronização

Status da Parte 1: **🟢 concluída no código/base de dados**

### Objetivo
Auditar o Admin Control Center sem duplicar funcionalidades, corrigindo primeiro a infraestrutura de interatividade e a base de sincronização Admin → Supabase → Storefront.

## Regra
AUDITAR → IDENTIFICAR → CORRIGIR → CONECTAR → TESTAR → VALIDAR

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

## Segurança — pendência explícita

As tabelas `integration_platforms`, `integration_credentials` e `integration_credential_fields` estão com RLS habilitado, porém sem policies. **Não** foi criado acesso genérico para `authenticated`. Antes de liberar `/admin/integrations`, a autorização de owner/admin deve ser implementada seguindo o padrão existente de `private.has_role(...)` e com mínimo privilégio.

## Rotas auditadas inicialmente

| Área | Rota | Estado Parte 1 |
|---|---|---|
| Produtos | `/admin/products` | 🟡 infraestrutura corrigida; CRUD continua na Parte 2 |
| Produto novo | `/admin/products/new` | 🟡 rota existente; fluxo continua na Parte 2 |
| Produto edição | `/admin/products/$id/edit` | 🟢 rota existente |
| Produto import | `/admin/products/import` | ⏳ |
| Produto export | `/admin/products/export` | ⏳ |
| Marketplaces | `/admin/marketplaces` | ⏳ |
| Ofertas | `/admin/offers` | ⏳ |
| Vídeos | `/admin/videos` | ⏳ |
| Campanhas | `/admin/campaigns` | ⏳ |
| Automações | `/admin/automations` | ⏳ |
| Recomendações | `/admin/recommendations` | ⏳ |
| Integrações | `/admin/integrations` | ⚠️ RLS pendente |
| Publishing | `/admin/publishing` | ⏳ |
| Analytics/Metrics | `/admin/analytics`, `/admin/metrics` | ⏳ |
| Modules/Banners | `/admin/modules` | ⏳ |
| Notifications | `/admin/notifications` | ⏳ |
| Referrals | `/admin/referrals` | 🟢 código + banco endurecidos; E2E de atribuição depende de autenticação com duas contas |
| Social | `/admin/social-channels`, `/admin/social-proof` | ⏳ |
| Support | `/admin/support`, `/admin/support-knowledge`, `/admin/telegram` | ⏳ |
| Users/Settings | `/admin/users`, `/admin/settings` | ⏳ |
| Audit | `/admin/audit`, `/admin/v1-audit` | ⏳ |

## Critério para marcar módulo como ✅

Só marcar como concluído quando rota, ações, persistência real, autorização/RLS, loading, erro, vazio, responsividade, sincronização com storefront e build estiverem validados.

## Próxima parte

**Sprint 41 — Parte 2:** concluir o CRUD de Products/Marketplaces/Offers, revisar todos os fluxos existentes e validar que cada ação Admin persiste no Supabase sem mocks ou duplicações.
