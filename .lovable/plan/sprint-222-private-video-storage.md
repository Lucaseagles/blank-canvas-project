# Sprint 222 — Upload nativo e biblioteca privada

## Escopo implementado
- Provisionar o bucket `videos` pela Storage API no primeiro upload autorizado, sem escrever diretamente em `storage.buckets`.
- Bucket privado, MP4/WebM, limite de 100 MB.
- Upload por URL assinada de uso temporário, emitida apenas por Server Function protegida por `requireOwnerRole`.
- Caminhos isolados por `owner/{userId}/`.
- Feed público recebe URL assinada temporária somente para registros publicados; o caminho interno do Storage não é enviado ao consumidor.
- Substituição e exclusão tentam remover o objeto anterior; falha de limpeza é reportada sem fingir que o arquivo foi apagado.
- Migração adiciona política Storage para operações autenticadas do Owner no próprio prefixo.
- URLs externas e reprodução universal do Sprint 221 permanecem compatíveis.

## Limites explícitos
- Não há transcodificação, geração automática de miniaturas, HLS/DASH, moderação de conteúdo ou upload resumível nesta entrega.
- A URL assinada de reprodução expira em seis horas; a próxima carga do feed gera uma URL nova.
- A migração de política precisa ser aplicada no Supabase depois da aprovação da CI e antes de habilitar operações diretas do Owner no Storage. O bucket é criado via Storage API no primeiro upload.
- Nenhuma migration ou alteração de dados foi aplicada ao banco de produção durante a implementação deste PR.

## Critérios de aceite
- [ ] Upload Owner-only MP4/WebM até 100 MB.
- [ ] Bucket privado criado/configurado pela Storage API.
- [ ] Upload assinado sem expor service-role.
- [ ] RLS de Storage sem leitura anônima.
- [ ] Feed público só recebe URLs assinadas de vídeos publicados.
- [ ] Edição/exclusão tentam limpar arquivos antigos e expõem falhas de limpeza.
- [ ] Teste de regressão dedicado, TypeScript, ESLint e build nos dois workflows.
