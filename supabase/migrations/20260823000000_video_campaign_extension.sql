-- Extend videos table
ALTER TABLE public.videos ADD COLUMN IF NOT EXISTS scheduled_for timestamptz;
ALTER TABLE public.videos ADD COLUMN IF NOT EXISTS campaign_id uuid REFERENCES public.campaigns(id) ON DELETE SET NULL;

-- Update RLS policies for videos to handle scheduled_for
DROP POLICY IF EXISTS "Anyone can view published videos" ON public.videos;
CREATE POLICY "Anyone can view published videos" 
ON public.videos FOR SELECT 
TO anon, authenticated
USING (
  status = 'published' AND 
  (scheduled_for IS NULL OR scheduled_for <= now())
);

DROP POLICY IF EXISTS "Admins can do everything with videos" ON public.videos;
CREATE POLICY "Admins can do everything with videos" 
ON public.videos FOR ALL 
TO authenticated
USING (public.has_role(auth.uid(), 'owner'));

-- VIDEO_LAUNCH is added after the canonical automation enum is created.

-- Update campaign funnel RPC to include video intelligence
CREATE OR REPLACE FUNCTION public.get_campaign_funnel(_campaign_id uuid)
RETURNS TABLE (
  channel text,
  awareness_count bigint,
  consideration_count bigint,
  video_views bigint,
  conversion_count bigint
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    cc.channel::text,
    COUNT(DISTINCT CASE WHEN ae.event_type = 'CAMPAIGN_VIEW' THEN ae.id END) as awareness_count,
    COUNT(DISTINCT CASE WHEN ae.event_type = 'PRODUCT_VIEW' THEN ae.id END) as consideration_count,
    COUNT(DISTINCT CASE WHEN ae.event_type = 'video_start' THEN ae.id END) as video_views,
    COUNT(DISTINCT CASE WHEN ae.event_type = 'OUTBOUND_CLICK' THEN ae.id END) as conversion_count
  FROM 
    public.campaign_channels cc
  LEFT JOIN 
    public.analytics_events ae ON ae.metadata->>'campaign_id' = _campaign_id::text 
    AND ae.metadata->>'utm_source' = cc.channel::text
  WHERE 
    cc.campaign_id = _campaign_id
  GROUP BY 
    cc.channel;
END;
$$;
