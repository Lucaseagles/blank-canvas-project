
-- Políticas para o bucket 'videos'
-- Apenas admins (owner) podem fazer upload/update/delete
CREATE POLICY "Admins can upload videos" ON storage.objects
    FOR INSERT TO authenticated
    WITH CHECK (bucket_id = 'videos' AND public.has_role(auth.uid(), 'owner'));

CREATE POLICY "Admins can update/delete videos" ON storage.objects
    FOR ALL TO authenticated
    USING (bucket_id = 'videos' AND public.has_role(auth.uid(), 'owner'));

-- Leitura pública se o vídeo associado no banco estiver publicado
-- Nota: Para simplificar esta fase 1, permitiremos leitura pública de qualquer objeto no bucket 'videos'
-- pois o controle de visibilidade já é feito na tabela public.videos
CREATE POLICY "Public can read videos" ON storage.objects
    FOR SELECT TO public
    USING (bucket_id = 'videos');
