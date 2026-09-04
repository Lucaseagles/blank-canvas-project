import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useMemo } from "react";
import { getShareCardConfig, getShareTemplates, logShare, type ShareFormat, type SharePlatform } from "@/lib/supabase/sharing";

export function useSharing(userId?: string | null) {
  const queryClient = useQueryClient();
  const templates = useQuery({ queryKey: ["share-templates"], queryFn: getShareTemplates, staleTime: 60_000 });
  const cardConfig = useQuery({ queryKey: ["share-card-config"], queryFn: getShareCardConfig, staleTime: 60_000 });
  const logMutation = useMutation({
    mutationFn: ({ referralCode, platform, format }: { referralCode: string; platform: SharePlatform; format: ShareFormat }) => {
      if (!userId) throw new Error("Usuário não autenticado");
      return logShare(userId, referralCode, platform, format);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["share-history", userId] }),
  });
  const buildCaption = useCallback((template: (typeof templates.data)[number], values: { code: string; link: string; reward: string; userName: string }) => {
    if (!template) return "";
    return template.caption_template.replace(/{code}/g, values.code).replace(/{link}/g, values.link).replace(/{reward}/g, values.reward).replace(/{emoji}/g, "🎁");
  }, []);
  return useMemo(() => ({ templates: templates.data ?? [], config: cardConfig.data ?? null, loading: templates.isLoading || cardConfig.isLoading, error: templates.error ?? cardConfig.error, logShare: logMutation.mutateAsync, isLogging: logMutation.isPending, buildCaption }), [templates.data, templates.isLoading, templates.error, cardConfig.data, cardConfig.isLoading, cardConfig.error, logMutation.mutateAsync, logMutation.isPending, buildCaption]);
}
