# SPRINT 3 (PARTE 1/2) — VIDEO COMMERCE: FUNDAÇÃO

## Objetivos
Construir a infraestrutura de Video Commerce: armazenamento, gestão administrativa, associação produto/vídeo e o componente core do player vertical.

## Etapa 1: Infraestrutura de Dados e Segurança
- [ ] Executar migração SQL para estender a tabela `videos` e criar `video_products`.
- [ ] Criar bucket `videos` no Supabase Storage.
- [ ] Implementar políticas RLS para upload restrito a `owner` e leitura pública para publicados.
- [ ] Adicionar auditoria para ações administrativas de vídeo.

## Etapa 2: Backend e Upload
- [ ] Criar Server Functions em `src/lib/video.functions.ts` para CRUD e associação de produtos.
- [ ] Implementar validação de tipo/tamanho de arquivo no processamento do upload.

## Etapa 3: Gestão Administrativa
- [ ] Criar rota `/admin/videos` com lista e ações rápidas (publicar/despublicar).
- [ ] Desenvolver formulário de cadastro com suporte a Upload (Storage) e URL Externa.
- [ ] Interface de associação vídeo-produto (search & select).

## Etapa 4: Video Core Player
- [ ] Criar `src/components/video/VideoPlayer.tsx` seguindo o Design System Premium.
- [ ] Implementar Lazy Loading (carregamento sob demanda) para evitar consumo excessivo de banda.
- [ ] Integrar o mini-ProductCard sobreposto para associações ativas.

## Detalhes Técnicos
- **Storage:** Supabase Storage para arquivos `.mp4` / `.webm`.
- **Performance:** Vídeo não deve ser `autoplay` em lote; usar IntersectionObserver para ativar o player.
- **Associação:** Um vídeo pode ter N produtos, mas geralmente 1 principal é destacado.

## Verificação Final
- [ ] Upload de arquivo de 5MB funciona e aparece na lista.
- [ ] URL externa (ex: CDN direto) renderiza corretamente no player.
- [ ] Usuário não-logado não consegue acessar vídeo não publicado.
- [ ] Associação de produto aparece como link clicável sobre o vídeo.