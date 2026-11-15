# RUBI Eagles 11× — Reauditoria incremental V1 · Sprint 207

**Base de cobertura antes desta entrega:** 36,0/48 = 75,0%, com **07.4 = 0,5/1** conforme o adendo da Sprint 135 e as reavaliações posteriores. A régua V1 continua fixa em 48 critérios, 0/0,5/1 por critério.

## Critério 07.4 — Biblioteca de materiais reutilizáveis e licenciados

| Gate estático | Evidência |
|---|---|
| Biblioteca Master com roteiros/páginas versionados e filtrados por produto, formato e movimento | `src/lib/rubi-creative-library.functions.ts`, `src/components/store/RubiCreativeLibraryAdmin.tsx` |
| Evidência documental em armazenamento privado | `supabase/migrations/20261113130000_rubi_creative_licensing.sql`, `src/lib/rubi-creative-licenses.functions.ts` |
| Aprovação/revogação humana com lock, revisão da variante e log atômico | RPC `rubi_mutate_creative_license_audited` |
| Entrega a parceiros por perfil aprovado, acordo, grant, checkout legítimo, movimento/variante revisados, canal e prazo | `src/lib/rubi-licensed-partner-assets.functions.ts`, `src/components/partner/RubiLicensedPartnerCreatives.tsx` |
| Proteção contra cache cross-account, licença expirada/revogada e material obsoleto no ato de copiar | `src/lib/rubi-creative-license-access.ts`, testes dedicados da Sprint 207 |
| Pipeline de regressão obrigatório | `.github/workflows/hub-v1-integration-qa.yml` |

## Verificações do Supabase `heartful-helper-box` (15/11/2026)
- Tabela `rubi_creative_licenses`: **RLS ativa**, sem privilégio SELECT de `anon` ou `authenticated`.
- Bucket `rubi-creative-license-evidence`: **privado**, PDF/PNG/JPG, até 10 MB.
- RPC de concessão/revogação: EXECUTE de `anon`/**authenticated** desabilitado, EXECUTE de `service_role` habilitado.
- **Zero licenças, variantes, produtos de Store ou ativos reais:** não foi comprovada aprovação documental real nem teste E2E com parceiro autorizado. Não criar mídia fictícia.

## Ganho de cobertura proposto
Se os dois pipelines do PR #207 aprovarem, o código for integrado à `main` e as verificações de segurança acima permanecerem verdadeiras, reconhecer **07.4 de 0,5 a 1,0 (escopo estático)**, elevando a cobertura técnica V1 a **36,5/48 = 76,0%**. Nenhum outro critério muda nesta Sprint.

O ganho é de **cobertura de implementação técnica**, NÃO de percentagem de produto operacional ou certificação de uso comercial. Para liberação real da biblioteca, ainda é necessário cadastrado SKU verdadeiro, contrato verificável de licença, documento real e testes de revogação e troca de conta no domínio hospedado.

## Limitações e próximas prioridades
- A seleção do material verifica licença no servidor no momento de copiar. Isso não consegue apagar textos já copiados nem cancelar material previamente distribuído fora do RUBI.
- Não há prova de licenças comerciais reais e nenhum criativo deve ser distribuído automaticamente sem revisão documental.
- Os critérios 06.4/04.4/03.4 e 09.3/09.4 dependem de dados confirmados de checkout externo Kairos/fornecedores e programas de afiliados.
- 11.3 requer cobertura de auditoria de todas as mutações críticas; 12.3/12.4 exigem E2E e pagamentos/repasses/estornos legítimos.
