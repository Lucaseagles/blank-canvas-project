-- Sprint 36: Campaign Attribution hardening
-- Keep attribution in the existing campaign analytics flow; no duplicate engine.
-- The RPC is SECURITY DEFINER because the admin server function uses the service role.
-- It is explicitly executable only by service_role.

CREATE OR REPLACE FUNCTION public.get_campaign_funnel(_campaign_id uuid)
RETURNS TABLE (
  channel text,
  awareness_count bigint,
  consideration_count bigint,
  video_views bigint,
  conversion_count bigint
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    cc.channel::text,
    COUNT(DISTINCT CASE WHEN ae.event_type = 'CAMPAIGN_VIEW' THEN ae.id END) AS awareness_count,
    COUNT(DISTINCT CASE WHEN ae.event_type = 'PRODUCT_VIEW' THEN ae.id END) AS consideration_count,
    COUNT(DISTINCT CASE WHEN ae.event_type = 'video_start' THEN ae.id END) AS video_views,
    COUNT(DISTINCT CASE WHEN ae.event_type = 'OUTBOUND_CLICK' THEN ae.id END) AS conversion_count
  FROM public.campaign_channels cc
  LEFT JOIN public.analytics_events ae
    ON ae.campaign_id = _campaign_id
    OR ae.metadata->>'campaign_id' = _campaign_id::text
  WHERE cc.campaign_id = _campaign_id
    AND cc.is_enabled = true
    AND (
      ae.id IS NULL
      OR ae.source = cc.channel::text
      OR ae.metadata->>'utm_source' = cc.channel::text
      OR ae.campaign_id = _campaign_id
    )
  GROUP BY cc.channel
  ORDER BY cc.channel;
$$;

REVOKE ALL ON FUNCTION public.get_campaign_funnel(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_campaign_funnel(uuid) TO service_role;
