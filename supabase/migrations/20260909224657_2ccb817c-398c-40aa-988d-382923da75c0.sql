DROP POLICY IF EXISTS "Public support can create AI logs" ON public.support_chat_log;

CREATE POLICY "Anon can create unattributed support AI logs"
ON public.support_chat_log FOR INSERT TO anon
WITH CHECK (user_id IS NULL);

CREATE POLICY "Authenticated can create own support AI logs"
ON public.support_chat_log FOR INSERT TO authenticated
WITH CHECK (user_id IS NULL OR user_id = auth.uid());